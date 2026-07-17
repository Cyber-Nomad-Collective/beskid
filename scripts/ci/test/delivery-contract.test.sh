#!/usr/bin/env bash
# Repository-controlled delivery contracts that do not need external credentials.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"

platform_dockerfile="${ROOT}/site/platform-spec/Dockerfile"

# The superrepo owns the only Bun lockfile for the platform-spec workspace.
[[ -f "${ROOT}/bun.lock" ]]
[[ ! -e "${ROOT}/site/platform-spec/bun.lock" ]]
rg -Fq 'COPY package.json bun.lock .npmrc ./' "${platform_dockerfile}"
if rg -Fq 'site/platform-spec/bun.lock' "${platform_dockerfile}"; then
	echo "platform-spec Dockerfile must use the root Bun lockfile" >&2
	exit 1
fi
rg -Fq 'COPY --from=build /app/node_modules /app/node_modules' "${platform_dockerfile}"
if rg -Fq 'COPY --from=build /app/site/platform-spec/node_modules' "${platform_dockerfile}"; then
	echo "platform-spec runtime must copy the root workspace node_modules" >&2
	exit 1
fi

if rg -Fq 'RUN bun run --cwd site/platform-spec' "${platform_dockerfile}"; then
	echo "platform-spec build commands must be relative to their configured WORKDIR" >&2
	exit 1
fi

# A retry after an already-published platform VSIX must verify the target identity.
bash "${ROOT}/scripts/ci/test/open-vsx-publish.test.sh"

echo "delivery contracts OK"
