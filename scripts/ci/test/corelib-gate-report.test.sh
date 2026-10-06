#!/usr/bin/env bash
# Contract tests for the Corelib gate's durable Markdown report.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
source "${ROOT}/scripts/ci/test/lib/assert.sh"

TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT

# Rust PathBuf ordering compares path components, not the slash-separated
# UTF-8 string. `Emitter/Contracts.bd` sorts before sibling `Emitter.bd`.
ORDER_FIXTURE="${TMP}/fingerprint-order"
mkdir -p "${ORDER_FIXTURE}/packages/Emitter" "${ORDER_FIXTURE}/beskid_corelib"
printf 'workspace\n' > "${ORDER_FIXTURE}/CoreLib.bws"
printf 'file\n' > "${ORDER_FIXTURE}/packages/Emitter.bd"
printf 'child\n' > "${ORDER_FIXTURE}/packages/Emitter/Contracts.bd"
printf 'project\n' > "${ORDER_FIXTURE}/beskid_corelib/corelib.bproj"
assert_eq "64e0362c24229e5b78acab6bf33bf9a458e32e0be23fe9a7bbfec7782786981a" \
  "$(node "${ROOT}/scripts/ci/verify-release-corelib-bundle.mjs" --fingerprint "${ORDER_FIXTURE}")" \
  "bundle fingerprint matches Rust component-wise PathBuf ordering"

