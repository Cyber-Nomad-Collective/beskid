#!/usr/bin/env bash
# Contract for exact-build, fail-closed AppVeyor runtime-kit artifact handoff.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
MODULE="${ROOT}/scripts/ci/appveyor-runtime-kit-artifact.sh"
fixture="$(mktemp -d "${TMPDIR:-/tmp}/beskid-runtime-artifact-test.XXXXXX")"
trap 'rm -rf "${fixture}"' EXIT

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  exit 1
}

artifact_sha256() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  else
    shasum -a 256 "$1" | awk '{print $1}'
  fi
}

[[ -x "${MODULE}" ]] || fail "runtime-kit artifact module is missing or not executable"

kit="${fixture}/native-runtime-kit"
mkdir -p "${kit}/lib/beskid-runtime/abi-5/x86_64-unknown-linux-gnu/debug/static"
printf '%s\n' canonical >"${kit}/lib/beskid-runtime/abi-5/x86_64-unknown-linux-gnu/debug/static/libbeskid_runtime.a"
publish_dir="${fixture}/published"

APPVEYOR_BUILD_VERSION=1.0.42 \
APPVEYOR_REPO_COMMIT=0123456789abcdef0123456789abcdef01234567 \
APPVEYOR_JOB_ID=producer-job-42 \
APPVEYOR_BUILD_WORKER_IMAGE=Ubuntu2204 \
BESKID_RUNTIME_KIT_SOURCE="${kit}" \
BESKID_RUNTIME_KIT_ARTIFACT_DIR="${publish_dir}" \
  "${MODULE}" publish

manifest="${publish_dir}/native-runtime-kit-manifest.json"
archive="${publish_dir}/native-runtime-kit.tar.gz"
[[ -f "${manifest}" && -f "${archive}" ]] || fail "publish did not produce the fixed artifact pair"
jq -e '
  .schema_version == 1 and
  .build_version == "1.0.42" and
  .commit == "0123456789abcdef0123456789abcdef01234567" and
  .producer_job == "linux-runtime-kit-build" and
  .producer_job_id == "producer-job-42" and
  .target == "x86_64-unknown-linux-gnu" and
  .profile == "debug" and
  .worker_image == "Ubuntu2204" and
  (.archive_sha256 | test("^[0-9a-f]{64}$"))
' "${manifest}" >/dev/null || fail "publish metadata is incomplete"

mkdir -p "${fixture}/bin"
cat >"${fixture}/bin/curl" <<'EOF'
#!/usr/bin/env bash
output=''
url=''
while [[ $# -gt 0 ]]; do
  case "$1" in
    -o|--output) output="$2"; shift 2 ;;
    -*) shift ;;
    *) url="$1"; shift ;;
  esac
done
case "${url}" in
  */api/projects/pmikstacki/beskid/build/1.0.42)
    source_file="${BESKID_TEST_BUILD_RECORD}"
    ;;
  */api/buildjobs/producer-job-42/artifacts)
    source_file="${BESKID_TEST_ARTIFACT_LIST}"
    ;;
  */api/buildjobs/producer-job-42/artifacts/.appveyor-artifacts/native-runtime-kit-manifest.json)
    source_file="${BESKID_TEST_PUBLISHED_DIR}/native-runtime-kit-manifest.json"
    ;;
  */api/buildjobs/producer-job-42/artifacts/.appveyor-artifacts/native-runtime-kit.tar.gz)
    source_file="${BESKID_TEST_PUBLISHED_DIR}/native-runtime-kit.tar.gz"
    ;;
  *)
    printf 'unexpected URL: %s\n' "${url}" >&2
    exit 22
    ;;
esac
if [[ -n "${output}" ]]; then cp "${source_file}" "${output}"; else cat "${source_file}"; fi
EOF
chmod +x "${fixture}/bin/curl"

write_build_record() {
  local commit="$1" status="$2"
  jq -n --arg commit "${commit}" --arg status "${status}" '
    {build: {version: "1.0.42", commitId: $commit, jobs: [
      {name: "linux-runtime-kit-build", jobId: "producer-job-42", status: $status}
    ]}}
  ' >"${fixture}/build.json"
}

write_artifact_list() {
  jq -n '
    [
      {fileName: ".appveyor-artifacts/native-runtime-kit.tar.gz"},
      {fileName: ".appveyor-artifacts/native-runtime-kit-manifest.json"}
    ]
  ' >"${fixture}/artifacts.json"
}

