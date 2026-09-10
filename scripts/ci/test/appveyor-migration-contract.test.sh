#!/usr/bin/env bash
# Contract for the AppVeyor validation/image-publication boundary.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
APPVEYOR_CONFIG="${ROOT}/appveyor.yml"
ENTRYPOINT="${ROOT}/scripts/ci/appveyor-entrypoint.sh"
PUBLISHER="${ROOT}/scripts/ci/appveyor-platform-publish.sh"
PROMOTER="${ROOT}/scripts/ci/appveyor-platform-promote.sh"
MANIFEST="${ROOT}/scripts/ci/appveyor-image-manifest.sh"
PACKAGE_PUBLISHER="${ROOT}/scripts/ci/appveyor-package-publish.sh"
EVENT_POLICY="${ROOT}/scripts/ci/lib/appveyor-event-policy.sh"

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  exit 1
}

[[ -f "${APPVEYOR_CONFIG}" ]] || fail "root appveyor.yml is missing"
[[ -x "${ROOT}/scripts/ci/appveyor-install.sh" ]] || fail "AppVeyor installer is missing or not executable"
[[ -x "${ROOT}/scripts/ci/appveyor-entrypoint.sh" ]] || fail "POSIX AppVeyor entrypoint is missing or not executable"
[[ -f "${ROOT}/scripts/ci/appveyor-entrypoint.ps1" ]] || fail "Windows AppVeyor entrypoint is missing"
[[ -x "${PUBLISHER}" ]] || fail "platform publisher is missing or not executable"
[[ -x "${PROMOTER}" ]] || fail "platform promoter is missing or not executable"
[[ -x "${MANIFEST}" ]] || fail "platform image manifest writer is missing or not executable"
[[ -x "${PACKAGE_PUBLISHER}" ]] || fail "AppVeyor package publisher is missing or not executable"
[[ -f "${EVENT_POLICY}" ]] || fail "shared AppVeyor event policy is missing"

ruby -e '
  require "yaml"
  config = YAML.safe_load(File.read(ARGV.fetch(0)), aliases: true)
  matrix = config.dig("environment", "matrix")
  abort "AppVeyor environment matrix is missing" unless matrix.is_a?(Array)
  lanes = matrix.map { |row| row.fetch("BESKID_CI_LANE") }
  expected = %w[linux-platform linux-compiler macos-compiler windows-compiler]
  abort "unexpected AppVeyor lane matrix: #{lanes.inspect}" unless lanes.sort == expected.sort
  abort "AppVeyor deployment must be disabled" unless config["deploy"] == false
  abort "required jobs may not be allowed to fail" if config.dig("matrix", "allow_failures")
  abort "AppVeyor must cap compiler fan-out at three jobs" unless config["max_jobs"] == 3
  expected_jobs = {
    "linux-platform" => "linux-platform",
    "linux-compiler" => "linux-compiler",
    "macos-compiler" => "macos-compiler",
    "windows-compiler" => "windows-compiler"
  }
  matrix.each do |row|
    lane = row.fetch("BESKID_CI_LANE")
    abort "AppVeyor lane #{lane} has no stable job name" unless row["job_name"] == expected_jobs.fetch(lane)
  end
  compiler_lanes = %w[linux-compiler macos-compiler windows-compiler]
  compiler_lanes.each do |lane|
    row = matrix.find { |candidate| candidate.fetch("BESKID_CI_LANE") == lane }
    abort "compiler lane #{lane} is outside compiler-validation" unless row["job_group"] == "compiler-validation"
  end
  platform = matrix.find { |row| row.fetch("BESKID_CI_LANE") == "linux-platform" }
  abort "linux platform job must depend on compiler-validation" unless platform["job_depends_on"] == "compiler-validation"
  platform_job = config.fetch("for").find do |job|
    job.dig("matrix", "only") == [{ "BESKID_CI_LANE" => "linux-platform" }]
  end
  artifacts = platform_job&.fetch("artifacts", [])
  abort "linux platform job must retain AppVeyor release evidence" unless artifacts.any? { |artifact| artifact["path"] == ".appveyor-reports/**" }
  images = matrix.to_h { |row| [row.fetch("BESKID_CI_LANE"), row.fetch("APPVEYOR_BUILD_WORKER_IMAGE")] }
  abort "linux lanes must use Linux workers" unless images.fetch("linux-platform").downcase.include?("ubuntu") && images.fetch("linux-compiler").downcase.include?("ubuntu")
  abort "macOS compiler lane must use a macOS worker" unless images.fetch("macos-compiler").downcase.include?("macos")
  abort "Windows compiler lane must use a Visual Studio worker" unless images.fetch("windows-compiler").downcase.include?("visual studio")
