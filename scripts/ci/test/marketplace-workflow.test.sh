#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/../../.." && pwd)"
workflow="${root}/.woodpecker/marketplace.yml"
runner="${root}/scripts/ci/test/run-woodpecker-tests.sh"

test -f "${workflow}"
grep -Fq 'BESKID_TASK == "marketplace-publish"' "${workflow}"
grep -Fq 'event: manual' "${workflow}"
grep -Fq 'branch: main' "${workflow}"
grep -Fq 'depth: 0' "${workflow}"
grep -Fq 'node:22.' "${workflow}"
grep -Fq 'from_secret: vsce_pat' "${workflow}"
test "$(grep -c 'from_secret:' "${workflow}")" -eq 1
grep -Fq 'marketplace-publish.py preflight' "${workflow}"
grep -Fq 'marketplace-publish.py publish' "${workflow}"
grep -Fq 'woodpecker-source-history.sh .' "${workflow}"
grep -Fq 'install --frozen-lockfile --ignore-workspace --ignore-scripts' "${workflow}"
grep -Fq 'marketplace-workflow' "${runner}"
grep -Fq 'marketplace-publish.test.py' "${runner}"
if grep -Eiq '^[[:space:]]+- .*(build|package-marketplace-editor|--target|--skip-duplicate|github|gh )' "${workflow}"; then
  echo 'Marketplace workflow must not rebuild, repackage, override targets, or download release inputs' >&2
  exit 1
fi

echo 'Marketplace Woodpecker workflow contract OK'
