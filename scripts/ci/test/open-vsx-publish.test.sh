#!/usr/bin/env bash
# Contract tests for Open VSX release-version propagation.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SCRIPT="$ROOT/scripts/ci/open-vsx-publish.sh"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

missing_version_output="$(
  cd "$ROOT"
  env -u BESKID_RELEASE_VERSION -u OVSX_TOKEN bash "$SCRIPT" linux-x64 beskid_lsp 2>&1
)" && fail "publisher accepted a missing BESKID_RELEASE_VERSION"
[[ "$missing_version_output" == *"BESKID_RELEASE_VERSION must be exported"* ]] || \
  fail "missing-version error did not identify BESKID_RELEASE_VERSION: $missing_version_output"

grep -Fq ': "${BESKID_RELEASE_VERSION:?BESKID_RELEASE_VERSION must be exported}"' "$SCRIPT" || \
  fail "publisher does not require BESKID_RELEASE_VERSION"
grep -Fq 'target="$BESKID_RELEASE_VERSION"' "$SCRIPT" || \
  fail "publisher does not use BESKID_RELEASE_VERSION as the extension version"
if grep -Fq 'git describe' "$SCRIPT" || grep -Fq 'git rev-list' "$SCRIPT"; then
  fail "publisher still resolves its version from git"
fi

# Exercise duplicate handling with a mocked toolchain. A retry may succeed only
# when the registry response names this exact publisher, extension, and version.
tmp="$(mktemp -d)"
trap 'rm -rf "${tmp}"' EXIT
mkdir -p "${tmp}/root/scripts/ci" "${tmp}/root/compiler" "${tmp}/root/beskid_vscode" "${tmp}/bin"
cp "$SCRIPT" "${tmp}/root/scripts/ci/"
printf '%s\n' '{"name":"beskid-vscode","version":"0.0.1","publisher":"beskid","icon":"icon.png"}' >"${tmp}/root/beskid_vscode/package.json"
touch "${tmp}/root/beskid_vscode/icon.png"

cat >"${tmp}/bin/cargo" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
mkdir -p target/release
touch target/release/beskid_lsp
SH
cat >"${tmp}/bin/bun" <<'SH'
#!/usr/bin/env bash
exit 0
SH
cat >"${tmp}/bin/bunx" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
case "$1" in
  ovsx)
    [[ "$2" == create-namespace ]] && exit 0
    if [[ "$2" == publish ]]; then
      printf '%s\n' "${OVSX_PUBLISH_OUTPUT}"
      exit "${OVSX_PUBLISH_CODE}"
    fi
    ;;
  @vscode/vsce)
    for ((i = 1; i <= $#; i++)); do
      if [[ "${!i}" == --out ]]; then
        next=$((i + 1))
        touch "${!next}"
        exit 0
      fi
    done
    ;;
esac
exit 0
SH
chmod +x "${tmp}/bin/cargo" "${tmp}/bin/bun" "${tmp}/bin/bunx"

run_publish() {
  PATH="${tmp}/bin:${PATH}" \
  BESKID_RELEASE_VERSION=9.8.7 OVSX_TOKEN=test \
  OVSX_PUBLISH_OUTPUT="$1" OVSX_PUBLISH_CODE=1 \
  bash "${tmp}/root/scripts/ci/open-vsx-publish.sh" linux-x64 beskid_lsp
}

if run_publish 'Extension other.beskid-vscode with version 9.8.7 already exists'; then
  fail "publisher accepted a duplicate response for a different extension"
fi
if run_publish 'Extension beskid.beskid-vscode with version 9.8.6 already exists'; then
  fail "publisher accepted a duplicate response for a different version"
fi
run_publish 'Extension beskid.beskid-vscode with version 9.8.7 already exists'
[[ "$(node -p "require('${tmp}/root/beskid_vscode/package.json').version")" == 0.0.1 ]] || \
  fail "publisher did not restore the extension version after packaging"

echo "PASS: Open VSX publisher uses the central version and validates duplicate identity"
