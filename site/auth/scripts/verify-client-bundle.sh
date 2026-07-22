#!/usr/bin/env bash
# Fail if production client chunks contain secrets or SSR references missing CSS.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
assets="${root}/.output/public/assets"

bash "$(dirname "$0")/verify-build-assets.sh" "${root}"

if [[ ! -d "${assets}" ]]; then
	echo "verify-client-bundle: missing ${assets} — run 'pnpm run build' first" >&2
	exit 1
fi

shopt -s nullglob
files=( "${assets}"/*.js )
if [[ ${#files[@]} -eq 0 ]]; then
	echo "verify-client-bundle: no JS files under ${assets}" >&2
	exit 1
fi

if rg -l 'better-sqlite3|SESSION_SECRET|AUTH_HUB_SECRET|GITHUB_CLIENT_SECRET|env\.server' "${assets}"/*.js >/dev/null 2>&1; then
	echo "verify-client-bundle: forbidden symbols found in client assets:" >&2
	rg -n 'better-sqlite3|SESSION_SECRET|AUTH_HUB_SECRET|GITHUB_CLIENT_SECRET|env\.server' "${assets}"/*.js >&2 || true
	exit 1
fi

echo "verify-client-bundle: ok (${#files[@]} JS chunks)"
