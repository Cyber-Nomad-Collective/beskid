#!/usr/bin/env bash
# Repository-controlled delivery contracts that do not need external credentials.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"

platform_dockerfile="${ROOT}/site/platform-spec/Dockerfile"
open_vsx_script="${ROOT}/scripts/ci/open-vsx-publish.sh"

# The superrepo owns the only Bun lockfile for the platform-spec workspace.
[[ -f "${ROOT}/bun.lock" ]]
[[ ! -e "${ROOT}/site/platform-spec/bun.lock" ]]
rg -Fq 'COPY package.json bun.lock .npmrc ./' "${platform_dockerfile}"
if rg -Fq 'site/platform-spec/bun.lock' "${platform_dockerfile}"; then
	echo "platform-spec Dockerfile must use the root Bun lockfile" >&2
	exit 1
fi

# A retry after an already-published platform VSIX must be successful.
rg -Fq 'already exists' "${open_vsx_script}"
rg -Fq 'Open VSX: artifact already exists' "${open_vsx_script}"

echo "delivery contracts OK"