' "${APPVEYOR_CONFIG}"

retired_workflows=(
  compiler-gate-testbox.yml
  compiler.yml
  corelib.yml
  platform-delivery.yml
  tracker-platform-delivery.yml
  reusable-image.yml
  reusable-promote.yml
  reusable-quality.yml
  reusable-release-manifest.yml
)
for workflow in "${retired_workflows[@]}"; do
  [[ ! -e "${ROOT}/.github/workflows/${workflow}" ]] || fail "retired GitHub workflow remains: ${workflow}"
done

if rg -n 'workflows:[[:space:]]*\[(Compiler|Platform delivery|Corelib and templates)\]' \
  "${ROOT}/.github/workflows" -g '*.yml' -g '*.yaml'; then
  fail "retained GitHub workflow depends on a retired CI workflow"
fi

entrypoint_content="$(<"${ENTRYPOINT}")"
rehearse_line="$(rg -n 'appveyor-package-publish\.sh rehearse' <<<"${entrypoint_content}" | cut -d: -f1)"
images_line="$(rg -n 'appveyor-platform-publish\.sh' <<<"${entrypoint_content}" | cut -d: -f1)"
packages_line="$(rg -n 'appveyor-package-publish\.sh publish' <<<"${entrypoint_content}" | cut -d: -f1)"
promote_line="$(rg -n 'appveyor-platform-promote\.sh' <<<"${entrypoint_content}" | cut -d: -f1)"
manifest_line="$(rg -n 'appveyor-image-manifest\.sh finalize' <<<"${entrypoint_content}" | cut -d: -f1)"
if [[ -z "${rehearse_line}" ]] || [[ -z "${images_line}" ]] || [[ -z "${packages_line}" ]] ||
   [[ -z "${promote_line}" ]] || [[ -z "${manifest_line}" ]] ||
   (( rehearse_line >= images_line || images_line >= packages_line || packages_line >= promote_line || promote_line >= manifest_line )); then
  fail "platform lane must publish immutable images, packages, then production tags and evidence"
fi
if ! rg -q '^set -euo pipefail$' <<<"${entrypoint_content}"; then
  fail "platform lane must fail before promotion when package publication fails"
fi

entrypoint_log="$(mktemp "${TMPDIR:-/tmp}/appveyor-entrypoint-test.XXXXXX")"
set +e
ENTRYPOINT_UNDER_TEST="${ENTRYPOINT}" ENTRYPOINT_TEST_LOG="${entrypoint_log}" bash -c '
  source "${ENTRYPOINT_UNDER_TEST}"
  bash() {
    printf "%s\\n" "$*" >>"${ENTRYPOINT_TEST_LOG}"
    [[ "$*" != "scripts/ci/appveyor-package-publish.sh publish" ]] || return 71
  }
  pnpm() {
    printf "pnpm %s\\n" "$*" >>"${ENTRYPOINT_TEST_LOG}"
  }
  run_linux_platform_lane
' >/dev/null 2>&1
entrypoint_status=$?
set -e
[[ "${entrypoint_status}" -ne 0 ]] || fail "platform lane continued after live package publication failed"
rg -q '^scripts/ci/appveyor-package-publish\.sh publish$' "${entrypoint_log}" || \
  fail "package failure scenario did not reach live publication"
if rg -q '^scripts/ci/appveyor-platform-promote\.sh$' "${entrypoint_log}"; then
  fail "package failure reached mutable image promotion"
fi

run_publisher() {
  local scenario="$1"
  local fake_bin log status
  fake_bin="$(mktemp -d "${TMPDIR:-/tmp}/appveyor-publish-test.XXXXXX")"
  log="${fake_bin}/docker.log"
  cat >"${fake_bin}/docker" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' "$*" >>"${DOCKER_TEST_LOG}"
case "${1:-}" in
  buildx)
    [[ "${2:-}" == "version" ]] && exit 0
    [[ "${2:-}" == "build" ]] && exit 0
    ;;
  login|push|logout) exit 0 ;;
  image)
    [[ "${2:-}" == "inspect" ]] || exit 1
    immutable_ref="${!#}"
    printf '%s@sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef\n' "${immutable_ref%:*}"
    ;;
