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
PLATFORM_IMAGES="${ROOT}/scripts/ci/lib/appveyor-platform-images.sh"

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  exit 1
}

run_isolated_appveyor_event() {
  local branch="$1"
  local pull_request_number="$2"
  local repo_tag="$3"
  local forced_build="$4"
  local scheduled_build="$5"
  local rebuild="$6"
  local rerun_incomplete="$7"
  shift 7

  env \
    -u REGISTRY_USERNAME \
    -u REGISTRY_PASSWORD \
    -u BESKID_PCKG_API_KEY \
    -u APPVEYOR_REPO_BRANCH \
    -u APPVEYOR_PULL_REQUEST_NUMBER \
    -u APPVEYOR_REPO_TAG \
    -u APPVEYOR_FORCED_BUILD \
    -u APPVEYOR_SCHEDULED_BUILD \
    -u APPVEYOR_RE_BUILD \
    -u APPVEYOR_RE_RUN_INCOMPLETE \
    APPVEYOR_REPO_BRANCH="${branch}" \
    APPVEYOR_PULL_REQUEST_NUMBER="${pull_request_number}" \
    APPVEYOR_REPO_TAG="${repo_tag}" \
    APPVEYOR_FORCED_BUILD="${forced_build}" \
    APPVEYOR_SCHEDULED_BUILD="${scheduled_build}" \
    APPVEYOR_RE_BUILD="${rebuild}" \
    APPVEYOR_RE_RUN_INCOMPLETE="${rerun_incomplete}" \
    "$@"
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
[[ -f "${PLATFORM_IMAGES}" ]] || fail "shared AppVeyor platform image catalog is missing"

platform_contract="$(PLATFORM_IMAGES_UNDER_TEST="${PLATFORM_IMAGES}" bash -c '
  # shellcheck disable=SC1090
  source "${PLATFORM_IMAGES_UNDER_TEST}"
  printf "registry=%s\nnamespace=%s\n" "${BESKID_PLATFORM_REGISTRY}" "${BESKID_PLATFORM_NAMESPACE}"
  for lane in "${BESKID_PLATFORM_LANES[@]}"; do
    printf "%s|%s|%s\n" \
      "${lane}" \
      "$(beskid_platform_immutable_ref "${lane}" 0123456789abcdef0123456789abcdef01234567)" \
      "$(beskid_platform_production_ref "${lane}")"
  done
')"
expected_platform_contract='registry=cr.beskid-lang.org
namespace=cr.beskid-lang.org/beskid
site|cr.beskid-lang.org/beskid/site:sha-0123456789abcdef0123456789abcdef01234567|cr.beskid-lang.org/beskid/site:production
learn|cr.beskid-lang.org/beskid/learn:sha-0123456789abcdef0123456789abcdef01234567|cr.beskid-lang.org/beskid/learn:production
tracker|cr.beskid-lang.org/beskid/tracker:sha-0123456789abcdef0123456789abcdef01234567|cr.beskid-lang.org/beskid/tracker:production
nexus|cr.beskid-lang.org/beskid/nexus:sha-0123456789abcdef0123456789abcdef01234567|cr.beskid-lang.org/beskid/nexus:production
pckg|cr.beskid-lang.org/beskid/pckg:sha-0123456789abcdef0123456789abcdef01234567|cr.beskid-lang.org/beskid/pckg:production'
[[ "${platform_contract}" == "${expected_platform_contract}" ]] || \
  fail "shared platform image catalog does not define the exact registry, lanes, and refs"

if rg -n 'cr\.beskid-lang\.org|for lane in site learn tracker nexus pckg|\^\(site\|learn\|tracker\|nexus\|pckg\)' \
  "${PUBLISHER}" "${PROMOTER}" "${MANIFEST}"; then
  fail "platform image definitions are duplicated outside the shared library"
fi

ruby -e '
  require "yaml"
  config = YAML.safe_load(File.read(ARGV.fetch(0)), aliases: true)
  matrix = config.dig("environment", "matrix")
  abort "AppVeyor environment matrix is missing" unless matrix.is_a?(Array)
  lanes = matrix.map { |row| row.fetch("BESKID_CI_LANE") }
  expected = %w[linux-platform linux-compiler macos-compiler windows-compiler vscode-extension zed-extension]
  abort "unexpected AppVeyor lane matrix: #{lanes.inspect}" unless lanes.sort == expected.sort
  abort "AppVeyor deployment must be disabled" unless config["deploy"] == false
  abort "required jobs may not be allowed to fail" if config.dig("matrix", "allow_failures")
  abort "AppVeyor must serialize project builds through the FIFO queue" unless config["max_jobs"] == 1
  abort "AppVeyor must suppress duplicate branch builds when a PR exists" unless config["skip_branch_with_pr"] == true
  expected_jobs = {
    "linux-platform" => "linux-platform",
    "linux-compiler" => "linux-compiler",
    "macos-compiler" => "macos-compiler",
    "windows-compiler" => "windows-compiler",
    "vscode-extension" => "vscode-extension",
    "zed-extension" => "zed-extension"
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
  linux_compiler = matrix.find { |row| row.fetch("BESKID_CI_LANE") == "linux-compiler" }
  abort "linux compiler lane needs a cold-worker Clippy budget" unless linux_compiler["BESKID_CLIPPY_TIMEOUT"].to_i >= 3600
  abort "linux compiler lane needs a runtime-kit budget" unless linux_compiler["BESKID_RUNTIME_KIT_TIMEOUT"].to_i >= 3600
  editor_lanes = %w[vscode-extension zed-extension]
  editor_lanes.each do |lane|
    row = matrix.find { |candidate| candidate.fetch("BESKID_CI_LANE") == lane }
    abort "editor lane #{lane} is outside editor-validation" unless row["job_group"] == "editor-validation"
    abort "editor lane #{lane} has no stable job name" unless row["job_name"] == lane
    abort "editor lane #{lane} must use a Linux worker" unless row.fetch("APPVEYOR_BUILD_WORKER_IMAGE").downcase.include?("ubuntu")
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
if ! rg -q '^set -euo pipefail$' <<<"${entrypoint_content}"; then
  fail "platform lane must fail before promotion when package publication fails"
fi

entrypoint_log="$(mktemp "${TMPDIR:-/tmp}/appveyor-entrypoint-test.XXXXXX")"
package_failure_root="$(mktemp -d "${TMPDIR:-/tmp}/appveyor-package-failure-test.XXXXXX")"
set +e
ENTRYPOINT_UNDER_TEST="${ENTRYPOINT}" ENTRYPOINT_TEST_LOG="${entrypoint_log}" \
  APPVEYOR_BUILD_FOLDER="${package_failure_root}" bash -c '
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
if [[ -f "${package_failure_root}/.appveyor-reports/platform-images.json" ]]; then
  fail "package failure reached platform manifest finalization"
fi

promotion_failure_root="$(mktemp -d "${TMPDIR:-/tmp}/appveyor-promotion-failure-test.XXXXXX")"
mkdir -p "${promotion_failure_root}/.appveyor-reports"
cat >"${promotion_failure_root}/.appveyor-reports/platform-image-digests.tsv" <<'EOF'
site	cr.beskid-lang.org/beskid/site:sha-0123456789abcdef0123456789abcdef01234567	cr.beskid-lang.org/beskid/site@sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
learn	cr.beskid-lang.org/beskid/learn:sha-0123456789abcdef0123456789abcdef01234567	cr.beskid-lang.org/beskid/learn@sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
tracker	cr.beskid-lang.org/beskid/tracker:sha-0123456789abcdef0123456789abcdef01234567	cr.beskid-lang.org/beskid/tracker@sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
nexus	cr.beskid-lang.org/beskid/nexus:sha-0123456789abcdef0123456789abcdef01234567	cr.beskid-lang.org/beskid/nexus@sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
pckg	cr.beskid-lang.org/beskid/pckg:sha-0123456789abcdef0123456789abcdef01234567	cr.beskid-lang.org/beskid/pckg@sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
EOF
promotion_failure_log="${promotion_failure_root}/entrypoint.log"
set +e
# The inner shell expands the entrypoint harness variables.
# shellcheck disable=SC2016
run_isolated_appveyor_event main '' false false false false false \
  ENTRYPOINT_UNDER_TEST="${ENTRYPOINT}" ENTRYPOINT_TEST_LOG="${promotion_failure_log}" \
  APPVEYOR_REPO_COMMIT=0123456789abcdef0123456789abcdef01234567 \
  APPVEYOR_BUILD_ID=42 APPVEYOR_BUILD_VERSION=1.0.42 APPVEYOR_JOB_ID=job-42 \
  APPVEYOR_BUILD_FOLDER="${promotion_failure_root}" bash -c '
  source "${ENTRYPOINT_UNDER_TEST}"
  bash() {
    printf "%s\\n" "$*" >>"${ENTRYPOINT_TEST_LOG}"
    case "$*" in
      "scripts/ci/appveyor-image-manifest.sh finalize")
        command /bin/bash "$@"
        ;;
      "scripts/ci/appveyor-platform-promote.sh")
        return 86
        ;;
    esac
  }
  pnpm() {
    printf "pnpm %s\\n" "$*" >>"${ENTRYPOINT_TEST_LOG}"
  }
  run_linux_platform_lane
