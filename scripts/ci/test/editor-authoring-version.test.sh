#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
resolver="${root}/scripts/ci/resolve-editor-authoring-version.mjs"
tmp="$(mktemp -d "${TMPDIR:-/tmp}/beskid-editor-version.XXXXXX")"
trap 'rm -rf "${tmp}"' EXIT

mkdir -p "${tmp}/editors/zed" "${tmp}/beskid_vscode"
printf '%s\n' 'version = "0.4.598"' >"${tmp}/editors/zed/extension.toml"
printf '%s\n' '[package]' 'version = "0.4.598"' >"${tmp}/editors/zed/Cargo.toml"
printf '%s\n' '{"version":"0.4.598"}' >"${tmp}/beskid_vscode/package.json"
printf '%s\n' '{"version":"0.4.598","packages":{"":{"version":"0.4.598"}}}' >"${tmp}/beskid_vscode/package-lock.json"

[[ "$(node "${resolver}" "${tmp}" "${tmp}/beskid_vscode")" == "0.4.598" ]]
sed -i.bak 's/0\.4\.598/0.4.599/' "${tmp}/beskid_vscode/package.json"
if node "${resolver}" "${tmp}" "${tmp}/beskid_vscode" 2>"${tmp}/drift.err"; then
  echo 'resolver accepted divergent editor versions' >&2
  exit 1
fi
grep -Fq 'editor authoring versions must agree' "${tmp}/drift.err"

[[ "$(node "${resolver}" "${root}" "${root}/beskid_vscode")" == "0.4.598" ]]
grep -Fq 'aarch64-apple-darwin|x86_64-apple-darwin' "${root}/scripts/ci/build-release-artifact.sh"
grep -Fq 'trap restore_release_versions EXIT' "${root}/scripts/ci/build-release-artifact.sh"
[[ "$(grep -Fc 'trap ' "${root}/scripts/ci/build-release-artifact.sh")" == 1 ]]
echo 'Editor authoring version contract OK'
