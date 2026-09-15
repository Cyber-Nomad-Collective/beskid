#!/usr/bin/env bash
# Full preflight tier: validate retained GitHub-native workflows and reusable
# build/release contracts without invoking external mutations.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${ROOT}"

command -v woodpecker-cli >/dev/null 2>&1 || {
  echo "full: woodpecker-cli is required; see docs/operations/woodpecker.md" >&2
  exit 1
}

woodpecker-cli lint --strict --plugins-trusted-clone plugin-git \
  --plugins-trusted-clone docker.io/woodpeckerci/plugin-git:2.10.1 .woodpecker
bash scripts/ci/test/run-cicd-foundation-tests.sh
echo "full: workflows and build/release contracts OK"
