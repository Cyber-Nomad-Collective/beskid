#!/usr/bin/env bash
# Build Beskid's five platform images, preserving source and publication evidence.
set -euo pipefail

readonly registry='cr.beskid-lang.org' namespace='beskid'
readonly lanes=(site learn tracker nexus pckg)
readonly submodules=(compiler pckg beskid_bsol beskid_treesitter beskid_web_common beskid_tracker beskid_nexus)
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
real_pipeline=false
[[ -n "${CI_PIPELINE_NUMBER:-}" || -n "${CI_COMMIT_SHA:-}" ]] && real_pipeline=true
for suffix in ROOT SOURCE_SHA OUTPUT INIT_SUBMODULES; do
  variable="WOODPECKER_PLATFORM_${suffix}"
  if [[ "${real_pipeline}" == true && -n "${!variable:-}" ]]; then echo "${variable} is test-only and cannot be set in a Woodpecker pipeline" >&2; exit 2; fi
done
root="${WOODPECKER_PLATFORM_ROOT:-${root}}"
source_sha="${WOODPECKER_PLATFORM_SOURCE_SHA:-${CI_COMMIT_SHA:-$(git -C "${root}" rev-parse HEAD)}}"
pipeline_id="${CI_PIPELINE_NUMBER:-local}"
output="${WOODPECKER_PLATFORM_OUTPUT:-/woodpecker-output/platform/${pipeline_id}-${source_sha}}"
init_submodules="${WOODPECKER_PLATFORM_INIT_SUBMODULES:-${root}/scripts/ci/init-submodules.sh}"
[[ "${source_sha}" =~ ^[0-9a-f]{40}$ ]] || { echo 'Platform source commit must be a full lowercase Git SHA' >&2; exit 2; }
[[ "${BESKID_PLATFORM_DOCKER_TRUSTED:-}" == 1 ]] || { echo 'BESKID_PLATFORM_DOCKER_TRUSTED=1 is required before this workflow may access Docker' >&2; exit 3; }
command -v jq >/dev/null 2>&1 || { echo 'Platform workflow requires jq' >&2; exit 2; }
immutable_ref() { printf '%s/%s/%s:sha-%s' "${registry}" "${namespace}" "$1" "${source_sha}"; }
production_ref() { printf '%s/%s/%s:production' "${registry}" "${namespace}" "$1"; }
mkdir -p "${output}"
journal="${output}/platform-images.json"; gitlinks="${output}/source-gitlinks.tsv"; lanes_file="${output}/lanes.tsv"
phase=preflight status=running message='initializing' current_lane=''
: >"${gitlinks}"
for lane in "${lanes[@]}"; do printf '%s\tpending\t\t\n' "${lane}" >>"${lanes_file}"; done
write_journal() {
  jq -Rn --arg phase "${phase}" --arg status "${status}" --arg message "${message}" --arg source_commit "${source_sha}" --arg registry "${registry}/${namespace}" --arg lane "${current_lane}" '
    [inputs | split("\t") | select(length == 2) | {path: .[0], commit: .[1]}] as $gitlinks |
    {phase: $phase, status: $status, message: $message, current_lane: $lane, source: {commit: $source_commit, gitlinks: $gitlinks}, registry: $registry}' "${gitlinks}" |
    jq --slurpfile lanes <(jq -Rn '[inputs | split("\t") | {lane: .[0], status: .[1], expected_digest: .[2], published_digest: .[3]}]' "${lanes_file}") '. + {lanes: $lanes[0]}' >"${journal}.tmp"
  mv "${journal}.tmp" "${journal}"
}
set_lane() { awk -F '\t' -v OFS='\t' -v lane="$1" -v status="$2" -v expected="${3:-}" -v published="${4:-}" '$1 == lane {$2=status; $3=expected; $4=published} {print}' "${lanes_file}" >"${lanes_file}.tmp" && mv "${lanes_file}.tmp" "${lanes_file}"; }
fail() { phase="$1"; message="$2"; status=failed; write_journal; echo "${message}" >&2; exit 1; }
cleanup_docker_config() { [[ -z "${docker_config:-}" || ! -d "${docker_config}" ]] || rm -r -- "${docker_config}"; }
write_journal
cd "${root}"
"${init_submodules}" "${submodules[@]}" || fail preflight 'Required platform submodule initialization failed'
actual_root="$(git -C "${root}" rev-parse HEAD)"
[[ "${actual_root}" == "${source_sha}" ]] || fail preflight 'Checkout HEAD does not match the requested source commit'
if ! git -C "${root}" diff --quiet || ! git -C "${root}" diff --cached --quiet; then fail preflight 'Checkout has tracked changes'; fi
for path in "${submodules[@]}"; do
  expected="$(git -C "${root}" ls-tree -d HEAD -- "${path}" | awk '{print $3}')"; actual="$(git -C "${root}/${path}" rev-parse HEAD)"
  [[ "${expected}" =~ ^[0-9a-f]{40}$ && "${actual}" == "${expected}" ]] || fail preflight "Submodule ${path} does not match its source gitlink"
  if ! git -C "${root}/${path}" diff --quiet || ! git -C "${root}/${path}" diff --cached --quiet; then fail preflight "Submodule ${path} has tracked changes"; fi
  printf '%s\t%s\n' "${path}" "${actual}" >>"${gitlinks}"