esac
exit 0
EOF
  chmod +x "${fake_bin}/docker"

  set +e
  case "${scenario}" in
    pull-request)
      PATH="${fake_bin}:${PATH}" DOCKER_TEST_LOG="${log}" \
        APPVEYOR_REPO_BRANCH=main APPVEYOR_PULL_REQUEST_NUMBER=42 \
        APPVEYOR_REPO_COMMIT=0123456789abcdef0123456789abcdef01234567 \
        APPVEYOR_BUILD_FOLDER="${fake_bin}/build" \
        bash "${PUBLISHER}" >/dev/null 2>&1
      ;;
    main-without-credentials)
      PATH="${fake_bin}:${PATH}" DOCKER_TEST_LOG="${log}" \
        APPVEYOR_REPO_BRANCH=main APPVEYOR_PULL_REQUEST_NUMBER='' \
        APPVEYOR_REPO_TAG=false \
        APPVEYOR_REPO_COMMIT=0123456789abcdef0123456789abcdef01234567 \
        APPVEYOR_BUILD_FOLDER="${fake_bin}/build" \
        bash "${PUBLISHER}" >/dev/null 2>&1
      ;;
    main)
      PATH="${fake_bin}:${PATH}" DOCKER_TEST_LOG="${log}" \
        APPVEYOR_REPO_BRANCH=main APPVEYOR_PULL_REQUEST_NUMBER='' \
        APPVEYOR_REPO_TAG=false \
        APPVEYOR_REPO_COMMIT=0123456789abcdef0123456789abcdef01234567 \
        APPVEYOR_BUILD_FOLDER="${fake_bin}/build" \
        REGISTRY_USERNAME=test-user REGISTRY_PASSWORD=test-password \
        bash "${PUBLISHER}" >/dev/null 2>&1
      ;;
    forced-main)
      PATH="${fake_bin}:${PATH}" DOCKER_TEST_LOG="${log}" \
        APPVEYOR_REPO_BRANCH=main APPVEYOR_PULL_REQUEST_NUMBER='' \
        APPVEYOR_REPO_TAG=False APPVEYOR_FORCED_BUILD=True \
        APPVEYOR_REPO_COMMIT=0123456789abcdef0123456789abcdef01234567 \
        APPVEYOR_BUILD_FOLDER="${fake_bin}/build" \
        REGISTRY_USERNAME=test-user REGISTRY_PASSWORD=test-password \
        bash "${PUBLISHER}" >/dev/null 2>&1
      ;;
    *) fail "unknown publisher test scenario: ${scenario}" ;;
  esac
  status=$?
  set -e

  PUBLISHER_STATUS="${status}"
  PUBLISHER_LOG="${log}"
}

run_publisher pull-request
[[ "${PUBLISHER_STATUS}" -eq 0 ]] || fail "pull-request image build failed"
if rg -n '(^| )(login|push)( |$)' "${PUBLISHER_LOG}"; then
  fail "pull-request publication reached registry login or push"
fi

run_publisher main-without-credentials
[[ "${PUBLISHER_STATUS}" -ne 0 ]] || fail "trusted main publication did not fail closed without credentials"
if rg -n '(^| )(login|push)( |$)' "${PUBLISHER_LOG}"; then
  fail "missing-credential publication reached registry login or push"
fi

run_publisher forced-main
[[ "${PUBLISHER_STATUS}" -eq 0 ]] || fail "forced main image build failed"
if rg -n '(^| )(login|push)( |$)' "${PUBLISHER_LOG}"; then
  fail "forced main build reached registry login or push"
fi

run_publisher main
[[ "${PUBLISHER_STATUS}" -eq 0 ]] || fail "trusted main publication failed with credentials"
[[ "$(rg -c '^push cr\.beskid-lang\.org/beskid/(site|learn|tracker|nexus|pckg):sha-0123456789abcdef0123456789abcdef01234567$' "${PUBLISHER_LOG}")" -eq 5 ]] || \
  fail "trusted main publication did not push all five immutable tags"
