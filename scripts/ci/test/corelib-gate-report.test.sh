#!/usr/bin/env bash
# Contract tests for the Corelib gate's durable Markdown report.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
source "${ROOT}/scripts/ci/test/lib/assert.sh"

TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT

make_fixture() {
  local fixture="$1" cargo_mode="$2"
  mkdir -p "${fixture}/scripts/ci" "${fixture}/compiler/corelib/beskid_corelib/tests/corelib_tests" \
    "${fixture}/bin"
  cp "${ROOT}/scripts/ci/corelib-gate.sh" "${fixture}/scripts/ci/corelib-gate.sh"
  chmod +x "${fixture}/scripts/ci/corelib-gate.sh"

  cat > "${fixture}/compiler/corelib/CoreLib.bws" <<'EOF'
name = "corelib"
member "corelib" {
  package = "corelib"
}
member "foundation" {
  package = "corelib_foundation"
}
member "runtime" {
  package = "corelib_runtime"
}
member "compiler_sdk" {
  package = "corelib_compiler_sdk"
}
member "console" {
  package = "corelib_console"
}
member "concurrency" {
  package = "corelib_concurrency"
}
EOF
  for item in \
    "beskid_corelib corelib" \
    "packages/foundation corelib_foundation" \
    "packages/runtime corelib_runtime" \
    "packages/compiler-sdk corelib_compiler_sdk" \
    "packages/console corelib_console" \
    "packages/concurrency corelib_concurrency"; do
    read -r path name <<<"${item}"
    mkdir -p "${fixture}/compiler/corelib/${path}"
    printf 'name = "%s"\n' "${name}" > "${fixture}/compiler/corelib/${path}/fixture.bproj"
    : > "${fixture}/compiler/corelib/${path}/README.md"
  done
  printf 'name = "corelib"\ntype = "Aggregate"\nversion = "0.4.0"\n' \
    > "${fixture}/compiler/corelib/beskid_corelib/fixture.bproj"
  printf 'name = "corelib_tests"\n' \
    > "${fixture}/compiler/corelib/beskid_corelib/tests/corelib_tests/fixture.bproj"
  for file in \
    packages/foundation/src/Core/Results/Results.bd \
    packages/foundation/.generated/Core/Text/Regex/Generated.g.bd \
    packages/foundation/src/Core/ErrorHandling/ErrorHandling.bd \
    packages/foundation/src/Core/String/String.bd \
    packages/foundation/src/Core/Optional/Option.bd \
    packages/foundation/src/Collections/Collections.bd \
    packages/foundation/src/Collections/Array.bd \
    packages/foundation/src/Query/Query.bd \
    packages/foundation/src/Query/QueryState.bd \
    packages/foundation/src/Testing/Testing.bd \
    packages/foundation/src/Testing/Assert.bd \
    packages/foundation/src/Testing/Contracts.bd \
    packages/foundation/src/Core/Input/Input.bd \
    packages/foundation/src/Core/Output/Output.bd \
    packages/foundation/src/Core/Syscall/Syscall.bd; do
    mkdir -p "$(dirname "${fixture}/compiler/corelib/${file}")"
    : > "${fixture}/compiler/corelib/${file}"
  done
  : > "${fixture}/compiler/Cargo.toml"
  mkdir -p "${fixture}/compiler/scripts"
  # shellcheck disable=SC2016 # Fixture script must expand these at runtime.
  printf '#!/usr/bin/env bash\nset -euo pipefail\nmkdir -p "${BESKID_RUNTIME_PREFIX}"\nprintf runtime > "${BESKID_RUNTIME_PREFIX}/runtime.txt"\n' \
    > "${fixture}/compiler/scripts/stage-native-runtime-kit.sh"
  chmod +x "${fixture}/compiler/scripts/stage-native-runtime-kit.sh"
  if [[ "${cargo_mode}" == pass ]]; then
    printf '#!/usr/bin/env bash\nset -euo pipefail\nmkdir -p target/release\nprintf "#!/usr/bin/env bash\\nset -euo pipefail\\nif IFS= read -r unexpected; then\\n  printf \\"unexpected inherited stdin: %%s\\\\n\\" \\"\\${unexpected}\\" >&2\\n  exit 64\\nfi\\nexit 0\\n" > target/release/beskid_cli\nchmod +x target/release/beskid_cli\n' \
      > "${fixture}/bin/cargo"
  else
    printf '#!/usr/bin/env bash\nprintf "cargo fixture failure\\n" >&2\nexit 42\n' > "${fixture}/bin/cargo"
  fi
  chmod +x "${fixture}/bin/cargo"
}

