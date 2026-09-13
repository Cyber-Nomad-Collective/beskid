#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
runner="${root}/scripts/ci/woodpecker-security.sh"
workflow="${root}/.woodpecker/security.yml"
tmp="$(mktemp -d)"
trap 'rm -r -- "${tmp}"' EXIT

fail() {
  echo "woodpecker security test: $*" >&2
  exit 1
}

assert_contains() {
  local needle="$1" haystack="$2" message="$3"
  grep -Fq -- "${needle}" "${haystack}" || fail "${message}"
}

make_fixture() {
  local name="$1"
  local fixture="${tmp}/${name}"
  mkdir -p "${fixture}/root/scripts/ci" "${fixture}/bin"
  cat >"${fixture}/init-submodules.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$*" >>"${MOCK_INIT_LOG}"
EOF
  chmod +x "${fixture}/init-submodules.sh"
  cat >"${fixture}/bin/codeql" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$*" >>"${MOCK_CODEQL_LOG}"
case "$1 $2" in
  "database create")
    mkdir -p "$3"
    ;;
  "database analyze")
    output=""
    for argument in "$@"; do
      case "${argument}" in
        --output=*) output="${argument#--output=}" ;;
      esac
    done
    [[ -n "${output}" ]] || exit 88
    if [[ "${MOCK_CODEQL_MODE}" == scanner-failure && "$*" == *"/rust"* ]]; then
      exit 17
    fi
    case "${MOCK_CODEQL_MODE}" in
      findings)
        printf '%s\n' '{"version":"2.1.0","runs":[{"tool":{"driver":{"name":"CodeQL command-line toolchain","organization":"GitHub","version":"2.27.0","rules":[]}},"invocations":[{"executionSuccessful":true}],"results":[{"ruleId":"fixture"}]}]}' >"${output}"
        ;;
      empty-runs)
        printf '%s\n' '{"version":"2.1.0","runs":[]}' >"${output}"
        ;;
      wrong-tool)
        printf '%s\n' '{"version":"2.1.0","runs":[{"tool":{"driver":{"name":"fixture","organization":"GitHub","version":"2.27.0","rules":[]}},"results":[]}]}' >"${output}"
        ;;
      execution-failure)
        printf '%s\n' '{"version":"2.1.0","runs":[{"tool":{"driver":{"name":"CodeQL command-line toolchain","organization":"GitHub","version":"2.27.0","rules":[]}},"invocations":[{"executionSuccessful":false}],"results":[]}]}' >"${output}"
        ;;
      tool-error)
        printf '%s\n' '{"version":"2.1.0","runs":[{"tool":{"driver":{"name":"CodeQL command-line toolchain","organization":"GitHub","version":"2.27.0","rules":[]}},"invocations":[{"executionSuccessful":true,"toolExecutionNotifications":[{"level":"error"}]}],"results":[]}]}' >"${output}"
        ;;
      *)
        printf '%s\n' '{"version":"2.1.0","runs":[{"tool":{"driver":{"name":"CodeQL command-line toolchain","organization":"GitHub","version":"2.27.0","rules":[]}},"invocations":[{"executionSuccessful":true}],"results":[]}]}' >"${output}"
        ;;
    esac
    ;;
  *) exit 89 ;;
esac
EOF
  chmod +x "${fixture}/bin/codeql"
  printf '%s\n' "${fixture}"
}

run_fixture() {
  local fixture="$1" mode="$2"
  local output="${fixture}/output"
  env -u CI_PIPELINE_NUMBER -u CI_COMMIT_SHA \
  MOCK_CODEQL_LOG="${fixture}/codeql.log" \
  MOCK_INIT_LOG="${fixture}/submodules.log" \
  MOCK_CODEQL_MODE="${mode}" \
  WOODPECKER_SECURITY_ROOT="${fixture}/root" \
  WOODPECKER_SECURITY_OUTPUT="${output}" \
  WOODPECKER_SECURITY_CODEQL_BIN="${fixture}/bin/codeql" \
  WOODPECKER_SECURITY_INIT_SUBMODULES="${fixture}/init-submodules.sh" \
  WOODPECKER_SECURITY_SUMMARY_SCRIPT="${root}/scripts/ci/woodpecker-security-summary.mjs" \
  WOODPECKER_SECURITY_SUPERREPO_COMMIT="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" \
  WOODPECKER_SECURITY_COMPILER_COMMIT="bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" \
    bash "${runner}"
}

