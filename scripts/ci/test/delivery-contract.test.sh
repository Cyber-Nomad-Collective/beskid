#!/usr/bin/env bash
# Repository-controlled delivery contracts that do not need external credentials.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"

platform_dockerfile="${ROOT}/site/platform-spec/Dockerfile"

# Platform-spec installs with Corepack pnpm from its own package lock.
[[ -f "${ROOT}/site/platform-spec/package.json" ]]
rg -Fq 'packageManager": "pnpm@10.17.1"' "${ROOT}/site/platform-spec/package.json"
rg -Fq 'FROM node:22.12' "${platform_dockerfile}"
rg -Fq 'corepack prepare pnpm@10.17.1' "${platform_dockerfile}"
rg -Fq 'pnpm install --frozen-lockfile' "${platform_dockerfile}"
rg -Fq 'COPY --from=build /app/site/platform-spec/node_modules ./node_modules' "${platform_dockerfile}"
if rg -Fq 'oven/bun' "${platform_dockerfile}"; then
	echo "platform-spec Dockerfile must not use oven/bun after Node cutover" >&2
	exit 1
fi
if rg -Fq 'bun.lock' "${platform_dockerfile}"; then
	echo "platform-spec Dockerfile must not require root bun.lock" >&2
	exit 1
fi

if rg -Fq 'RUN bun run --cwd site/platform-spec' "${platform_dockerfile}"; then
	echo "platform-spec build commands must be relative to their configured WORKDIR" >&2
	exit 1
fi

# A retry after an already-published platform VSIX must verify the target identity.
bash "${ROOT}/scripts/ci/test/open-vsx-publish.test.sh"

# Compiler CI mints the single 0.4.<build> version; delivery consumers must
# receive that exact emitted value rather than resolving a second version.
bash "${ROOT}/scripts/ci/test/resolve-beskid-version.test.sh"
bash "${ROOT}/scripts/ci/test/release-version-contract.test.sh"

echo "delivery contracts OK"
