#!/usr/bin/env bash
# Contract: a platform release manifest contains exactly the five active image lanes.
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "${tmp}"' EXIT

write_manifest() {
  local output="$1"
  shift
  jq -n --argjson images "$1" '{
    schema_version: 1,
    source: {repository: "Cyber-Nomad-Collective/beskid", commit: "0123456789abcdef0123456789abcdef01234567"},
    build: {run_id: "123"},
    policy: {sbom_required: true, provenance_required: true, vulnerability_scan_required: true, signature_required: true},
    images: $images
  }' >"${output}"
}

canonical='[
  {"name":"beskid-site","repository":"cr.beskid-lang.org/beskid/site","digest":"sha256:1111111111111111111111111111111111111111111111111111111111111111","sbom":true,"provenance":true,"vulnerabilities":"passed","signed":true},
  {"name":"beskid-learn","repository":"cr.beskid-lang.org/beskid/learn","digest":"sha256:3333333333333333333333333333333333333333333333333333333333333333","sbom":true,"provenance":true,"vulnerabilities":"passed","signed":true},
  {"name":"beskid-tracker","repository":"cr.beskid-lang.org/beskid/tracker","digest":"sha256:4444444444444444444444444444444444444444444444444444444444444444","sbom":true,"provenance":true,"vulnerabilities":"passed","signed":true},
  {"name":"beskid-nexus","repository":"cr.beskid-lang.org/beskid/nexus","digest":"sha256:5555555555555555555555555555555555555555555555555555555555555555","sbom":true,"provenance":true,"vulnerabilities":"passed","signed":true},
  {"name":"beskid-pckg","repository":"cr.beskid-lang.org/beskid/pckg","digest":"sha256:6666666666666666666666666666666666666666666666666666666666666666","sbom":true,"provenance":true,"vulnerabilities":"passed","signed":true}
]'

write_manifest "${tmp}/canonical.json" "${canonical}"
"${root}/scripts/ci/validate-release-manifest.sh" "${tmp}/canonical.json" >/dev/null

mkdir -p "${tmp}/records"
while IFS= read -r record; do
  name="$(jq -r '.name' <<<"${record}")"
  printf '%s\n' "${record}" >"${tmp}/records/${name}.json"
done < <(jq -c '.[]' <<<"${canonical}")
GITHUB_REPOSITORY=Cyber-Nomad-Collective/beskid \
GITHUB_SHA=0123456789abcdef0123456789abcdef01234567 \
GITHUB_RUN_ID=123 \
SOURCE_DATE_EPOCH=0 \
  "${root}/scripts/ci/build-release-manifest.sh" "${tmp}/records" "${tmp}/built.json" >/dev/null
base64 <"${tmp}/built.json" | tr -d '\n' | base64 --decode >"${tmp}/decoded.json"
cmp "${tmp}/built.json" "${tmp}/decoded.json"
expected_sha256="$(awk '{print $1}' "${tmp}/built.json.sha256")"
actual_sha256="$(sha256sum "${tmp}/decoded.json" | awk '{print $1}')"
[[ "${actual_sha256}" == "${expected_sha256}" ]] || {
  echo 'base64 manifest round-trip did not preserve the emitted SHA-256' >&2
  exit 1
}

write_manifest "${tmp}/missing.json" "$(jq 'map(select(.name != "beskid-pckg"))' <<<"${canonical}")"
if "${root}/scripts/ci/validate-release-manifest.sh" "${tmp}/missing.json" >/dev/null 2>&1; then
  echo "manifest missing an active image lane unexpectedly passed" >&2
  exit 1
fi

write_manifest "${tmp}/retired.json" "$(jq '. + [{"name":"beskid-platform-spec","repository":"ghcr.io/cyber-nomad-collective/beskid-platform-spec","digest":"sha256:7777777777777777777777777777777777777777777777777777777777777777","sbom":true,"provenance":true,"vulnerabilities":"passed","signed":true}]' <<<"${canonical}")"
if "${root}/scripts/ci/validate-release-manifest.sh" "${tmp}/retired.json" >/dev/null 2>&1; then
  echo "manifest containing retired platform-spec lane unexpectedly passed" >&2
  exit 1
fi

echo "active release manifest lane contract OK"
