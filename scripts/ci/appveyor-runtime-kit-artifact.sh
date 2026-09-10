#!/usr/bin/env bash
# Publish or restore one exact-build native runtime kit across hosted AppVeyor jobs.
set -euo pipefail

readonly PRODUCER_JOB='linux-runtime-kit-build'
readonly ARTIFACT_DIRECTORY='.appveyor-artifacts'
readonly ARCHIVE_NAME='native-runtime-kit.tar.gz'
readonly MANIFEST_NAME='native-runtime-kit-manifest.json'

fail() {
  printf 'runtime-kit artifact: %s\n' "$1" >&2
  exit 1
}

require_value() {
  local name="$1"
  [[ -n "${!name:-}" ]] || fail "required environment variable ${name} is unset"
}

sha256_file() {
  local path="$1"
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "${path}" | awk '{print $1}'
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "${path}" | awk '{print $1}'
  else
    fail 'SHA-256 tool is unavailable'
  fi
}

url_encode_path() {
  jq -rn --arg value "$1" '$value | split("/") | map(@uri) | join("/")'
}

download_listed_artifact() {
  local api="$1"
  local producer_job_id="$2"
  local artifact_list="$3"
  local basename="$4"
  local destination="$5"
  local file_name encoded_file_name
  file_name="$(
    jq -er --arg basename "${basename}" '
      .[] | select((.fileName | split("/") | last) == $basename) | .fileName
    ' "${artifact_list}"
  )" || fail "runtime-kit artifact listing has no ${basename}"
  encoded_file_name="$(url_encode_path "${file_name}")"
  curl -fsSL "${api}/buildjobs/${producer_job_id}/artifacts/${encoded_file_name}" -o "${destination}"
}

publish_artifact() {
  require_value APPVEYOR_BUILD_VERSION
  require_value APPVEYOR_REPO_COMMIT
  require_value APPVEYOR_JOB_ID
  require_value APPVEYOR_BUILD_WORKER_IMAGE

  local source="${BESKID_RUNTIME_KIT_SOURCE:-}"
  local output="${BESKID_RUNTIME_KIT_ARTIFACT_DIR:-.appveyor-artifacts}"
  local target="${BESKID_RUNTIME_KIT_TARGET:-x86_64-unknown-linux-gnu}"
  local profile="${BESKID_RUNTIME_KIT_PROFILE:-debug}"
  [[ -d "${source}" ]] || fail "runtime-kit source directory is missing: ${source:-unset}"
  [[ "$(basename "${source}")" == 'native-runtime-kit' ]] || fail 'runtime-kit source basename must be native-runtime-kit'
  [[ "${target}" == 'x86_64-unknown-linux-gnu' ]] || fail "unsupported artifact target: ${target}"
  [[ "${profile}" == 'debug' ]] || fail "unsupported artifact profile: ${profile}"

  mkdir -p "${output}"
  local archive="${output}/${ARCHIVE_NAME}"
  local manifest="${output}/${MANIFEST_NAME}"
  tar -czf "${archive}" -C "$(dirname "${source}")" "$(basename "${source}")"
  local archive_sha256
  archive_sha256="$(sha256_file "${archive}")"
  jq -n \
    --arg build_version "${APPVEYOR_BUILD_VERSION}" \
    --arg commit "${APPVEYOR_REPO_COMMIT}" \
    --arg producer_job "${PRODUCER_JOB}" \
    --arg producer_job_id "${APPVEYOR_JOB_ID}" \
    --arg target "${target}" \
    --arg profile "${profile}" \
    --arg worker_image "${APPVEYOR_BUILD_WORKER_IMAGE}" \
    --arg archive "${ARCHIVE_NAME}" \
    --arg archive_sha256 "${archive_sha256}" \
    '{
      schema_version: 1,
      build_version: $build_version,
      commit: $commit,
      producer_job: $producer_job,
      producer_job_id: $producer_job_id,
      target: $target,
      profile: $profile,
      worker_image: $worker_image,
      archive: $archive,
      archive_sha256: $archive_sha256
    }' >"${manifest}"
  printf 'Published exact-build runtime-kit artifact metadata at %s\n' "${manifest}"
}