' >/dev/null 2>&1
promotion_failure_status=$?
set -e
[[ "${promotion_failure_status}" -eq 86 ]] || fail "cleanup-only promotion failure did not remain the platform lane result"
promotion_failure_manifest="${promotion_failure_root}/.appveyor-reports/platform-images.json"
[[ -f "${promotion_failure_manifest}" ]] || fail "cleanup-only promotion failure prevented platform manifest finalization"
jq -e '
  .source.sha == "0123456789abcdef0123456789abcdef01234567" and
  .build.id == "42" and .build.version == "1.0.42" and .job.id == "job-42" and
  ([.images[].lane] | sort) == ["learn", "nexus", "pckg", "site", "tracker"]
' "${promotion_failure_manifest}" >/dev/null || fail "pre-promotion manifest does not retain the five immutable image records"

rehearse_line="$(rg -n 'appveyor-package-publish\.sh rehearse' <<<"${entrypoint_content}" | cut -d: -f1)"
images_line="$(rg -n 'appveyor-platform-publish\.sh' <<<"${entrypoint_content}" | cut -d: -f1)"
packages_line="$(rg -n 'appveyor-package-publish\.sh publish' <<<"${entrypoint_content}" | cut -d: -f1)"
promote_line="$(rg -n 'appveyor-platform-promote\.sh' <<<"${entrypoint_content}" | cut -d: -f1)"
manifest_line="$(rg -n 'appveyor-image-manifest\.sh finalize' <<<"${entrypoint_content}" | cut -d: -f1)"
if [[ -z "${rehearse_line}" ]] || [[ -z "${images_line}" ]] || [[ -z "${packages_line}" ]] ||
   [[ -z "${promote_line}" ]] || [[ -z "${manifest_line}" ]] ||
   (( rehearse_line >= images_line || images_line >= packages_line || packages_line >= manifest_line || manifest_line >= promote_line )); then
  fail "platform lane must publish immutable images and packages, finalize evidence, then promote production tags"
