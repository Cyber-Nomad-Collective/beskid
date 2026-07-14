#!/usr/bin/env bash
# Local pre-push checks for the authoritative platform delivery gates.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "==> platform delivery integration contracts"
bash scripts/ci/platform-integration-gate.sh
echo "==> OpenSpec authority"
bash scripts/ci/openspec-gate.sh
echo "==> conformance provenance"
bash scripts/ci/conformance-gate.sh
echo "==> supply-chain policy"
bash scripts/ci/security-policy-gate.sh

echo "validate-ci-local: OK"
