#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
WORKFLOW="${ROOT}/.woodpecker/javascript.yml"

test -f "${WORKFLOW}"

reject_pattern() {
  local pattern="$1"
  local file="$2"
  if grep -Eq "${pattern}" "${file}"; then
    printf 'Forbidden workflow pattern found: %s\n' "${pattern}" >&2
    exit 1
  fi
}

grep -Fq 'image: node:22.16.0-bookworm' "${WORKFLOW}"
grep -Fq 'corepack prepare pnpm@10.17.1 --activate' "${WORKFLOW}"
grep -Fq 'apt-get install -y --no-install-recommends build-essential ca-certificates curl git python3 unzip' "${WORKFLOW}"
grep -Fq 'https://github.com/oven-sh/bun/releases/download/bun-v1.3.0/bun-linux-x64-baseline.zip' "${WORKFLOW}"
grep -Fq '77336611905b9e876e52924f8b1a57e72669cf10541dc1e11269d2c9371f9e45  /tmp/bun.zip' "${WORKFLOW}"
grep -Fq 'bash scripts/ci/init-submodules.sh beskid_web_common' "${WORKFLOW}"
grep -Fq 'bash scripts/ci/init-submodules.sh beskid_treesitter' "${WORKFLOW}"
grep -Fq 'bash scripts/ci/woodpecker-javascript.sh shared' "${WORKFLOW}"
grep -Fq 'bash scripts/ci/woodpecker-javascript.sh treesitter' "${WORKFLOW}"
grep -Fq 'node scripts/ci/prebuilt-javascript-publish.mjs prepare shared "$${snapshot}"' "${WORKFLOW}"
grep -Fq 'node scripts/ci/prebuilt-javascript-publish.mjs prepare treesitter "$${snapshot}"' "${WORKFLOW}"
grep -Fq 'node scripts/ci/prebuilt-javascript-publish.mjs verify shared "$${snapshot}"' "${WORKFLOW}"
grep -Fq 'node scripts/ci/prebuilt-javascript-publish.mjs verify treesitter "$${snapshot}"' "${WORKFLOW}"
grep -Fq 'node scripts/ci/prebuilt-javascript-publish.mjs publish shared "$${snapshot}"' "${WORKFLOW}"
grep -Fq 'node scripts/ci/prebuilt-javascript-publish.mjs publish treesitter "$${snapshot}"' "${WORKFLOW}"
grep -Fq 'snapshot="/woodpecker-output/javascript-$${CI_PIPELINE_NUMBER}-$${CI_COMMIT_SHA}/shared"' "${WORKFLOW}"
grep -Fq 'snapshot="/woodpecker-output/javascript-$${CI_PIPELINE_NUMBER}-$${CI_COMMIT_SHA}/treesitter"' "${WORKFLOW}"

for task in shared-packages-publish treesitter-publish; do
  grep -Fq "BESKID_TASK == \"${task}\"" "${WORKFLOW}"
done
grep -Fq 'event: [push, pull_request]' "${WORKFLOW}"
grep -Fq 'event: manual' "${WORKFLOW}"
grep -Fq 'ref: refs/heads/main' "${WORKFLOW}"
grep -Fq 'CI_REPO == "Cyber-Nomad-Collective/beskid"' "${WORKFLOW}"

step_block() {
  local step="$1"
  awk -v step="${step}" '
    $0 == "  - name: " step { in_step = 1 }
    in_step && $0 ~ /^  - name: / && $0 != "  - name: " step { exit }
    in_step { print }
  ' "${WORKFLOW}"
}

for step in prepare-shared-packages prepare-treesitter; do
  block="$(step_block "${step}")"
  grep -Fq 'prepare ' <<<"${block}"
  if grep -Eq 'from_secret|NODE_AUTH_TOKEN|github_packages_publish_token' <<<"${block}"; then
    printf 'Preparation step received publisher credentials: %s\n' "${step}" >&2
    exit 1
  fi
done

block="$(step_block validate-treesitter-release)"
grep -Fq 'image: node:22.16.0-bookworm' <<<"${block}"
grep -Fq 'bun-v1.3.0/bun-linux-x64-baseline.zip' <<<"${block}"
grep -Fq 'bash scripts/ci/woodpecker-javascript.sh treesitter' <<<"${block}"
if grep -Eq 'from_secret|NODE_AUTH_TOKEN|github_packages_publish_token' <<<"${block}"; then
  printf 'Tree-sitter validation received publisher credentials\n' >&2
  exit 1
fi

for step in publish-shared-packages publish-treesitter; do
  block="$(step_block "${step}")"
  grep -Fq 'NODE_AUTH_TOKEN:' <<<"${block}"
  grep -Fq 'from_secret: github_packages_publish_token' <<<"${block}"
  grep -Fq 'publish ' <<<"${block}"
done

test "$(grep -c 'from_secret: github_packages_publish_token' "${WORKFLOW}")" -eq 2
reject_pattern 'GITHUB_TOKEN|NPM_TOKEN|GH_TOKEN|version_input|BESKID_PACKAGE_VERSION|workflow_dispatch' "${WORKFLOW}"
reject_pattern 'npm install --global' "${WORKFLOW}"
reject_pattern '\|\| pnpm' "${WORKFLOW}"
reject_pattern '\|\| bun' "${WORKFLOW}"

test ! -e "${ROOT}/beskid_web_common/.github/workflows/ci.yml"
test ! -e "${ROOT}/beskid_web_common/.github/workflows/publish.yml"
test ! -e "${ROOT}/beskid_web_common/scripts/test-publish-package-list.sh"
test ! -e "${ROOT}/beskid_treesitter/.github/workflows/publish.yml"

printf 'Woodpecker JavaScript workflow fixtures OK\n'