fi

run_publisher() {
  local scenario="$1"
  local fake_bin log config_log mode_log rm_log status
  fake_bin="$(mktemp -d "${TMPDIR:-/tmp}/appveyor-publish-test.XXXXXX")"
  log="${fake_bin}/docker.log"
  config_log="${fake_bin}/docker-config.log"
  mode_log="${fake_bin}/docker-mode.log"
  rm_log="${fake_bin}/rm.log"
  mkdir -p "${fake_bin}/tmp" "${fake_bin}/ambient-docker-config"
  cat >"${fake_bin}/docker" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' "$*" >>"${DOCKER_TEST_LOG}"
printf '%s|%s\n' "${DOCKER_CONFIG:-unset}" "$*" >>"${DOCKER_CONFIG_TEST_LOG}"
case "${1:-}" in
  buildx)
    [[ "${2:-}" == "version" ]] && exit 0
    [[ "${2:-}" == "build" ]] && exit 0
    ;;
  login)
    printf '{}\n' >"${DOCKER_CONFIG}/config.json"
    directory_mode="$(stat -f '%Lp' "${DOCKER_CONFIG}" 2>/dev/null || stat -c '%a' "${DOCKER_CONFIG}")"
    file_mode="$(stat -f '%Lp' "${DOCKER_CONFIG}/config.json" 2>/dev/null || stat -c '%a' "${DOCKER_CONFIG}/config.json")"
    printf '%s|%s\n' "${directory_mode}" "${file_mode}" >>"${DOCKER_MODE_TEST_LOG}"
    [[ "${DOCKER_FAIL_LOGIN:-false}" != "true" ]] || exit 77
    exit 0
    ;;
  push)
    if [[ "${DOCKER_SIGNAL_ON_PUSH:-false}" == "true" && ! -f "${DOCKER_SIGNAL_MARKER}" ]]; then
      : >"${DOCKER_SIGNAL_MARKER}"
      kill -TERM "${PPID}"
      exit 143
    fi
    [[ "${DOCKER_FAIL_PUSH:-false}" != "true" ]] || exit 79
    exit 0
    ;;
  logout)
    [[ "${DOCKER_FAIL_LOGOUT:-false}" != "true" ]] || exit 83
    exit 0
    ;;
  image)
    [[ "${2:-}" == "inspect" ]] || exit 1
    immutable_ref="${!#}"
    printf '%s@sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef\n' "${immutable_ref%:*}"
    ;;
esac
exit 0
EOF
  cat >"${fake_bin}/rm" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' "$*" >>"${RM_TEST_LOG}"