if rg -q '^push .*:production$' "${PUBLISHER_LOG}"; then
  fail "immutable publisher pushed a mutable production tag"
fi
if rg -n '(^|/)(ghcr\.io|docker\.io)(/|$)' "${PUBLISHER_LOG}"; then
  fail "platform publisher used a registry other than cr.beskid-lang.org"
fi

run_promoter() {
  local scenario="$1"
  local fake_bin log status
  fake_bin="$(mktemp -d "${TMPDIR:-/tmp}/appveyor-promote-test.XXXXXX")"
  log="${fake_bin}/docker.log"
  cat >"${fake_bin}/docker" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' "$*" >>"${DOCKER_TEST_LOG}"
case "${1:-}" in
  login|pull|push|logout) exit 0 ;;
  image) [[ "${2:-}" == "tag" ]] && exit 0 ;;
  buildx) exit 97 ;;
esac
exit 1
EOF
  chmod +x "${fake_bin}/docker"

  set +e
  case "${scenario}" in
    main)
      PATH="${fake_bin}:${PATH}" DOCKER_TEST_LOG="${log}" \
        APPVEYOR_REPO_BRANCH=main APPVEYOR_PULL_REQUEST_NUMBER='' APPVEYOR_REPO_TAG=false \
        APPVEYOR_REPO_COMMIT=0123456789abcdef0123456789abcdef01234567 \
        REGISTRY_USERNAME=test-user REGISTRY_PASSWORD=test-password \
        bash "${PROMOTER}" >/dev/null 2>&1
      ;;
    *) fail "unknown promoter test scenario: ${scenario}" ;;
  esac
  status=$?
  set -e
  PROMOTER_STATUS="${status}"
  PROMOTER_LOG="${log}"
}

run_promoter main
[[ "${PROMOTER_STATUS}" -eq 0 ]] || fail "trusted main production promotion failed"
[[ "$(rg -c '^pull cr\.beskid-lang\.org/beskid/(site|learn|tracker|nexus|pckg):sha-0123456789abcdef0123456789abcdef01234567$' "${PROMOTER_LOG}")" -eq 5 ]] || \
  fail "promotion did not consume all immutable tags"
[[ "$(rg -c '^image tag cr\.beskid-lang\.org/beskid/(site|learn|tracker|nexus|pckg):sha-0123456789abcdef0123456789abcdef01234567 cr\.beskid-lang\.org/beskid/(site|learn|tracker|nexus|pckg):production$' "${PROMOTER_LOG}")" -eq 5 ]] || \
  fail "promotion did not advance all production tags from immutable images"
[[ "$(rg -c '^push cr\.beskid-lang\.org/beskid/(site|learn|tracker|nexus|pckg):production$' "${PROMOTER_LOG}")" -eq 5 ]] || \
  fail "promotion did not push all production tags"
if rg -q '^buildx ' "${PROMOTER_LOG}"; then
  fail "promotion rebuilt images instead of consuming immutable tags"
fi
rg -q '^logout cr\.beskid-lang\.org$' "${PROMOTER_LOG}" || fail "promotion did not log out of the registry"

manifest_root="$(mktemp -d "${TMPDIR:-/tmp}/appveyor-manifest-test.XXXXXX")"
APPVEYOR_REPO_BRANCH=main APPVEYOR_PULL_REQUEST_NUMBER='' APPVEYOR_REPO_TAG=false \
  APPVEYOR_REPO_COMMIT=0123456789abcdef0123456789abcdef01234567 \
  APPVEYOR_BUILD_ID=42 APPVEYOR_BUILD_VERSION=1.0.42 APPVEYOR_JOB_ID=job-42 \
  APPVEYOR_BUILD_FOLDER="${manifest_root}" \
  bash "${MANIFEST}" record site "cr.beskid-lang.org/beskid/site:sha-0123456789abcdef0123456789abcdef01234567" "cr.beskid-lang.org/beskid/site@sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
for lane in learn tracker nexus pckg; do
  APPVEYOR_REPO_BRANCH=main APPVEYOR_PULL_REQUEST_NUMBER='' APPVEYOR_REPO_TAG=false \
    APPVEYOR_REPO_COMMIT=0123456789abcdef0123456789abcdef01234567 \
    APPVEYOR_BUILD_ID=42 APPVEYOR_BUILD_VERSION=1.0.42 APPVEYOR_JOB_ID=job-42 \
    APPVEYOR_BUILD_FOLDER="${manifest_root}" \
    bash "${MANIFEST}" record "${lane}" "cr.beskid-lang.org/beskid/${lane}:sha-0123456789abcdef0123456789abcdef01234567" "cr.beskid-lang.org/beskid/${lane}@sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
