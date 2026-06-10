#!/usr/bin/env bash
# Align SSR router stylesheet href with the Nitro public asset map (index.mjs).
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
server="${root}/.output/server"
public="${root}/.output/public/assets"

if [[ ! -f "${server}/index.mjs" ]]; then
	echo "sync-root-stylesheet: missing ${server}/index.mjs" >&2
	exit 1
fi

canonical="$(
	grep -oE '"/assets/styles-[^"]+\.css"' "${server}/index.mjs" | head -1 | tr -d '"'
)"
if [[ -z "${canonical}" ]]; then
	echo "sync-root-stylesheet: no stylesheet entry in index.mjs" >&2
	exit 1
fi

css_file="${public}/${canonical#/assets/}"
if [[ ! -f "${css_file}" ]]; then
	echo "sync-root-stylesheet: ${css_file} is missing" >&2
	exit 1
fi

shopt -s nullglob
routers=( "${server}"/_ssr/router-*.mjs )
if [[ ${#routers[@]} -eq 0 ]]; then
	echo "sync-root-stylesheet: no router bundle under ${server}/_ssr" >&2
	exit 1
fi

for router in "${routers[@]}"; do
	sed -E "s|styles_default = \"/assets/styles-[^\"]+\.css\"|styles_default = \"${canonical}\"|g" \
		"${router}" > "${router}.tmp"
	mv "${router}.tmp" "${router}"
done

echo "sync-root-stylesheet: ok (${canonical##*/})"