[[ "${DOCKER_FAIL_REMOVE:-false}" != "true" ]] || exit 86
exec /bin/rm "$@"
EOF
  chmod +x "${fake_bin}/docker"
  chmod +x "${fake_bin}/rm"

  set +e
  case "${scenario}" in
    pull-request)
      run_isolated_appveyor_event main 42 false false false false false \
        PATH="${fake_bin}:${PATH}" TMPDIR="${fake_bin}/tmp" DOCKER_CONFIG="${fake_bin}/ambient-docker-config" \
        DOCKER_TEST_LOG="${log}" DOCKER_CONFIG_TEST_LOG="${config_log}" DOCKER_MODE_TEST_LOG="${mode_log}" RM_TEST_LOG="${rm_log}" \
        APPVEYOR_REPO_COMMIT=0123456789abcdef0123456789abcdef01234567 \
        APPVEYOR_BUILD_FOLDER="${fake_bin}/build" \
        bash "${PUBLISHER}" >/dev/null 2>&1
      ;;
    main-without-credentials)
      run_isolated_appveyor_event main '' false false false false false \
        PATH="${fake_bin}:${PATH}" TMPDIR="${fake_bin}/tmp" DOCKER_CONFIG="${fake_bin}/ambient-docker-config" \
        DOCKER_TEST_LOG="${log}" DOCKER_CONFIG_TEST_LOG="${config_log}" DOCKER_MODE_TEST_LOG="${mode_log}" RM_TEST_LOG="${rm_log}" \
        APPVEYOR_REPO_COMMIT=0123456789abcdef0123456789abcdef01234567 \
        APPVEYOR_BUILD_FOLDER="${fake_bin}/build" \
        bash "${PUBLISHER}" >/dev/null 2>&1
      ;;
    main|login-failure|logout-failure|cleanup-failure|push-and-cleanup-failure|signal)
      docker_fail_login=false
      docker_fail_logout=false
      docker_fail_remove=false
      docker_fail_push=false
      docker_signal_on_push=false
      [[ "${scenario}" != "login-failure" ]] || docker_fail_login=true
      [[ "${scenario}" != "logout-failure" ]] || docker_fail_logout=true
      [[ "${scenario}" != "cleanup-failure" && "${scenario}" != "push-and-cleanup-failure" ]] || docker_fail_remove=true
      [[ "${scenario}" != "push-and-cleanup-failure" ]] || docker_fail_push=true
      [[ "${scenario}" != "signal" ]] || docker_signal_on_push=true
      run_isolated_appveyor_event main '' false false false false false \
        PATH="${fake_bin}:${PATH}" TMPDIR="${fake_bin}/tmp" DOCKER_CONFIG="${fake_bin}/ambient-docker-config" \
        DOCKER_TEST_LOG="${log}" DOCKER_CONFIG_TEST_LOG="${config_log}" DOCKER_MODE_TEST_LOG="${mode_log}" RM_TEST_LOG="${rm_log}" \
        DOCKER_FAIL_LOGIN="${docker_fail_login}" \
        DOCKER_FAIL_LOGOUT="${docker_fail_logout}" DOCKER_FAIL_REMOVE="${docker_fail_remove}" \
        DOCKER_FAIL_PUSH="${docker_fail_push}" DOCKER_SIGNAL_ON_PUSH="${docker_signal_on_push}" \
        DOCKER_SIGNAL_MARKER="${fake_bin}/signal-sent" \
        APPVEYOR_REPO_COMMIT=0123456789abcdef0123456789abcdef01234567 \
        APPVEYOR_BUILD_FOLDER="${fake_bin}/build" \
        REGISTRY_USERNAME=test-user REGISTRY_PASSWORD=test-password \
        bash "${PUBLISHER}" >/dev/null 2>&1
      ;;
    forced-main)
      run_isolated_appveyor_event main '' false true false false false \
        PATH="${fake_bin}:${PATH}" TMPDIR="${fake_bin}/tmp" DOCKER_CONFIG="${fake_bin}/ambient-docker-config" \
        DOCKER_TEST_LOG="${log}" DOCKER_CONFIG_TEST_LOG="${config_log}" DOCKER_MODE_TEST_LOG="${mode_log}" RM_TEST_LOG="${rm_log}" \
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
  PUBLISHER_CONFIG_LOG="${config_log}"
  PUBLISHER_MODE_LOG="${mode_log}"
  PUBLISHER_RM_LOG="${rm_log}"
  PUBLISHER_FAKE_BIN="${fake_bin}"
}

