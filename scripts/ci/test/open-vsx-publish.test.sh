#!/usr/bin/env bash
# Reject the retired source-rebuild marketplace publication bypass.
set -euo pipefail
root="$(cd "$(dirname "$0")/../../.." && pwd)"
test ! -e "${root}/scripts/ci/open-vsx-publish.sh"
test ! -e "${root}/.woodpecker/open-vsx.yml"
if grep -riEq 'open-vsx-publish|open_vsx_token|OVSX_TOKEN|ovsx publish' "${root}/.woodpecker"; then
  echo 'FAIL: Woodpecker must not rebuild or publish marketplace releases' >&2
  exit 1
fi
node --test "${root}/scripts/ci/test/package-editor-release.test.mjs"
echo 'PASS: Open VSX release preparation requires verified native evidence'