done
APPVEYOR_REPO_BRANCH=main APPVEYOR_PULL_REQUEST_NUMBER='' APPVEYOR_REPO_TAG=false \
  APPVEYOR_REPO_COMMIT=0123456789abcdef0123456789abcdef01234567 \
  APPVEYOR_BUILD_ID=42 APPVEYOR_BUILD_VERSION=1.0.42 APPVEYOR_JOB_ID=job-42 \
  APPVEYOR_BUILD_FOLDER="${manifest_root}" \
  bash "${MANIFEST}" finalize
manifest_path="${manifest_root}/.appveyor-reports/platform-images.json"
[[ -f "${manifest_path}" ]] || fail "platform image manifest was not written"
jq -e '
  .source.sha == "0123456789abcdef0123456789abcdef01234567" and
  .build.id == "42" and .build.version == "1.0.42" and .job.id == "job-42" and
  .registry.namespace == "cr.beskid-lang.org/beskid" and
  ([.images[] | select(.immutable.tag == "sha-0123456789abcdef0123456789abcdef01234567" and (.immutable.digest | startswith("cr.beskid-lang.org/beskid/")))] | length) == 5 and
  ([.images[].lane] | sort) == ["learn", "nexus", "pckg", "site", "tracker"]
' "${manifest_path}" >/dev/null || fail "platform image manifest lacks five digest-backed immutable records"