assert_isolated_registry_session() {
  local scenario="$1"
  local command_log="$2"
  local config_log="$3"
  local mode_log="$4"
  local rm_log="$5"
  local fake_bin="$6"
  local registry_configs registry_config

  registry_configs="$(awk -F '|' '$2 ~ /^(login|push|logout) / { print $1 }' "${config_log}" | LC_ALL=C sort -u)"
  [[ "$(wc -l <<<"${registry_configs}" | tr -d ' ')" -eq 1 ]] || \
    fail "${scenario} did not use one isolated Docker config for login, push, and logout"
  registry_config="${registry_configs}"
  [[ "${registry_config}" == "${fake_bin}/tmp/"* ]] || \
    fail "${scenario} used the ambient Docker config"
  [[ "$(<"${mode_log}")" == '700|600' ]] || \
    fail "${scenario} Docker config directory/file defaults were not restrictive"
  [[ "$(wc -l <"${rm_log}" | tr -d ' ')" -eq 1 ]] || \
    fail "${scenario} did not attempt Docker config removal exactly once"
  [[ ! -e "${registry_config}" ]] || fail "${scenario} left the isolated Docker config behind"
  rg -q '^login cr\.beskid-lang\.org --username test-user --password-stdin$' "${command_log}" || \
    fail "${scenario} did not authenticate to the platform registry"
  rg -q '^logout cr\.beskid-lang\.org$' "${command_log}" || \
    fail "${scenario} did not log out of the platform registry"
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
assert_isolated_registry_session main-publisher "${PUBLISHER_LOG}" "${PUBLISHER_CONFIG_LOG}" \
  "${PUBLISHER_MODE_LOG}" "${PUBLISHER_RM_LOG}" "${PUBLISHER_FAKE_BIN}"
[[ "$(rg -c '^push cr\.beskid-lang\.org/beskid/(site|learn|tracker|nexus|pckg):sha-0123456789abcdef0123456789abcdef01234567$' "${PUBLISHER_LOG}")" -eq 5 ]] || \
  fail "trusted main publication did not push all five immutable tags"
if rg -q '^push .*:production$' "${PUBLISHER_LOG}"; then
  fail "immutable publisher pushed a mutable production tag"
fi
if rg -n '(^|/)(ghcr\.io|docker\.io)(/|$)' "${PUBLISHER_LOG}"; then
  fail "platform publisher used a registry other than cr.beskid-lang.org"
fi

run_publisher logout-failure
[[ "${PUBLISHER_STATUS}" -eq 83 ]] || fail "logout failure did not fail an otherwise successful publisher"
[[ "$(rg -c '^logout cr\.beskid-lang\.org$' "${PUBLISHER_LOG}")" -eq 1 ]] || \
  fail "logout failure was not attempted exactly once"
[[ "$(wc -l <"${PUBLISHER_RM_LOG}" | tr -d ' ')" -eq 1 ]] || \
  fail "logout failure prevented Docker config removal"

run_publisher login-failure
[[ "${PUBLISHER_STATUS}" -eq 77 ]] || fail "registry login failure did not remain the publisher result"
if rg -q '^(push|logout) ' "${PUBLISHER_LOG}"; then
  fail "registry login failure reached push or logout"
fi
[[ "$(wc -l <"${PUBLISHER_RM_LOG}" | tr -d ' ')" -eq 1 ]] || \
  fail "registry login failure did not remove its Docker config exactly once"

run_publisher cleanup-failure
[[ "${PUBLISHER_STATUS}" -eq 86 ]] || fail "Docker config removal failure did not fail an otherwise successful publisher"
cleanup_failure_config="$(awk -F '|' '$2 ~ /^login / { print $1; exit }' "${PUBLISHER_CONFIG_LOG}")"
[[ -d "${cleanup_failure_config}" ]] || fail "cleanup failure test did not leave its target for inspection"
/bin/rm -rf -- "${cleanup_failure_config}"

run_publisher push-and-cleanup-failure
[[ "${PUBLISHER_STATUS}" -eq 79 ]] || fail "cleanup failure replaced the original publisher failure"
original_failure_config="$(awk -F '|' '$2 ~ /^login / { print $1; exit }' "${PUBLISHER_CONFIG_LOG}")"
/bin/rm -rf -- "${original_failure_config}"

run_publisher signal
[[ "${PUBLISHER_STATUS}" -eq 143 ]] || fail "publisher signal path did not preserve the signal status"
[[ "$(rg -c '^logout cr\.beskid-lang\.org$' "${PUBLISHER_LOG}")" -eq 1 ]] || \
  fail "publisher signal path performed duplicate logout cleanup"
[[ "$(wc -l <"${PUBLISHER_RM_LOG}" | tr -d ' ')" -eq 1 ]] || \
  fail "publisher signal path performed duplicate Docker config cleanup"

run_promoter() {
  local scenario="$1"
  local fake_bin log config_log mode_log rm_log status
  fake_bin="$(mktemp -d "${TMPDIR:-/tmp}/appveyor-promote-test.XXXXXX")"
  log="${fake_bin}/docker.log"
  config_log="${fake_bin}/docker-config.log"
  mode_log="${fake_bin}/docker-mode.log"
  rm_log="${fake_bin}/rm.log"
  mkdir -p "${fake_bin}/tmp" "${fake_bin}/ambient-docker-config"
  : >"${log}"
  cat >"${fake_bin}/docker" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' "$*" >>"${DOCKER_TEST_LOG}"
printf '%s|%s\n' "${DOCKER_CONFIG:-unset}" "$*" >>"${DOCKER_CONFIG_TEST_LOG}"
case "${1:-}" in
  login)
    printf '{}\n' >"${DOCKER_CONFIG}/config.json"
    directory_mode="$(stat -f '%Lp' "${DOCKER_CONFIG}" 2>/dev/null || stat -c '%a' "${DOCKER_CONFIG}")"
    file_mode="$(stat -f '%Lp' "${DOCKER_CONFIG}/config.json" 2>/dev/null || stat -c '%a' "${DOCKER_CONFIG}/config.json")"
    printf '%s|%s\n' "${directory_mode}" "${file_mode}" >>"${DOCKER_MODE_TEST_LOG}"
    exit 0
    ;;
  pull|push|logout) exit 0 ;;
  image) [[ "${2:-}" == "tag" ]] && exit 0 ;;
  buildx) exit 97 ;;