done
phase=build; message='building immutable images'; write_journal
build_image() { local lane="$1" context="$2" dockerfile="$3" metadata="${output}/metadata-${1}.json"; shift 3; docker buildx build --load --provenance=mode=min --sbom=true --metadata-file "${metadata}" --file "${dockerfile}" --tag "$(immutable_ref "${lane}")" "$@" "${context}"; }
docker buildx version || fail build 'Docker Buildx is unavailable'
for lane in "${lanes[@]}"; do
  current_lane="${lane}"
  case "${lane}" in
    site) build_image site . site/website/Dockerfile --build-arg BESKID_RELEASE_CHANNEL=stable ;;
    learn) build_image learn . site/learn/Dockerfile --build-arg BESKID_RELEASE_CHANNEL=stable ;;
    tracker) build_image tracker beskid_tracker beskid_tracker/Dockerfile --build-context web_common=./beskid_web_common ;;
    nexus) build_image nexus beskid_nexus beskid_nexus/Dockerfile --build-context openspec=./openspec --build-context web_common=./beskid_web_common ;;
    pckg) build_image pckg . pckg/Dockerfile ;;
  esac || fail build "Build failed for ${lane}"
  expected="$(jq -r '."containerimage.digest" // empty' "${output}/metadata-${lane}.json")"
  [[ "${expected}" =~ ^sha256:[0-9a-f]{64}$ ]] || fail build "Build metadata lacks a manifest digest for ${lane}"
  set_lane "${lane}" built "${expected}"; write_journal
done
publish=false
[[ ( "${CI_PIPELINE_EVENT:-}" == push || "${CI_PIPELINE_EVENT:-}" == manual ) && "${CI_COMMIT_BRANCH:-}" == main && "${BESKID_PLATFORM_PUBLISH:-}" == 1 ]] && publish=true
if [[ "${publish}" != true ]]; then phase=complete; status=build-only; message='publication disabled'; current_lane=''; write_journal; echo 'Platform images built only; publication requires trusted main and BESKID_PLATFORM_PUBLISH=1.'; exit 0; fi
[[ -n "${REGISTRY_USERNAME:-}" && -n "${REGISTRY_PASSWORD:-}" ]] || fail publish 'REGISTRY_USERNAME and REGISTRY_PASSWORD are required for platform publication'
umask 077; docker_config="$(mktemp -d "${TMPDIR:-/tmp}/beskid-platform-docker-config.XXXXXX")"; trap cleanup_docker_config EXIT; export DOCKER_CONFIG="${docker_config}"
printf '%s' "${REGISTRY_PASSWORD}" | docker login "${registry}" --username "${REGISTRY_USERNAME}" --password-stdin || fail publish 'Registry authentication failed'
phase='publish-immutable'; message='publishing immutable images'; write_journal
for lane in "${lanes[@]}"; do
  current_lane="${lane}"; immutable="$(immutable_ref "${lane}")"; expected="$(awk -F '\t' -v lane="${lane}" '$1 == lane {print $3}' "${lanes_file}")"; probe_error="${output}/remote-${lane}.err"
  if remote="$(docker buildx imagetools inspect --format '{{.Manifest.Digest}}' "${immutable}" 2>"${probe_error}")"; then
    [[ "${remote}" == "${expected}" ]] || fail publish-immutable "Immutable tag already exists with a different digest for ${lane}"
    set_lane "${lane}" immutable-existing "${expected}" "${remote}"; write_journal; continue
  fi
  grep -Eqi '(not found|manifest unknown|name unknown)' "${probe_error}" || fail publish-immutable "Could not establish whether immutable tag exists for ${lane}"
  docker push "${immutable}" || fail publish-immutable "Immutable push failed for ${lane}"
  published="$(docker buildx imagetools inspect --format '{{.Manifest.Digest}}' "${immutable}")" || fail publish-immutable "Published immutable tag cannot be read for ${lane}"
  [[ "${published}" == "${expected}" ]] || fail publish-immutable "Published immutable digest differs for ${lane}"
  set_lane "${lane}" immutable-published "${expected}" "${published}"; write_journal
done
phase=promote-production; message='promoting verified immutable images'; write_journal
for lane in "${lanes[@]}"; do
  current_lane="${lane}"; immutable="$(immutable_ref "${lane}")"; production="$(production_ref "${lane}")"
  if ! docker pull "${immutable}" || ! docker image tag "${immutable}" "${production}" || ! docker push "${production}"; then fail promote-production "Production promotion failed for ${lane}"; fi
  set_lane "${lane}" production-promoted "$(awk -F '\t' -v lane="${lane}" '$1 == lane {print $3}' "${lanes_file}")" "$(awk -F '\t' -v lane="${lane}" '$1 == lane {print $4}' "${lanes_file}")"; write_journal
done
phase=complete; status=success; message='immutable images published before production promotion'; current_lane=''; write_journal
echo "Published immutable and production tags for ${source_sha}; Watchtower alone reconciles deployment."
