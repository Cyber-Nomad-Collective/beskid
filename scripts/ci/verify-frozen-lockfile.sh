#!/usr/bin/env bash
# Fail when package.json and bun.lock are out of sync (CI guard).
#
# Usage:
#   ./scripts/ci/verify-frozen-lockfile.sh [directory ...]
#   ./scripts/ci/verify-frozen-lockfile.sh   # default targets below
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUPERREPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

DEFAULT_TARGETS=(
	"${SUPERREPO_ROOT}"
	"${SUPERREPO_ROOT}/beskid_tracker"
	"${SUPERREPO_ROOT}/site/auth"
	"${SUPERREPO_ROOT}/beskid_nexus/gitnexus"
	"${SUPERREPO_ROOT}/beskid_nexus/gitnexus-web"
)

targets=("${DEFAULT_TARGETS[@]}")
if [[ $# -gt 0 ]]; then
	targets=("$@")
fi

if ! command -v bun >/dev/null 2>&1; then
	echo "bun is required on PATH" >&2
	exit 1
fi

for dir in "${targets[@]}"; do
	if [[ ! -f "${dir}/package.json" ]]; then
		echo "skip ${dir} (no package.json)" >&2
		continue
	fi
	if [[ ! -f "${dir}/bun.lock" ]]; then
		echo "skip ${dir} (no bun.lock)" >&2
		continue
	fi
	echo "==> verify frozen lockfile: ${dir}"
	(
		cd "${dir}"
		bun install --frozen-lockfile >/dev/null
	)
done

echo "All lockfiles match package.json"