esac
exit 1
EOF
  cat >"${fake_bin}/rm" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' "$*" >>"${RM_TEST_LOG}"
[[ "${DOCKER_FAIL_REMOVE:-false}" != "true" ]] || exit 86
exec /bin/rm "$@"
EOF
  chmod +x "${fake_bin}/docker"
  chmod +x "${fake_bin}/rm"

  set +e
  case "${scenario}" in
    main|cleanup-failure)
      docker_fail_remove=false
      [[ "${scenario}" != "cleanup-failure" ]] || docker_fail_remove=true
      run_isolated_appveyor_event main '' false false false false false \
        PATH="${fake_bin}:${PATH}" TMPDIR="${fake_bin}/tmp" DOCKER_CONFIG="${fake_bin}/ambient-docker-config" \
        DOCKER_TEST_LOG="${log}" DOCKER_CONFIG_TEST_LOG="${config_log}" DOCKER_MODE_TEST_LOG="${mode_log}" RM_TEST_LOG="${rm_log}" \
        DOCKER_FAIL_REMOVE="${docker_fail_remove}" \
        APPVEYOR_REPO_COMMIT=0123456789abcdef0123456789abcdef01234567 \
        REGISTRY_USERNAME=test-user REGISTRY_PASSWORD=test-password \
        bash "${PROMOTER}" >/dev/null 2>&1
      ;;
    pull-request)
      run_isolated_appveyor_event main 42 false false false false false \
        PATH="${fake_bin}:${PATH}" TMPDIR="${fake_bin}/tmp" DOCKER_CONFIG="${fake_bin}/ambient-docker-config" \
        DOCKER_TEST_LOG="${log}" DOCKER_CONFIG_TEST_LOG="${config_log}" DOCKER_MODE_TEST_LOG="${mode_log}" RM_TEST_LOG="${rm_log}" \
        APPVEYOR_REPO_COMMIT=0123456789abcdef0123456789abcdef01234567 \
        bash "${PROMOTER}" >/dev/null 2>&1
      ;;
    main-without-credentials)
      run_isolated_appveyor_event main '' false false false false false \
        PATH="${fake_bin}:${PATH}" TMPDIR="${fake_bin}/tmp" DOCKER_CONFIG="${fake_bin}/ambient-docker-config" \
        DOCKER_TEST_LOG="${log}" DOCKER_CONFIG_TEST_LOG="${config_log}" DOCKER_MODE_TEST_LOG="${mode_log}" RM_TEST_LOG="${rm_log}" \
        APPVEYOR_REPO_COMMIT=0123456789abcdef0123456789abcdef01234567 \
        bash "${PROMOTER}" >/dev/null 2>&1
      ;;
    *) fail "unknown promoter test scenario: ${scenario}" ;;
  esac
  status=$?
  set -e
  PROMOTER_STATUS="${status}"
  PROMOTER_LOG="${log}"
  PROMOTER_CONFIG_LOG="${config_log}"
  PROMOTER_MODE_LOG="${mode_log}"
  PROMOTER_RM_LOG="${rm_log}"
  PROMOTER_FAKE_BIN="${fake_bin}"
}

run_promoter main
[[ "${PROMOTER_STATUS}" -eq 0 ]] || fail "trusted main production promotion failed"
assert_isolated_registry_session main-promoter "${PROMOTER_LOG}" "${PROMOTER_CONFIG_LOG}" \
  "${PROMOTER_MODE_LOG}" "${PROMOTER_RM_LOG}" "${PROMOTER_FAKE_BIN}"
