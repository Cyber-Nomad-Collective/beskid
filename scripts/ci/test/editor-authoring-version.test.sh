#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
resolver="${root}/scripts/ci/resolve-editor-authoring-version.mjs"
tmp="$(mktemp -d "${TMPDIR:-/tmp}/beskid-editor-version.XXXXXX")"
trap 'rm -rf "${tmp}"' EXIT

mkdir -p "${tmp}/editors/zed" "${tmp}/beskid_vscode"
printf '%s\n' 'version = "0.4.0"' >"${tmp}/editors/zed/extension.toml"
printf '%s\n' '[package]' 'version = "0.4.0"' >"${tmp}/editors/zed/Cargo.toml"
printf '%s\n' '{"version":"0.4.0"}' >"${tmp}/beskid_vscode/package.json"
printf '%s\n' '{"version":"0.4.0","packages":{"":{"version":"0.4.0"}}}' >"${tmp}/beskid_vscode/package-lock.json"

[[ "$(node "${resolver}" "${tmp}" "${tmp}/beskid_vscode")" == "0.4.0" ]]
sed -i.bak 's/0\.4\.0/0.4.1/' "${tmp}/beskid_vscode/package.json"
if node "${resolver}" "${tmp}" "${tmp}/beskid_vscode" 2>"${tmp}/drift.err"; then
  echo 'resolver accepted divergent editor versions' >&2
  exit 1
fi
grep -Fq 'editor authoring versions must agree' "${tmp}/drift.err"

[[ "$(node "${resolver}" "${root}" "${root}/beskid_vscode")" == "0.6.6" ]]
grep -Fq 'aarch64-apple-darwin|x86_64-apple-darwin' "${root}/scripts/ci/build-release-artifact.sh"
grep -Fq 'trap cleanup_release_stage EXIT' "${root}/scripts/ci/build-release-artifact.sh"
# The release build verifies checked-in crate versions; it never stamps manifests.
grep -Fq 'does not match compiler/${cargo_toml} version' "${root}/scripts/ci/build-release-artifact.sh"
! grep -Eq 'sed -i|Set-Content' "${root}/scripts/ci/build-release-artifact.sh"
[[ "$(grep -Fc 'trap ' "${root}/scripts/ci/build-release-artifact.sh")" == 1 ]]
echo 'Editor authoring version contract OK'
