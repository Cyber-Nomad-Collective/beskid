#!/usr/bin/env bash
# Full preflight tier: validate every workflow and the immutable delivery
# contracts without invoking jobs that can mutate external environments.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${ROOT}"

command -v actionlint >/dev/null 2>&1 || {
  echo "full: actionlint not installed (brew install actionlint)" >&2
  exit 1
}

actionlint .github/workflows/*.yml
bash scripts/ci/test/run-cicd-foundation-tests.sh
echo "full: workflows and immutable delivery contracts OK"
