#!/usr/bin/env bash
# Contract for scripts/ci/corelib-package-builds.sh: every package of the materialized Corelib
# copy is built standalone in its own directory, schema-only projects are skipped, and any
# failing build fails the gate with its log tail. A fake CLI stands in for beskid.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
# shellcheck source=lib/assert.sh
source "${ROOT}/scripts/ci/test/lib/assert.sh"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
run() { set +e; out="$("$@" 2>&1)"; code=$?; set -e; }
GATE="$ROOT/scripts/ci/corelib-package-builds.sh"

cat >"$tmp/beskid" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
if [[ "$1 $2" == "dev corelib" ]]; then
  out="$4"
  for package in alpha beta schema; do mkdir -p "$out/packages/$package"; done
  printf 'alpha { name = "alpha" }\n' >"$out/packages/alpha/alpha.bproj"
  printf 'beta { name = "beta" }\n' >"$out/packages/beta/beta.bproj"
  printf 'schema {\n  name = "schema"\n  type = Bsol\n}\n' >"$out/packages/schema/schema.bproj"
  exit 0
fi
[[ "$1" == build && "$2" == --plain ]] || exit 9
[[ "$BESKID_CORELIB_ROOT" == "$(cd ../.. && pwd)" ]] || { echo "wrong Corelib root" >&2; exit 8; }
package="$(basename "$PWD")"
echo "built $package" >>"$BESKID_CORELIB_ROOT/../built.txt"
if [[ "$package" == "${FAIL_PACKAGE:-}" ]]; then
  echo "E2102"
  echo "  x internal compiler error: the compiler cannot lower this call expression yet"
  exit 1
fi
SH
chmod +x "$tmp/beskid"

run bash "$GATE" "$tmp/beskid" "$tmp/pass"
assert_eq 0 "$code" "every package builds"
assert_contains "$out" "ok   alpha" "alpha is built"
assert_contains "$out" "ok   beta" "beta is built"
assert_contains "$out" "skip schema (schema-only Bsol project)" "schema-only projects are skipped"
assert_contains "$out" "2/2 passed" "the summary counts buildable packages"
assert_eq "built alpha
built beta" "$(sort "$tmp/pass/built.txt")" "each package is built once, in its own directory"

FAIL_PACKAGE=beta run bash "$GATE" "$tmp/beskid" "$tmp/fail"
assert_eq 1 "$code" "a failing package fails the gate"
assert_contains "$out" "FAIL beta (exit 1)" "the failing package is named"
assert_contains "$out" "internal compiler error" "its log tail is shown"
assert_contains "$out" "1/2 passed" "the summary counts the failure"

mkdir -p "$tmp/used"; touch "$tmp/used/stale"
run bash "$GATE" "$tmp/beskid" "$tmp/used"
assert_eq 2 "$code" "a non-empty work directory is refused"
run bash "$GATE" "$tmp/missing-cli"
assert_eq 2 "$code" "a missing CLI is a usage error"

finish_tests