make_fixture() {
  local fixture="$1" cargo_mode="$2"
  mkdir -p "${fixture}/scripts/ci" "${fixture}/compiler/corelib/beskid_corelib/tests/corelib_tests" \
    "${fixture}/bin"
  cp "${ROOT}/scripts/ci/corelib-gate.sh" "${fixture}/scripts/ci/corelib-gate.sh"
  cp "${ROOT}/scripts/ci/verify-release-corelib-bundle.mjs" "${fixture}/scripts/ci/verify-release-corelib-bundle.mjs"
  chmod +x "${fixture}/scripts/ci/corelib-gate.sh"

  cat > "${fixture}/compiler/corelib/CoreLib.bws" <<'EOF'
workspace {
  name = "corelib"
}
member "corelib" {
  path = "beskid_corelib"
  package = "corelib"
}
member "foundation" {
  path = "packages/foundation"
  package = "corelib_foundation"
}
member "runtime" {
  path = "packages/runtime"
  package = "corelib_runtime"
}
member "compiler_sdk" {
  path = "packages/compiler-sdk"
  package = "corelib_compiler_sdk"
}
member "console" {
  path = "packages/console"
  package = "corelib_console"
}
member "concurrency" {
  path = "packages/concurrency"
  package = "corelib_concurrency"
}
member "corelib_tests" {
  path = "beskid_corelib/tests/corelib_tests"
  package = "corelib_tests"
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
    packages/foundation/src/Core/Collections/Collections.bd \
    packages/foundation/src/Core/Collections/Array.bd \
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
  printf 'lock-version = 2\n' > "${fixture}/compiler/corelib/packages/foundation/Project.lock"
  : > "${fixture}/compiler/Cargo.toml"
  mkdir -p "${fixture}/compiler/scripts"
  # shellcheck disable=SC2016 # Fixture script must expand these at runtime.
  printf '#!/usr/bin/env bash\nset -euo pipefail\nmkdir -p "${BESKID_RUNTIME_PREFIX}"\nprintf runtime > "${BESKID_RUNTIME_PREFIX}/runtime.txt"\n' \
    > "${fixture}/compiler/scripts/stage-native-runtime-kit.sh"
  chmod +x "${fixture}/compiler/scripts/stage-native-runtime-kit.sh"
  if [[ "${cargo_mode}" == pass ]]; then
    cat > "${fixture}/bin/cargo" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
mkdir -p target/release
cat > target/release/beskid_cli <<'CLI'
#!/usr/bin/env bash
set -euo pipefail
if [[ "${1:-}" == corelib ]]; then
  cp -R "$BESKID_CORELIB_SOURCE/packages" "$BESKID_CORELIB_ROOT/packages"
  cp -R "$BESKID_CORELIB_SOURCE/beskid_corelib" "$BESKID_CORELIB_ROOT/beskid_corelib"
  rm "$BESKID_CORELIB_ROOT/packages/foundation/Project.lock"
  cp "$BESKID_CORELIB_SOURCE/CoreLib.bws" "$BESKID_CORELIB_ROOT/CoreLib.bws"
  node "$BESKID_TEST_VERIFY_SCRIPT" --fingerprint "$BESKID_CORELIB_ROOT" > "$BESKID_CORELIB_ROOT/.beskid-bundle.sha256"
  if [[ "${BESKID_TEST_TAMPER_MATERIALIZED:-0}" == 1 ]]; then
    printf 'tampered\n' >> "$BESKID_CORELIB_ROOT/CoreLib.bws"
  fi
  exit 0
fi
if IFS= read -r unexpected; then
  printf 'unexpected inherited stdin: %s\n' "$unexpected" >&2
  exit 64
fi
exit 0
CLI
chmod +x target/release/beskid_cli
EOF
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

MANAGED_FIXTURE="${TMP}/managed"
make_fixture "${MANAGED_FIXTURE}" pass
mkdir "${MANAGED_FIXTURE}/installed"
CORELIB_REPORT_DIR="${MANAGED_FIXTURE}/report" PATH="${MANAGED_FIXTURE}/bin:${PATH}" \
  BESKID_RELEASE_MANAGED_CORELIB=1 BESKID_CORELIB_SOURCE="${MANAGED_FIXTURE}/compiler/corelib" \
  BESKID_TEST_VERIFY_SCRIPT="${MANAGED_FIXTURE}/scripts/ci/verify-release-corelib-bundle.mjs" \
  BESKID_CORELIB_ROOT="${MANAGED_FIXTURE}/installed" \
  bash "${MANAGED_FIXTURE}/scripts/ci/corelib-gate.sh"
assert_file_exists "${MANAGED_FIXTURE}/installed/.beskid-bundle.sha256" "managed bundle was materialized"
test ! -e "${MANAGED_FIXTURE}/installed/packages/foundation/Project.lock" || fail "tracked lockfile was embedded"
assert_contains "$(cat "${MANAGED_FIXTURE}/report/corelib-build-report.md")" \
  "| materialize pinned Corelib bundle | PASS |" "provisioning is a reported gate stage"
printf '%064d\n' 0 > "${MANAGED_FIXTURE}/installed/.beskid-bundle.sha256"
if node "${MANAGED_FIXTURE}/scripts/ci/verify-release-corelib-bundle.mjs" --verify \
  "${MANAGED_FIXTURE}/compiler/corelib" "${MANAGED_FIXTURE}/installed" >/dev/null 2>&1; then
  fail "stale Corelib fingerprint marker must be rejected"
fi

TAMPER_FIXTURE="${TMP}/tamper"
make_fixture "${TAMPER_FIXTURE}" pass
mkdir "${TAMPER_FIXTURE}/installed"
if CORELIB_REPORT_DIR="${TAMPER_FIXTURE}/report" PATH="${TAMPER_FIXTURE}/bin:${PATH}" \
  BESKID_RELEASE_MANAGED_CORELIB=1 BESKID_CORELIB_SOURCE="${TAMPER_FIXTURE}/compiler/corelib" \
  BESKID_TEST_VERIFY_SCRIPT="${TAMPER_FIXTURE}/scripts/ci/verify-release-corelib-bundle.mjs" \
  BESKID_CORELIB_ROOT="${TAMPER_FIXTURE}/installed" BESKID_TEST_TAMPER_MATERIALIZED=1 \
  bash "${TAMPER_FIXTURE}/scripts/ci/corelib-gate.sh" >"${TAMPER_FIXTURE}/stdout" 2>"${TAMPER_FIXTURE}/stderr"; then
  fail "tampered managed bundle must fail the Corelib gate"
fi
assert_contains "$(cat "${TAMPER_FIXTURE}/report/corelib-build-report.md")" \
  "| materialize pinned Corelib bundle | FAIL" "tampered bundle fails its reported stage"

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