[[ "$(rg -c '^pull cr\.beskid-lang\.org/beskid/(site|learn|tracker|nexus|pckg):sha-0123456789abcdef0123456789abcdef01234567$' "${PROMOTER_LOG}")" -eq 5 ]] || \
  fail "promotion did not consume all immutable tags"
actual_tag_commands="$(mktemp "${TMPDIR:-/tmp}/appveyor-actual-tags.XXXXXX")"
expected_tag_commands="$(mktemp "${TMPDIR:-/tmp}/appveyor-expected-tags.XXXXXX")"
rg '^image tag ' "${PROMOTER_LOG}" | LC_ALL=C sort >"${actual_tag_commands}"
cat >"${expected_tag_commands}" <<'EOF'
image tag cr.beskid-lang.org/beskid/learn:sha-0123456789abcdef0123456789abcdef01234567 cr.beskid-lang.org/beskid/learn:production
image tag cr.beskid-lang.org/beskid/nexus:sha-0123456789abcdef0123456789abcdef01234567 cr.beskid-lang.org/beskid/nexus:production
image tag cr.beskid-lang.org/beskid/pckg:sha-0123456789abcdef0123456789abcdef01234567 cr.beskid-lang.org/beskid/pckg:production
image tag cr.beskid-lang.org/beskid/site:sha-0123456789abcdef0123456789abcdef01234567 cr.beskid-lang.org/beskid/site:production
image tag cr.beskid-lang.org/beskid/tracker:sha-0123456789abcdef0123456789abcdef01234567 cr.beskid-lang.org/beskid/tracker:production
EOF
cmp -s "${expected_tag_commands}" "${actual_tag_commands}" || \
  fail "promotion tag commands are not the exact one-to-one immutable-to-production mapping"
[[ "$(rg -c '^push cr\.beskid-lang\.org/beskid/(site|learn|tracker|nexus|pckg):production$' "${PROMOTER_LOG}")" -eq 5 ]] || \
  fail "promotion did not push all production tags"
if rg -q '^buildx ' "${PROMOTER_LOG}"; then
  fail "promotion rebuilt images instead of consuming immutable tags"
fi
rg -q '^logout cr\.beskid-lang\.org$' "${PROMOTER_LOG}" || fail "promotion did not log out of the registry"

run_promoter cleanup-failure
[[ "${PROMOTER_STATUS}" -eq 86 ]] || fail "Docker config removal failure did not fail an otherwise successful promoter"
[[ "$(rg -c '^push cr\.beskid-lang\.org/beskid/(site|learn|tracker|nexus|pckg):production$' "${PROMOTER_LOG}")" -eq 5 ]] || \
  fail "cleanup-only promoter failure occurred before all five production pushes"
[[ "$(rg -c '^logout cr\.beskid-lang\.org$' "${PROMOTER_LOG}")" -eq 1 ]] || \
  fail "cleanup-only promoter failure did not log out exactly once"
[[ "$(wc -l <"${PROMOTER_RM_LOG}" | tr -d ' ')" -eq 1 ]] || \
  fail "cleanup-only promoter failure did not attempt Docker config removal exactly once"
cleanup_failure_config="$(awk -F '|' '$2 ~ /^login / { print $1; exit }' "${PROMOTER_CONFIG_LOG}")"
[[ -d "${cleanup_failure_config}" ]] || fail "cleanup-only promoter failure did not leave its target for inspection"
/bin/rm -rf -- "${cleanup_failure_config}"

assert_promotion_did_not_mutate() {
  local scenario="$1"
  if rg -q '^(login|image tag|push) ' "${PROMOTER_LOG}"; then
    fail "${scenario} promotion reached a registry mutation command"
  fi
}

run_promoter pull-request
[[ "${PROMOTER_STATUS}" -eq 0 ]] || fail "pull-request promotion did not exit cleanly"
assert_promotion_did_not_mutate pull-request

run_promoter main-without-credentials
[[ "${PROMOTER_STATUS}" -ne 0 ]] || fail "trusted main promotion did not fail closed without credentials"
assert_promotion_did_not_mutate main-without-credentials

valid_digest_hash="$(printf '%064d' 0 | tr 0 a)"
short_digest_hash="$(printf '%063d' 0 | tr 0 a)"
assert_manifest_record_rejected() {
  local scenario="$1"
  local immutable_digest="$2"
  local invalid_manifest_root status
  invalid_manifest_root="$(mktemp -d "${TMPDIR:-/tmp}/appveyor-invalid-manifest-test.XXXXXX")"

  set +e
  run_isolated_appveyor_event main '' false false false false false \
    APPVEYOR_REPO_COMMIT=0123456789abcdef0123456789abcdef01234567 \
    APPVEYOR_BUILD_FOLDER="${invalid_manifest_root}" \
    bash "${MANIFEST}" record site "cr.beskid-lang.org/beskid/site:sha-0123456789abcdef0123456789abcdef01234567" "${immutable_digest}" >/dev/null 2>&1
  status=$?
  set -e

  [[ "${status}" -ne 0 ]] || fail "manifest accepted ${scenario} digest evidence"
}

