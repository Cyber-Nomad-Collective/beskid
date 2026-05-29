#!/usr/bin/env bash
# Assert root stylesheet in SSR router matches Nitro public assets map.
set -euo pipefail

root="${1:?app root directory containing .output}"
output="${root}/.output"
public="${output}/public/assets"
server="${output}/server"

if [[ ! -d "${public}" ]]; then
	echo "verify-build-assets: missing ${public}" >&2
	exit 1
fi

shopt -s nullglob
css_on_disk=( "${public}"/styles-*.css )
if [[ ${#css_on_disk[@]} -eq 0 ]]; then
	echo "verify-build-assets: no styles-*.css under ${public}" >&2
	exit 1
fi

if [[ ! -f "${server}/index.mjs" ]]; then
	echo "verify-build-assets: missing ${server}/index.mjs" >&2
	exit 1
fi

canonical="$(
	grep -oE '"/assets/styles-[^"]+\.css"' "${server}/index.mjs" | head -1 | tr -d '"'
)"
if [[ -z "${canonical}" ]]; then
	echo "verify-build-assets: no stylesheet entry in index.mjs" >&2
	exit 1
fi

css_file="${public}/${canonical#/assets/}"
if [[ ! -f "${css_file}" ]]; then
	echo "verify-build-assets: index.mjs references ${canonical} but ${css_file} is missing" >&2
	exit 1
fi

routers=( "${server}"/_ssr/router-*.mjs )
if [[ ${#routers[@]} -eq 0 ]]; then
	echo "verify-build-assets: no router bundle under ${server}/_ssr" >&2
	exit 1
fi

for router in "${routers[@]}"; do
	if ! grep -q "styles_default = \"${canonical}\"" "${router}"; then
		echo "verify-build-assets: ${router} does not reference ${canonical}" >&2
		grep -o 'styles_default = "/assets/styles-[^"]*"' "${router}" >&2 || true
		exit 1
	fi
done

echo "verify-build-assets: ok (${canonical##*/})"
