#!/usr/bin/env bash
# Contract for the AppVeyor validation/image-publication boundary.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
APPVEYOR_CONFIG="${ROOT}/appveyor.yml"
PUBLISHER="${ROOT}/scripts/ci/appveyor-platform-publish.sh"
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

entrypoint_content="$(<"${ROOT}/scripts/ci/appveyor-entrypoint.sh")"
rehearse_line="$(rg -n 'appveyor-package-publish\.sh rehearse' <<<"${entrypoint_content}" | cut -d: -f1)"
images_line="$(rg -n 'appveyor-platform-publish\.sh' <<<"${entrypoint_content}" | cut -d: -f1)"
packages_line="$(rg -n 'appveyor-package-publish\.sh publish' <<<"${entrypoint_content}" | cut -d: -f1)"
if [[ -z "${rehearse_line}" ]] || [[ -z "${images_line}" ]] || [[ -z "${packages_line}" ]] ||
   (( rehearse_line >= images_line || images_line >= packages_line )); then
  fail "platform lane must rehearse packages before images and publish packages only after all image pushes"
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
        bash "${PUBLISHER}" >/dev/null 2>&1
      ;;
    main-without-credentials)
      PATH="${fake_bin}:${PATH}" DOCKER_TEST_LOG="${log}" \
        APPVEYOR_REPO_BRANCH=main APPVEYOR_PULL_REQUEST_NUMBER='' \
        APPVEYOR_REPO_TAG=false \
        APPVEYOR_REPO_COMMIT=0123456789abcdef0123456789abcdef01234567 \
        bash "${PUBLISHER}" >/dev/null 2>&1
      ;;
    main)
      PATH="${fake_bin}:${PATH}" DOCKER_TEST_LOG="${log}" \
        APPVEYOR_REPO_BRANCH=main APPVEYOR_PULL_REQUEST_NUMBER='' \
        APPVEYOR_REPO_TAG=false \
        APPVEYOR_REPO_COMMIT=0123456789abcdef0123456789abcdef01234567 \
        REGISTRY_USERNAME=test-user REGISTRY_PASSWORD=test-password \
        bash "${PUBLISHER}" >/dev/null 2>&1
      ;;
    forced-main)
      PATH="${fake_bin}:${PATH}" DOCKER_TEST_LOG="${log}" \
        APPVEYOR_REPO_BRANCH=main APPVEYOR_PULL_REQUEST_NUMBER='' \
        APPVEYOR_REPO_TAG=False APPVEYOR_FORCED_BUILD=True \
        APPVEYOR_REPO_COMMIT=0123456789abcdef0123456789abcdef01234567 \
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
[[ "$(rg -c '^push cr\.beskid-lang\.org/beskid/(site|learn|tracker|nexus|pckg):(sha-0123456789abcdef0123456789abcdef01234567|production)$' "${PUBLISHER_LOG}")" -eq 10 ]] || \
  fail "trusted main publication did not push both required tags for all five lanes"
if rg -n '(^|/)(ghcr\.io|docker\.io)(/|$)' "${PUBLISHER_LOG}"; then
  fail "platform publisher used a registry other than cr.beskid-lang.org"
fi

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
