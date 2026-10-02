#!/usr/bin/env bash
# The reviewed prebuilt marketplace publisher is a Woodpecker-only lane.
set -euo pipefail
root="$(cd "$(dirname "$0")/../../.." && pwd)"
test ! -e "${root}/scripts/ci/open-vsx-publish.sh"
test -f "${root}/.woodpecker/editor.yml"
test ! -e "${root}/.github/workflows/editor-marketplace-publish.yml"
grep -Fq 'BESKID_TASK == "editor-publish"' "${root}/.woodpecker/editor.yml"
grep -Fq 'from_secret: open_vsx_token' "${root}/.woodpecker/editor.yml"
if grep -riEq 'GITHUB_EVENT_NAME|GITHUB_REF|GITHUB_REPOSITORY|GH_TOKEN|OVSX_TOKEN' "${root}/.woodpecker/editor.yml"; then
  echo 'FAIL: editor publication must use trusted Woodpecker context and the existing secret metadata' >&2
  exit 1
fi
node --test "${root}/scripts/ci/test/package-editor-release.test.mjs"
python3 "${root}/scripts/ci/test/prebuilt-editor-publish.test.py"
echo 'PASS: Woodpecker Open VSX release preparation requires verified native evidence'
