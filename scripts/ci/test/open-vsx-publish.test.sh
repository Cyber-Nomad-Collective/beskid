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

echo "PASS: Open VSX publisher uses the centrally resolved release version"