assert_manifest_record_rejected malformed "cr.beskid-lang.org/beskid/site@sha256:aa-not-a-digest"
assert_manifest_record_rejected short "cr.beskid-lang.org/beskid/site@sha256:${short_digest_hash}"
assert_manifest_record_rejected trailing-garbage "cr.beskid-lang.org/beskid/site@sha256:${valid_digest_hash}-trailing"

manifest_root="$(mktemp -d "${TMPDIR:-/tmp}/appveyor-manifest-test.XXXXXX")"
run_isolated_appveyor_event main '' false false false false false \
  APPVEYOR_REPO_COMMIT=0123456789abcdef0123456789abcdef01234567 \
  APPVEYOR_BUILD_ID=42 APPVEYOR_BUILD_VERSION=1.0.42 APPVEYOR_JOB_ID=job-42 \
  APPVEYOR_BUILD_FOLDER="${manifest_root}" \
  bash "${MANIFEST}" record site "cr.beskid-lang.org/beskid/site:sha-0123456789abcdef0123456789abcdef01234567" "cr.beskid-lang.org/beskid/site@sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
for lane in learn tracker nexus pckg; do
  run_isolated_appveyor_event main '' false false false false false \
    APPVEYOR_REPO_COMMIT=0123456789abcdef0123456789abcdef01234567 \
    APPVEYOR_BUILD_ID=42 APPVEYOR_BUILD_VERSION=1.0.42 APPVEYOR_JOB_ID=job-42 \
    APPVEYOR_BUILD_FOLDER="${manifest_root}" \
    bash "${MANIFEST}" record "${lane}" "cr.beskid-lang.org/beskid/${lane}:sha-0123456789abcdef0123456789abcdef01234567" "cr.beskid-lang.org/beskid/${lane}@sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
done
run_isolated_appveyor_event main '' false false false false false \
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
      run_isolated_appveyor_event main 42 false false false false false \
        PATH="${fake_bin}:${PATH}" PACKAGE_TEST_LOG="${log}" \
        BESKID_PCKG_API_KEY=bpk_test \
        /bin/bash "${PACKAGE_PUBLISHER}" rehearse >/dev/null 2>&1 &&
      run_isolated_appveyor_event main 42 false false false false false \
        PATH="${fake_bin}:${PATH}" PACKAGE_TEST_LOG="${log}" \
        BESKID_PCKG_API_KEY=bpk_test \
        /bin/bash "${PACKAGE_PUBLISHER}" publish >/dev/null 2>&1
      ;;
    non-main)
      run_isolated_appveyor_event feature '' false false false false false \
        PATH="${fake_bin}:${PATH}" PACKAGE_TEST_LOG="${log}" \
        BESKID_PCKG_API_KEY=bpk_test \
        /bin/bash "${PACKAGE_PUBLISHER}" rehearse >/dev/null 2>&1 &&
      run_isolated_appveyor_event feature '' false false false false false \
        PATH="${fake_bin}:${PATH}" PACKAGE_TEST_LOG="${log}" \
        BESKID_PCKG_API_KEY=bpk_test \
        /bin/bash "${PACKAGE_PUBLISHER}" publish >/dev/null 2>&1
      ;;
    main-without-key)
      run_isolated_appveyor_event main '' false false false false false \
        PATH="${fake_bin}:${PATH}" PACKAGE_TEST_LOG="${log}" \
        /bin/bash "${PACKAGE_PUBLISHER}" rehearse >/dev/null 2>&1 &&
      run_isolated_appveyor_event main '' false false false false false \
        PATH="${fake_bin}:${PATH}" PACKAGE_TEST_LOG="${log}" \
        /bin/bash "${PACKAGE_PUBLISHER}" publish >/dev/null 2>&1
      ;;
    main)
      run_isolated_appveyor_event main '' false false false false false \
        PATH="${fake_bin}:${PATH}" PACKAGE_TEST_LOG="${log}" \
        BESKID_PCKG_API_KEY=bpk_test \
        /bin/bash "${PACKAGE_PUBLISHER}" rehearse >/dev/null 2>&1 &&
      run_isolated_appveyor_event main '' false false false false false \
        PATH="${fake_bin}:${PATH}" PACKAGE_TEST_LOG="${log}" \
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