PASS_FIXTURE="${TMP}/pass"
make_fixture "${PASS_FIXTURE}" pass
CORELIB_REPORT_DIR="${PASS_FIXTURE}/report" PATH="${PASS_FIXTURE}/bin:${PATH}" \
  bash "${PASS_FIXTURE}/scripts/ci/corelib-gate.sh" <<<"interactive input must not reach Corelib tests"
PASS_REPORT="${PASS_FIXTURE}/report/corelib-build-report.md"
assert_file_exists "${PASS_REPORT}" "success produces the Corelib Markdown report"
PASS_MD="$(cat "${PASS_REPORT}")"
assert_contains "${PASS_MD}" "# Corelib build report" "report has a stable title"
assert_contains "${PASS_MD}" "corelib manifest version | 0.4.0" "report records manifest metadata"
assert_contains "${PASS_MD}" "runtime kit files" "report records runtime-kit metadata"
assert_contains "${PASS_MD}" "| quality checks | PASS |" "report records quality command outcome"
assert_contains "${PASS_MD}" "| build beskid_cli (release) | PASS |" "report records build command outcome"
assert_contains "${PASS_MD}" "| stage native runtime kit | PASS |" "report records runtime staging outcome"
assert_contains "${PASS_MD}" "| run Corelib tests | PASS |" "report records test command outcome"

FAIL_FIXTURE="${TMP}/fail"
make_fixture "${FAIL_FIXTURE}" fail
set +e
CORELIB_REPORT_DIR="${FAIL_FIXTURE}/report" PATH="${FAIL_FIXTURE}/bin:${PATH}" \
  bash "${FAIL_FIXTURE}/scripts/ci/corelib-gate.sh" >"${FAIL_FIXTURE}/stdout" 2>"${FAIL_FIXTURE}/stderr"
FAIL_RC=$?
set -e
if [[ "${FAIL_RC}" -eq 0 ]]; then
  fail "fixture cargo failure must fail the Corelib gate"
fi
FAIL_REPORT="${FAIL_FIXTURE}/report/corelib-build-report.md"
assert_file_exists "${FAIL_REPORT}" "failure still produces the Corelib Markdown report"
FAIL_MD="$(cat "${FAIL_REPORT}")"
assert_contains "${FAIL_MD}" "| build beskid_cli (release) | FAIL (exit 42) |" "report records command exit status"
assert_contains "${FAIL_MD}" "cargo fixture failure" "report includes the failing command tail"

QUALITY_FAIL_FIXTURE="${TMP}/quality-fail"
make_fixture "${QUALITY_FAIL_FIXTURE}" pass
printf 'name = "duplicate_foundation"\n' > "${QUALITY_FAIL_FIXTURE}/compiler/corelib/packages/foundation/duplicate.bproj"
set +e
CORELIB_REPORT_DIR="${QUALITY_FAIL_FIXTURE}/report" PATH="${QUALITY_FAIL_FIXTURE}/bin:${PATH}" \
  bash "${QUALITY_FAIL_FIXTURE}/scripts/ci/corelib-gate.sh" >"${QUALITY_FAIL_FIXTURE}/stdout" 2>"${QUALITY_FAIL_FIXTURE}/stderr"
QUALITY_FAIL_RC=$?
set -e
if [[ "${QUALITY_FAIL_RC}" -eq 0 ]]; then
  fail "malformed quality fixture must fail the Corelib gate"
fi
QUALITY_FAIL_REPORT="${QUALITY_FAIL_FIXTURE}/report/corelib-build-report.md"
assert_file_exists "${QUALITY_FAIL_REPORT}" "malformed quality fixture produces a report"
QUALITY_FAIL_MD="$(cat "${QUALITY_FAIL_REPORT}")"
assert_contains "${QUALITY_FAIL_MD}" "| quality checks | FAIL (exit 1) |" \
  "report attributes malformed manifest discovery to quality checks"
assert_contains "${QUALITY_FAIL_MD}" "Expected exactly one .bproj" \
  "report includes a sanitized diagnostic tail for malformed manifest discovery"

finish_tests