run_package_publisher() {
  local scenario="$1"
  local fake_bin log status
  fake_bin="$(mktemp -d "${TMPDIR:-/tmp}/appveyor-package-test.XXXXXX")"
  log="${fake_bin}/publish.log"
  cat >"${fake_bin}/bash" <<'EOF'
#!/bin/bash
key_state=unset
[[ -z "${BESKID_PCKG_API_KEY:-}" ]] || key_state=key-set
printf '%s|%s|%s\n' "${BESKID_PCKG_BASE_URL:-unset}" "${key_state}" "$*" >>"${PACKAGE_TEST_LOG}"
EOF
  chmod +x "${fake_bin}/bash"

  set +e
  case "${scenario}" in
    pull-request)
      PATH="${fake_bin}:${PATH}" PACKAGE_TEST_LOG="${log}" \
        APPVEYOR_REPO_BRANCH=main APPVEYOR_PULL_REQUEST_NUMBER=42 \
        APPVEYOR_REPO_TAG=False APPVEYOR_FORCED_BUILD=False APPVEYOR_SCHEDULED_BUILD=False \
        BESKID_PCKG_API_KEY=bpk_test \
        /bin/bash "${PACKAGE_PUBLISHER}" rehearse >/dev/null 2>&1 &&
      PATH="${fake_bin}:${PATH}" PACKAGE_TEST_LOG="${log}" \
        APPVEYOR_REPO_BRANCH=main APPVEYOR_PULL_REQUEST_NUMBER=42 \
        APPVEYOR_REPO_TAG=False APPVEYOR_FORCED_BUILD=False APPVEYOR_SCHEDULED_BUILD=False \
        BESKID_PCKG_API_KEY=bpk_test \
        /bin/bash "${PACKAGE_PUBLISHER}" publish >/dev/null 2>&1
      ;;
    non-main)
      PATH="${fake_bin}:${PATH}" PACKAGE_TEST_LOG="${log}" \
        APPVEYOR_REPO_BRANCH=feature APPVEYOR_PULL_REQUEST_NUMBER='' \
        APPVEYOR_REPO_TAG=False APPVEYOR_FORCED_BUILD=False APPVEYOR_SCHEDULED_BUILD=False \
        BESKID_PCKG_API_KEY=bpk_test \
        /bin/bash "${PACKAGE_PUBLISHER}" rehearse >/dev/null 2>&1 &&
      PATH="${fake_bin}:${PATH}" PACKAGE_TEST_LOG="${log}" \
        APPVEYOR_REPO_BRANCH=feature APPVEYOR_PULL_REQUEST_NUMBER='' \
        APPVEYOR_REPO_TAG=False APPVEYOR_FORCED_BUILD=False APPVEYOR_SCHEDULED_BUILD=False \
        BESKID_PCKG_API_KEY=bpk_test \
        /bin/bash "${PACKAGE_PUBLISHER}" publish >/dev/null 2>&1
      ;;
    main-without-key)
      env -u BESKID_PCKG_API_KEY \
        PATH="${fake_bin}:${PATH}" PACKAGE_TEST_LOG="${log}" \
        APPVEYOR_REPO_BRANCH=main APPVEYOR_PULL_REQUEST_NUMBER='' \
        APPVEYOR_REPO_TAG=False APPVEYOR_FORCED_BUILD=False APPVEYOR_SCHEDULED_BUILD=False \
        /bin/bash "${PACKAGE_PUBLISHER}" rehearse >/dev/null 2>&1 &&
      env -u BESKID_PCKG_API_KEY \
        PATH="${fake_bin}:${PATH}" PACKAGE_TEST_LOG="${log}" \
        APPVEYOR_REPO_BRANCH=main APPVEYOR_PULL_REQUEST_NUMBER='' \
        APPVEYOR_REPO_TAG=False APPVEYOR_FORCED_BUILD=False APPVEYOR_SCHEDULED_BUILD=False \
        /bin/bash "${PACKAGE_PUBLISHER}" publish >/dev/null 2>&1
      ;;
    main)
      PATH="${fake_bin}:${PATH}" PACKAGE_TEST_LOG="${log}" \
        APPVEYOR_REPO_BRANCH=main APPVEYOR_PULL_REQUEST_NUMBER='' \
        APPVEYOR_REPO_TAG=False APPVEYOR_FORCED_BUILD=False APPVEYOR_SCHEDULED_BUILD=False \
        BESKID_PCKG_API_KEY=bpk_test \
        /bin/bash "${PACKAGE_PUBLISHER}" rehearse >/dev/null 2>&1 &&
      PATH="${fake_bin}:${PATH}" PACKAGE_TEST_LOG="${log}" \
        APPVEYOR_REPO_BRANCH=main APPVEYOR_PULL_REQUEST_NUMBER='' \
        APPVEYOR_REPO_TAG=False APPVEYOR_FORCED_BUILD=False APPVEYOR_SCHEDULED_BUILD=False \
        BESKID_PCKG_API_KEY=bpk_test \
        /bin/bash "${PACKAGE_PUBLISHER}" publish >/dev/null 2>&1
      ;;
    *) fail "unknown package publisher test scenario: ${scenario}" ;;
  esac
  status=$?
  set -e

  PACKAGE_STATUS="${status}"
  PACKAGE_LOG="${log}"
}

for untrusted_scenario in pull-request non-main; do
  run_package_publisher "${untrusted_scenario}"
  [[ "${PACKAGE_STATUS}" -eq 0 ]] || fail "${untrusted_scenario} package rehearsal failed"
  [[ "$(wc -l <"${PACKAGE_LOG}" | tr -d ' ')" -eq 1 ]] || \
    fail "${untrusted_scenario} ran live package publication"
  rg -q '^unset\|key-set\|scripts/ci/corelib-publish\.sh patch --dry-run$' "${PACKAGE_LOG}" || \
    fail "${untrusted_scenario} did not perform exactly the package rehearsal"
done

run_package_publisher main-without-key
[[ "${PACKAGE_STATUS}" -ne 0 ]] || fail "trusted main package publication did not fail closed without BESKID_PCKG_API_KEY"
[[ "$(wc -l <"${PACKAGE_LOG}" | tr -d ' ')" -eq 1 ]] || \
  fail "missing-key main build reached live package publication"

run_package_publisher main
[[ "${PACKAGE_STATUS}" -eq 0 ]] || fail "trusted main package publication failed with a key"
[[ "$(wc -l <"${PACKAGE_LOG}" | tr -d ' ')" -eq 2 ]] || \
  fail "trusted main did not perform exactly rehearsal plus live publication"
rg -q '^https://pckg\.beskid-lang\.org\|key-set\|scripts/ci/corelib-publish\.sh patch$' "${PACKAGE_LOG}" || \
  fail "trusted main package publication did not use the public registry endpoint"

printf 'AppVeyor migration contract tests OK\n'
