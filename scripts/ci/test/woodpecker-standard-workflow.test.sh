#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
WORKFLOW="${ROOT}/.woodpecker/linux.yml"

test -f "${WORKFLOW}"
grep -Fq 'platform: linux/amd64' "${WORKFLOW}"
grep -Fq 'backend: docker' "${WORKFLOW}"
grep -Fq 'role: beskid-linux' "${WORKFLOW}"
grep -Fq 'recursive: false' "${WORKFLOW}"
grep -Fq 'node:22.16.0-bookworm' "${WORKFLOW}"
grep -Fq 'pnpm@10.17.1+sha512.17c560fca4867ae9473a3899ad84a88334914f379be46d455cbf92e5cf4b39d34985d452d2583baf19967fa76cb5c17bc9e245529d0b98745721aa7200ecaf7a' "${WORKFLOW}"
grep -Fq 'bash scripts/ci/woodpecker-standard.sh' "${WORKFLOW}"
grep -Fq 'event: [push, tag]' "${WORKFLOW}"
grep -Fq 'event: manual' "${WORKFLOW}"
grep -Fq 'BESKID_TASK == "validate"' "${WORKFLOW}"

if grep -Eiq 'pull_request|from_secret|GH_TOKEN|S3|rclone|pnpm install' "${WORKFLOW}"; then
  echo 'combined Linux workflow must not expose credentials or install the workspace' >&2
  exit 1
fi

echo 'Woodpecker standard workflow contract tests OK'