assert_safe_archive() {
  local archive="$1"
  local entry
  while IFS= read -r entry; do
    case "${entry}" in
      native-runtime-kit | native-runtime-kit/*) ;;
      *) fail "unsafe runtime-kit archive path: ${entry}" ;;
    esac
    case "/${entry}/" in
      */../* | */./*) fail "unsafe runtime-kit archive path: ${entry}" ;;
    esac
  done < <(tar -tzf "${archive}")

  if tar -tvzf "${archive}" | awk 'substr($1, 1, 1) !~ /^[-d]$/ { found = 1 } END { exit !found }'; then
    fail 'unsafe runtime-kit archive entry type'
  fi
}

restore_artifact() {
  require_value APPVEYOR_ACCOUNT_NAME
  require_value APPVEYOR_PROJECT_SLUG
  require_value APPVEYOR_BUILD_VERSION
  require_value APPVEYOR_REPO_COMMIT
  require_value APPVEYOR_BUILD_WORKER_IMAGE

  local destination="${BESKID_RUNTIME_KIT_DESTINATION:-}"
  local target="${BESKID_RUNTIME_KIT_TARGET:-x86_64-unknown-linux-gnu}"
  local profile="${BESKID_RUNTIME_KIT_PROFILE:-debug}"
  local api="${APPVEYOR_API_BASE:-https://ci.appveyor.com/api}"
  [[ -n "${destination}" ]] || fail 'BESKID_RUNTIME_KIT_DESTINATION is unset'
  [[ ! -e "${destination}" ]] || fail "runtime-kit destination must not exist: ${destination}"

  local work
  work="$(mktemp -d "${TMPDIR:-/tmp}/beskid-runtime-kit-restore.XXXXXX")"
  trap 'rm -rf "${work}"' EXIT
  local build_record="${work}/build.json"
  curl -fsSL \
    "${api}/projects/${APPVEYOR_ACCOUNT_NAME}/${APPVEYOR_PROJECT_SLUG}/build/${APPVEYOR_BUILD_VERSION}" \
    -o "${build_record}"

  local actual_version actual_commit producer_count producer_status producer_job_id
  actual_version="$(jq -er '.build.version' "${build_record}")" || fail 'current AppVeyor build record has no version'
  actual_commit="$(jq -er '.build.commitId' "${build_record}")" || fail 'current AppVeyor build record has no commit'
  [[ "${actual_version}" == "${APPVEYOR_BUILD_VERSION}" ]] || fail 'AppVeyor build record version mismatch'
  [[ "${actual_commit}" == "${APPVEYOR_REPO_COMMIT}" ]] || fail "producer commit ${actual_commit} does not match APPVEYOR_REPO_COMMIT ${APPVEYOR_REPO_COMMIT}"
  producer_count="$(jq --arg name "${PRODUCER_JOB}" '[.build.jobs[] | select(.name == $name)] | length' "${build_record}")"
  [[ "${producer_count}" == '1' ]] || fail "expected exactly one ${PRODUCER_JOB} producer job"
  producer_status="$(jq -er --arg name "${PRODUCER_JOB}" '.build.jobs[] | select(.name == $name) | .status' "${build_record}")"
  [[ "${producer_status}" == 'success' ]] || fail "producer job is not successful: ${producer_status}"
  producer_job_id="$(jq -er --arg name "${PRODUCER_JOB}" '.build.jobs[] | select(.name == $name) | .jobId' "${build_record}")"

  local artifact_list="${work}/artifacts.json"
  curl -fsSL "${api}/buildjobs/${producer_job_id}/artifacts" -o "${artifact_list}"
  jq -e \
    --arg directory "${ARTIFACT_DIRECTORY}" \
    --arg archive "${ARCHIVE_NAME}" \
    --arg manifest "${MANIFEST_NAME}" '
      def allowed($name): . == $name or . == ($directory + "/" + $name);
      type == "array" and
      length == 2 and
      all(.[]; (.fileName | type) == "string") and
      ([.[].fileName | select(allowed($archive))] | length == 1) and
      ([.[].fileName | select(allowed($manifest))] | length == 1)
    ' "${artifact_list}" >/dev/null ||
    fail 'artifact listing does not contain exactly the expected runtime-kit pair'

  local manifest="${work}/${MANIFEST_NAME}"
  local archive="${work}/${ARCHIVE_NAME}"
  download_listed_artifact "${api}" "${producer_job_id}" "${artifact_list}" "${MANIFEST_NAME}" "${manifest}"
  jq -e \
    --arg build_version "${APPVEYOR_BUILD_VERSION}" \
    --arg commit "${APPVEYOR_REPO_COMMIT}" \
    --arg producer_job "${PRODUCER_JOB}" \
    --arg producer_job_id "${producer_job_id}" \
    --arg target "${target}" \
    --arg profile "${profile}" \
    --arg worker_image "${APPVEYOR_BUILD_WORKER_IMAGE}" \
    --arg archive "${ARCHIVE_NAME}" '
      .schema_version == 1 and
      .build_version == $build_version and
      .commit == $commit and
      .producer_job == $producer_job and
      .producer_job_id == $producer_job_id and
      .target == $target and
      .profile == $profile and
      .worker_image == $worker_image and
      .archive == $archive and
      (.archive_sha256 | type == "string" and test("^[0-9a-f]{64}$"))
    ' "${manifest}" >/dev/null || fail 'runtime-kit artifact metadata does not match this exact job'

  download_listed_artifact "${api}" "${producer_job_id}" "${artifact_list}" "${ARCHIVE_NAME}" "${archive}"
  local expected_sha256 actual_sha256
  expected_sha256="$(jq -r '.archive_sha256' "${manifest}")"
  actual_sha256="$(sha256_file "${archive}")"
  [[ "${actual_sha256}" == "${expected_sha256}" ]] || fail 'runtime-kit archive SHA-256 mismatch'
  assert_safe_archive "${archive}"

  mkdir -p "${work}/extract" "$(dirname "${destination}")"
  tar -xzf "${archive}" -C "${work}/extract"
  [[ -d "${work}/extract/native-runtime-kit" ]] || fail 'runtime-kit archive has no canonical root directory'
  mv "${work}/extract/native-runtime-kit" "${destination}"
  printf 'Restored exact-build runtime kit to %s\n' "${destination}"
  trap - EXIT
  rm -rf "${work}"
}

case "${1:-}" in
  publish) publish_artifact ;;
  restore) restore_artifact ;;
  *) fail 'usage: appveyor-runtime-kit-artifact.sh (publish|restore)' ;;
esac