run_restore() {
  PATH="${fixture}/bin:${PATH}" \
  APPVEYOR_ACCOUNT_NAME=pmikstacki \
  APPVEYOR_PROJECT_SLUG=beskid \
  APPVEYOR_BUILD_VERSION=1.0.42 \
  APPVEYOR_REPO_COMMIT=0123456789abcdef0123456789abcdef01234567 \
  APPVEYOR_BUILD_WORKER_IMAGE=Ubuntu2204 \
  BESKID_RUNTIME_KIT_DESTINATION="$1" \
  BESKID_TEST_BUILD_RECORD="${fixture}/build.json" \
  BESKID_TEST_ARTIFACT_LIST="${fixture}/artifacts.json" \
  BESKID_TEST_PUBLISHED_DIR="${publish_dir}" \
    "${MODULE}" restore
}

write_build_record 0123456789abcdef0123456789abcdef01234567 success
write_artifact_list
restored="${fixture}/restored"
run_restore "${restored}"
cmp \
  "${kit}/lib/beskid-runtime/abi-5/x86_64-unknown-linux-gnu/debug/static/libbeskid_runtime.a" \
  "${restored}/lib/beskid-runtime/abi-5/x86_64-unknown-linux-gnu/debug/static/libbeskid_runtime.a" \
  >/dev/null || fail "restore changed the kit payload"

jq '. + [{fileName: "duplicate/native-runtime-kit.tar.gz"}]' \
  "${fixture}/artifacts.json" >"${fixture}/artifacts.tmp"
mv "${fixture}/artifacts.tmp" "${fixture}/artifacts.json"
if run_restore "${fixture}/duplicate-artifact" >"${fixture}/duplicate-artifact.log" 2>&1; then
  fail "restore accepted a duplicate artifact basename"
fi
grep -F 'artifact listing does not contain exactly the expected runtime-kit pair' \
  "${fixture}/duplicate-artifact.log" >/dev/null || fail "duplicate artifact rejection was not explicit"
write_artifact_list

jq '. + [{fileName: ".appveyor-artifacts/unexpected.txt"}]' \
  "${fixture}/artifacts.json" >"${fixture}/artifacts.tmp"
mv "${fixture}/artifacts.tmp" "${fixture}/artifacts.json"
if run_restore "${fixture}/unexpected-artifact" >"${fixture}/unexpected-artifact.log" 2>&1; then
  fail "restore accepted an unexpected producer artifact"
fi
grep -F 'artifact listing does not contain exactly the expected runtime-kit pair' \
  "${fixture}/unexpected-artifact.log" >/dev/null || fail "unexpected artifact rejection was not explicit"
write_artifact_list

write_build_record ffffffffffffffffffffffffffffffffffffffff success
if run_restore "${fixture}/wrong-commit" >"${fixture}/wrong-commit.log" 2>&1; then
  fail "restore accepted a producer from another commit"
fi
grep -F 'does not match APPVEYOR_REPO_COMMIT' "${fixture}/wrong-commit.log" >/dev/null || fail "commit mismatch was not explicit"

write_build_record 0123456789abcdef0123456789abcdef01234567 failed
if run_restore "${fixture}/failed-producer" >"${fixture}/failed-producer.log" 2>&1; then
  fail "restore accepted a failed producer job"
fi
grep -F 'producer job is not successful' "${fixture}/failed-producer.log" >/dev/null || fail "failed producer was not explicit"

write_build_record 0123456789abcdef0123456789abcdef01234567 success
cp "${archive}" "${archive}.good"
printf 'tampered\n' >>"${archive}"
if run_restore "${fixture}/tampered" >"${fixture}/tampered.log" 2>&1; then
  fail "restore accepted an archive with the wrong SHA-256"
fi
grep -F 'runtime-kit archive SHA-256 mismatch' "${fixture}/tampered.log" >/dev/null || fail "hash mismatch was not explicit"
mv "${archive}.good" "${archive}"

unsafe_root="${fixture}/unsafe"
mkdir -p "${unsafe_root}"
printf 'escape\n' >"${unsafe_root}/payload"
if tar -czf "${archive}" -C "${unsafe_root}" --transform='s|payload|../escape|' payload 2>/dev/null; then
  :
else
  tar -czf "${archive}" -C "${unsafe_root}" -s '|payload|../escape|' payload
fi
sha="$(artifact_sha256 "${archive}")"
jq --arg sha "${sha}" '.archive_sha256 = $sha' "${manifest}" >"${manifest}.tmp"
mv "${manifest}.tmp" "${manifest}"
if run_restore "${fixture}/unsafe-destination" >"${fixture}/unsafe.log" 2>&1; then
  fail "restore accepted an archive path traversal"
fi
grep -F 'unsafe runtime-kit archive path' "${fixture}/unsafe.log" >/dev/null || fail "unsafe archive was not explicit"
[[ ! -e "${fixture}/escape" ]] || fail "unsafe archive escaped the extraction directory"

echo "AppVeyor runtime-kit artifact handoff test passed"
