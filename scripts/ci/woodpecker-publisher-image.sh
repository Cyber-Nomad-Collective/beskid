#!/usr/bin/env bash
# Build and push the release publisher plugin image (ci/plugins/release-publisher).
#
# The image is tagged cr.beskid-lang.org/beskid/release-publisher:<VERSION> (the
# VERSION file beside its Dockerfile) and :sha-<source commit>. A version tag is
# immutable: when it already exists the script only reports its digest, and a
# rebuild of a changed image needs a new VERSION. The published manifest digest
# is written to <output>/publisher-image.json and printed as the reference that
# the publication steps pin (`image: <name>:<VERSION>@sha256:...`).
#
# Env: BESKID_PLATFORM_DOCKER_TRUSTED=1 (required before Docker access),
#      REGISTRY_USERNAME and REGISTRY_PASSWORD (protected registry secrets).
# Never enable xtrace here and never print the environment.
set -euo pipefail
set +x

readonly registry='cr.beskid-lang.org' repository='beskid/release-publisher'
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
context="${root}/ci/plugins/release-publisher"
source_sha="${CI_COMMIT_SHA:-$(git -C "${root}" rev-parse HEAD)}"
output="/woodpecker-output/publisher-image/${CI_PIPELINE_NUMBER:-local}-${source_sha}"
fail() { echo "publisher image: $*" >&2; exit 1; }

[[ "${source_sha}" =~ ^[0-9a-f]{40}$ ]] || fail 'source commit must be a full lowercase Git SHA'
[[ "${BESKID_PLATFORM_DOCKER_TRUSTED:-}" == 1 ]] || fail 'BESKID_PLATFORM_DOCKER_TRUSTED=1 is required before Docker access'
[[ "$(git -C "${root}" rev-parse HEAD)" == "${source_sha}" ]] || fail 'checkout HEAD does not match the source commit'
git -C "${root}" diff --quiet HEAD -- ci/plugins/release-publisher || fail 'the image context has tracked changes'
version="$(tr -d '[:space:]' <"${context}/VERSION")"
[[ "${version}" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || fail 'VERSION must be MAJOR.MINOR.PATCH'
[[ "${CI_PIPELINE_EVENT:-}" == manual && "${CI_COMMIT_BRANCH:-}" == main ]] || fail 'publication requires a manual main pipeline'
[[ -n "${REGISTRY_USERNAME:-}" && -n "${REGISTRY_PASSWORD:-}" ]] || fail 'REGISTRY_USERNAME and REGISTRY_PASSWORD are required'

image="${registry}/${repository}"
release_ref="${image}:${version}"
source_ref="${image}:sha-${source_sha}"
mkdir -p "${output}"

umask 077
docker_config="$(mktemp -d "${TMPDIR:-/tmp}/beskid-publisher-docker-config.XXXXXX")"
trap 'rm -rf -- "${docker_config}"' EXIT
export DOCKER_CONFIG="${docker_config}"
printf '%s' "${REGISTRY_PASSWORD}" | docker login "${registry}" --username "${REGISTRY_USERNAME}" --password-stdin >/dev/null ||
  fail 'registry authentication failed'

manifest_digest() {
  local formatted
  formatted="$(docker buildx imagetools inspect --format '{{json .Manifest}}' "$1")" || return
  if [[ "${formatted}" =~ ^sha256:[0-9a-f]{64}$ ]]; then printf '%s\n' "${formatted}"; else jq -er '.digest // empty' <<<"${formatted}"; fi
}

probe_error="${output}/probe.err"
if digest="$(manifest_digest "${release_ref}" 2>"${probe_error}")"; then
  echo "${release_ref} already exists; a changed image needs a new VERSION"
  state=existing
else
  grep -Eqi '(not found|manifest unknown|name unknown)' "${probe_error}" || fail "could not establish whether ${release_ref} exists"
  docker buildx build --load --provenance=false --sbom=false --metadata-file "${output}/metadata.json" \
    --tag "${release_ref}" --tag "${source_ref}" "${context}" || fail 'build failed'
  docker push "${release_ref}" || fail "push of ${release_ref} failed"
  docker push "${source_ref}" || fail "push of ${source_ref} failed"
  digest="$(manifest_digest "${release_ref}")" || fail 'the pushed image cannot be read back'
  state=published
fi
[[ "${digest}" =~ ^sha256:[0-9a-f]{64}$ ]] || fail 'the registry returned an invalid digest'

jq -n --arg image "${image}" --arg version "${version}" --arg digest "${digest}" --arg source "${source_sha}" --arg state "${state}" \
  '{image: $image, version: $version, digest: $digest, reference: "\($image):\($version)@\($digest)", source_commit: $source, state: $state}' \
  >"${output}/publisher-image.json"
echo "publisher image ${state}: ${release_ref}@${digest}"