clean="$(make_fixture clean)"
run_fixture "${clean}" clean
node -e '
const result = require(process.argv[1]);
if (result.status !== "success") throw new Error("clean scan must succeed");
if (result.languages.length !== 3 || result.languages.some((entry) => entry.findings !== 0)) throw new Error("clean scan must retain three zero-finding categories");
' "${clean}/output/security-result.json"
assert_contains 'compiler pckg beskid_bsol beskid_treesitter beskid_vscode beskid_web_common beskid_nexus beskid_tracker' "${clean}/submodules.log" 'security scan must initialize active code submodules only'
assert_contains '--language=javascript-typescript' "${clean}/codeql.log" 'security scan must coalesce JavaScript and TypeScript'
assert_contains '--language=rust' "${clean}/codeql.log" 'security scan must analyze Rust'
assert_contains '--build-mode=none' "${clean}/codeql.log" 'security scan must use Rust build mode none'
assert_contains '--ram=2048' "${clean}/codeql.log" 'security scan must cap CodeQL memory at 2 GiB'
assert_contains '--threads=2' "${clean}/codeql.log" 'security scan must cap CodeQL concurrency at two threads'
assert_contains '--sarif-category=woodpecker-security-actions' "${clean}/codeql.log" 'Actions SARIF needs a distinct category'
assert_contains '--sarif-category=woodpecker-security-javascript-typescript' "${clean}/codeql.log" 'JavaScript SARIF needs a distinct category'
assert_contains '--sarif-category=woodpecker-security-rust' "${clean}/codeql.log" 'Rust SARIF needs a distinct category'

findings="$(make_fixture findings)"
if run_fixture "${findings}" findings; then
  fail 'scanner findings unexpectedly passed the security gate'
fi
node -e '
const result = require(process.argv[1]);
if (result.status !== "findings" || !result.languages.every((entry) => entry.findings === 1)) throw new Error("findings must be retained and fail the gate");
' "${findings}/output/security-result.json"
test -s "${findings}/output/sarif/actions.sarif" || fail 'findings SARIF must be retained'

scanner_failure="$(make_fixture scanner-failure)"
if run_fixture "${scanner_failure}" scanner-failure; then
  fail 'scanner failure unexpectedly passed the security gate'
fi
node -e '
const result = require(process.argv[1]);
if (result.status !== "scanner-failure") throw new Error("scanner failure must be retained in the summary");
if (result.languages.find((entry) => entry.language === "rust").status !== "scanner-failure") throw new Error("Rust scanner failure must be explicit");
' "${scanner_failure}/output/security-result.json"

for malformed_mode in empty-runs wrong-tool execution-failure tool-error; do
  malformed="$(make_fixture "${malformed_mode}")"
  if run_fixture "${malformed}" "${malformed_mode}"; then
    fail "${malformed_mode} SARIF unexpectedly passed the security gate"
  fi
  node -e '
  const result = require(process.argv[1]);
  if (result.status !== "scanner-failure") throw new Error("malformed SARIF must become a scanner failure");
  ' "${malformed}/output/security-result.json"
done

override_fixture="$(make_fixture ci-override)"
if CI_PIPELINE_NUMBER=7 CI_COMMIT_SHA=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa \
  WOODPECKER_SECURITY_CODEQL_BIN="${override_fixture}/bin/codeql" \
  bash "${runner}" >"${override_fixture}/override.out" 2>"${override_fixture}/override.err"; then
  fail 'a real pipeline accepted a test-only CodeQL override'
fi
assert_contains 'WOODPECKER_SECURITY_CODEQL_BIN is test-only' "${override_fixture}/override.err" 'real pipeline must reject a test-only CodeQL override'

assert_contains 'security-weekly' "${workflow}" 'workflow must bind the weekly cron name'
assert_contains 'branch: main' "${workflow}" 'workflow must run trusted main pushes'
assert_contains 'codex/woodpecker-migration' "${workflow}" 'workflow must permit manual migration-branch verification'
if grep -Eiq '(upload-results|security_events|github upload|sarif upload)' "${workflow}" "${runner}"; then
  fail 'analysis-only security workflow must not upload SARIF by default'
fi
if grep -Eq 'WOODPECKER_SECURITY_CODEQL_BUNDLE_(URL|SHA256):' "${workflow}"; then
  fail 'workflow must not override the script-owned CodeQL bundle pin'
fi

echo 'woodpecker security tests OK'
