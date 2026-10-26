#!/usr/bin/env bash
# Build every Corelib package standalone: `beskid build` inside each package directory of a
# sealed Corelib copy (`beskid dev corelib --output`, the layout an installed toolchain uses),
# as a user does after `cd <corelib>/packages/<package>`. Each build must succeed; an internal
# compiler error, a panic or any other failure fails the gate. Schema-only (`type = Bsol`)
# projects have no Beskid source to build and are skipped.
#
# Usage: corelib-package-builds.sh <beskid-cli> [work-dir]
#   beskid-cli  the CLI under test (its embedded Corelib is materialized)
#   work-dir    empty or absent directory for the Corelib copy (default: a temporary one)
# Environment: BESKID_RUNTIME_PREFIX (runtime kit for linked library outputs),
#   CORELIB_PACKAGE_BUILD_JOBS (parallel builds, default 4),
#   CORELIB_PACKAGE_BUILD_TIMEOUT (seconds per package, default 900).
set -euo pipefail

CLI="${1:?usage: corelib-package-builds.sh <beskid-cli> [work-dir]}"
[[ -x "$CLI" ]] || { echo "corelib-package-builds: $CLI is not an executable file" >&2; exit 2; }
work="${2:-}"
if [[ -z "$work" ]]; then
  work="$(mktemp -d "${RUNNER_TEMP:-${TMPDIR:-/tmp}}/corelib-package-builds.XXXXXX")"
fi
mkdir -p "$work"
[[ -z "$(find "$work" -mindepth 1 -print -quit)" ]] || { echo "corelib-package-builds: $work is not empty" >&2; exit 2; }
corelib="$work/corelib"
logs="$work/logs"
mkdir -p "$logs"

BESKID_CORELIB_ROOT="$corelib" "$CLI" dev corelib --output "$corelib" >"$logs/materialize.log" 2>&1 || {
  cat "$logs/materialize.log" >&2
  echo "corelib-package-builds: materializing the Corelib copy failed" >&2
  exit 1
}

# One line per package directory that holds exactly one Beskid-source project.
packages=()
skipped=()
for directory in "$corelib"/packages/*/; do
  directory="${directory%/}"
  manifests=("$directory"/*.bproj)
  [[ -f "${manifests[0]}" && ${#manifests[@]} -eq 1 ]] || {
    echo "corelib-package-builds: $directory must hold exactly one .bproj" >&2
    exit 1
  }
  if grep -Eq '^[[:space:]]*type[[:space:]]*=[[:space:]]*"?Bsol"?[[:space:]]*$' "${manifests[0]}"; then
    skipped+=("$(basename "$directory")")
  else
    packages+=("$(basename "$directory")")
  fi
done
(( ${#packages[@]} > 0 )) || { echo "corelib-package-builds: no Corelib packages found" >&2; exit 1; }

timeout_cmd=()
if command -v timeout >/dev/null 2>&1; then
  timeout_cmd=(timeout --kill-after=30s "${CORELIB_PACKAGE_BUILD_TIMEOUT:-900}")
fi
export CLI corelib logs
export TIMEOUT_CMD="${timeout_cmd[*]}"
build_one() {
  local package="$1" rc=0
  # shellcheck disable=SC2086 # TIMEOUT_CMD is a word list on purpose.
  (cd "$corelib/packages/$package" && BESKID_CORELIB_ROOT="$corelib" $TIMEOUT_CMD "$CLI" build --plain) \
    >"$logs/$package.log" 2>&1 || rc=$?
  printf '%s %s\n' "$package" "$rc"
}
export -f build_one
results="$(printf '%s\n' "${packages[@]}" | xargs -P "${CORELIB_PACKAGE_BUILD_JOBS:-4}" -I{} bash -c 'build_one "$1"' _ {} | sort)"

failed=0
while read -r package rc; do
  if [[ "$rc" == 0 ]]; then
    echo "  ok   $package"
  else
    failed=$((failed + 1))
    echo "  FAIL $package (exit $rc)"
    grep -v '^[0-9]\{4\}-[0-9][0-9]-[0-9][0-9]T' "$logs/$package.log" | tail -n 25 | sed 's/^/       /'
  fi
done <<<"$results"
for package in "${skipped[@]+"${skipped[@]}"}"; do
  echo "  skip $package (schema-only Bsol project)"
done
echo "Corelib standalone package builds: $((${#packages[@]} - failed))/${#packages[@]} passed (logs: $logs)"
(( failed == 0 ))
