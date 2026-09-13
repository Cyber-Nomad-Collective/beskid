#!/usr/bin/env bash
# Run an analysis-only, provider-independent CodeQL security gate.
set -euo pipefail

readonly CODEQL_BUNDLE_VERSION="2.27.0"
readonly DEFAULT_CODEQL_BUNDLE_URL="https://github.com/github/codeql-action/releases/download/codeql-bundle-v2.27.0/codeql-bundle-linux64.tar.gz"
readonly DEFAULT_CODEQL_BUNDLE_SHA256="8e870433e5c80d0e916c3c1aa9005fc88aab990bcdcc649fade9dfc4d7e94305"

if [[ -n "${CI_PIPELINE_NUMBER:-}" || -n "${CI_COMMIT_SHA:-}" ]]; then
  for override in \
    WOODPECKER_SECURITY_ROOT \
    WOODPECKER_SECURITY_OUTPUT \
    WOODPECKER_SECURITY_CODEQL_BIN \
    WOODPECKER_SECURITY_SUMMARY_SCRIPT \
    WOODPECKER_SECURITY_INIT_SUBMODULES \
    WOODPECKER_SECURITY_CODEQL_BUNDLE_URL \
    WOODPECKER_SECURITY_CODEQL_BUNDLE_SHA256 \
    WOODPECKER_SECURITY_SUPERREPO_COMMIT \
    WOODPECKER_SECURITY_COMPILER_COMMIT; do
    if printenv "${override}" >/dev/null; then
      echo "${override} is test-only and must not be set in a Woodpecker pipeline" >&2
      exit 2
    fi
  done
fi

root="${WOODPECKER_SECURITY_ROOT:-$(cd "$(dirname "$0")/../.." && pwd)}"
summary_script="${WOODPECKER_SECURITY_SUMMARY_SCRIPT:-${root}/scripts/ci/woodpecker-security-summary.mjs}"
init_submodules="${WOODPECKER_SECURITY_INIT_SUBMODULES:-${root}/scripts/ci/init-submodules.sh}"
bundle_url="${WOODPECKER_SECURITY_CODEQL_BUNDLE_URL:-${DEFAULT_CODEQL_BUNDLE_URL}}"
bundle_sha256="${WOODPECKER_SECURITY_CODEQL_BUNDLE_SHA256:-${DEFAULT_CODEQL_BUNDLE_SHA256}}"

if [[ -n "${WOODPECKER_SECURITY_OUTPUT:-}" ]]; then
  output="${WOODPECKER_SECURITY_OUTPUT}"
else
  : "${CI_PIPELINE_NUMBER:?CI_PIPELINE_NUMBER is required when WOODPECKER_SECURITY_OUTPUT is unset}"
  : "${CI_COMMIT_SHA:?CI_COMMIT_SHA is required when WOODPECKER_SECURITY_OUTPUT is unset}"
  output="/woodpecker-output/security/${CI_PIPELINE_NUMBER}-${CI_COMMIT_SHA}"
fi
case "${output}" in /*) ;; *) echo 'security output directory must be absolute' >&2; exit 2 ;; esac
mkdir -p "${output}"
if find "${output}" -mindepth 1 -maxdepth 1 -print -quit | grep -q .; then
  echo "security output directory must be empty: ${output}" >&2
  exit 2
fi

for command in bash git node tar; do
  command -v "${command}" >/dev/null 2>&1 || { echo "security scan requires ${command}" >&2; exit 2; }
done

bash "${init_submodules}" compiler pckg beskid_bsol beskid_treesitter beskid_vscode beskid_web_common beskid_nexus beskid_tracker
superrepo_commit="${WOODPECKER_SECURITY_SUPERREPO_COMMIT:-$(git -C "${root}" rev-parse HEAD)}"
compiler_commit="${WOODPECKER_SECURITY_COMPILER_COMMIT:-$(git -C "${root}/compiler" rev-parse HEAD)}"
for commit in "${superrepo_commit}" "${compiler_commit}"; do
  [[ "${commit}" =~ ^[0-9a-f]{40}$ ]] || { echo "security scan requires a lowercase 40-character Git commit, found: ${commit}" >&2; exit 2; }
done

if [[ -n "${WOODPECKER_SECURITY_CODEQL_BIN:-}" ]]; then
  codeql="${WOODPECKER_SECURITY_CODEQL_BIN}"
  [[ -x "${codeql}" ]] || { echo "configured CodeQL binary is not executable: ${codeql}" >&2; exit 2; }
else
  command -v curl >/dev/null 2>&1 || { echo 'security scan requires curl to fetch the pinned CodeQL bundle' >&2; exit 2; }
  command -v sha256sum >/dev/null 2>&1 || { echo 'security scan requires sha256sum to verify the CodeQL bundle' >&2; exit 2; }
  tooling="${output}/tooling"
  archive="${tooling}/codeql-bundle-linux64.tar.gz"
  mkdir -p "${tooling}"
  curl --fail --location --retry 3 --output "${archive}" "${bundle_url}"
  actual_sha256="$(sha256sum "${archive}" | awk '{print $1}')"
  [[ "${actual_sha256}" == "${bundle_sha256}" ]] || { echo "CodeQL bundle checksum mismatch: expected ${bundle_sha256}, got ${actual_sha256}" >&2; exit 2; }
  tar -xzf "${archive}" -C "${tooling}"
  codeql="${tooling}/codeql/codeql"
  [[ -x "${codeql}" ]] || { echo "pinned CodeQL bundle did not contain ${codeql}" >&2; exit 2; }
fi

mkdir -p "${output}/databases" "${output}/sarif" "${output}/statuses"
record_status() {
  local language="$1" status="$2" findings="$3"
  printf '{"language":"%s","category":"woodpecker-security-%s","status":"%s","findings":%s,"sarif":"sarif/%s.sarif"}\n' \
    "${language}" "${language}" "${status}" "${findings}" "${language}" >"${output}/statuses/${language}.json"
}
run_language() {
  local language="$1" build_mode="$2" database="${output}/databases/${1}" sarif="${output}/sarif/${1}.sarif"
  local status="success" findings=0
  local create=(database create "${database}" "--language=${language}" "--source-root=${root}" --ram=2048 --threads=2)
  [[ -z "${build_mode}" ]] || create+=("--build-mode=${build_mode}")
  if ! "${codeql}" "${create[@]}"; then
    status="scanner-failure"
  elif ! "${codeql}" database analyze "${database}" --ram=2048 --threads=2 --format=sarif-latest "--output=${sarif}" "--sarif-category=woodpecker-security-${language}"; then
    status="scanner-failure"
  elif ! findings="$(node "${summary_script}" --count-sarif "${sarif}")"; then
    status="scanner-failure"
    findings=0
  elif [[ ! "${findings}" =~ ^[0-9]+$ ]]; then
    status="scanner-failure"
    findings=0
  elif [[ "${findings}" -gt 0 ]]; then
    status="findings"
  fi
  record_status "${language}" "${status}" "${findings}"
}

# JavaScript/TypeScript and Actions are extracted without a build command.
run_language actions ""
run_language javascript-typescript ""
# Rust supports extraction without an autobuild on the VPS worker.
run_language rust none

set +e
node "${summary_script}" --finalize "${output}" "${superrepo_commit}" "${compiler_commit}" "${CODEQL_BUNDLE_VERSION}"
result=$?
set -e
printf 'WOODPECKER_SECURITY_OUTPUT=%s\n' "${output}"
exit "${result}"
