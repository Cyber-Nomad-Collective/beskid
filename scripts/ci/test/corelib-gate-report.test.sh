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
member "network" {
  path = "packages/network"
  package = "corelib_network"
}
member "uri" {
  path = "packages/uri"
  package = "corelib_uri"
}
member "codec" {
  path = "packages/codec"
  package = "corelib_codec"
}
member "connect" {
  path = "packages/connect"
  package = "corelib_connect"
}
member "crypto" {
  path = "packages/crypto"
  package = "corelib_crypto"
}
member "x509" {
  path = "packages/x509"
  package = "corelib_x509"
}
member "tls" {
  path = "packages/tls"
  package = "corelib_tls"
}
member "http" {
  path = "packages/http"
  package = "corelib_http"
}
member "http2" {
  path = "packages/http2"
  package = "corelib_http2"
}
member "quic" {
  path = "packages/quic"
  package = "corelib_quic"
}
member "http3" {
  path = "packages/http3"
  package = "corelib_http3"
}
member "websocket" {
  path = "packages/websocket"
  package = "corelib_websocket"
}
member "web" {
  path = "packages/web"
  package = "corelib_web"
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
    "packages/concurrency corelib_concurrency" \
    "packages/network corelib_network" \
    "packages/uri corelib_uri" \
    "packages/codec corelib_codec" \
    "packages/connect corelib_connect" \
    "packages/crypto corelib_crypto" \
    "packages/x509 corelib_x509" \
    "packages/tls corelib_tls" \
    "packages/http corelib_http" \
    "packages/http2 corelib_http2" \
    "packages/quic corelib_quic" \
    "packages/http3 corelib_http3" \
    "packages/websocket corelib_websocket" \
    "packages/web corelib_web"; do
    read -r path name <<<"${item}"
    mkdir -p "${fixture}/compiler/corelib/${path}"
    printf 'name = "%s"\n' "${name}" > "${fixture}/compiler/corelib/${path}/fixture.bproj"
    : > "${fixture}/compiler/corelib/${path}/README.md"
  done
  for path in packages/uri/tests packages/codec/tests packages/crypto/tests packages/x509/tests \
    packages/network/tests/compile-fail packages/connect/tests packages/tls/tests packages/quic/tests \
    packages/http2/tests packages/http3/tests packages/websocket/tests packages/web/tests; do
    mkdir -p "${fixture}/compiler/corelib/${path}"
    printf 'name = "fixture_tests"\n' > "${fixture}/compiler/corelib/${path}/fixture_tests.bproj"
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
  mkdir -p "${fixture}/beskid_bsol/conformance/cases" "${fixture}/beskid_bsol/schemas"
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
if [[ " $* " == *" --bin beskid_release_fixture "* ]]; then
  printf '#!/usr/bin/env bash\nexit 0\n' > target/release/beskid_release_fixture
  chmod +x target/release/beskid_release_fixture
  exit 0
fi
cat > target/release/beskid_cli <<'CLI'
#!/usr/bin/env bash
set -euo pipefail
if [[ "${1:-}" == dev && "${2:-}" == corelib ]]; then
  cp -R "$BESKID_CORELIB_SOURCE/packages" "$BESKID_CORELIB_ROOT/packages"
  cp -R "$BESKID_CORELIB_SOURCE/beskid_corelib" "$BESKID_CORELIB_ROOT/beskid_corelib"
  rm "$BESKID_CORELIB_ROOT/packages/foundation/Project.lock"
  # The bundle omits nested test projects that are not workspace members.
  find "$BESKID_CORELIB_ROOT/packages" -mindepth 2 -name fixture_tests.bproj -print0 |
    while IFS= read -r -d '' manifest; do rm -rf "$(dirname "$manifest")"; done
  cp "$BESKID_CORELIB_SOURCE/CoreLib.bws" "$BESKID_CORELIB_ROOT/CoreLib.bws"
  node "$BESKID_TEST_VERIFY_SCRIPT" --fingerprint "$BESKID_CORELIB_ROOT" > "$BESKID_CORELIB_ROOT/.beskid-bundle.sha256"
  if [[ "${BESKID_TEST_TAMPER_MATERIALIZED:-0}" == 1 ]]; then
    printf 'tampered\n' >> "$BESKID_CORELIB_ROOT/CoreLib.bws"
  fi
  exit 0
fi
[[ "${BESKID_BSOL_CORPUS:-}" == */beskid_bsol/conformance && -d "${BESKID_BSOL_CORPUS}/cases" ]] || {
  echo "Corelib tests did not receive the pinned BSOL corpus" >&2; exit 65; }
[[ -x "${BESKID_V06_RELEASE_FIXTURE:-}" ]] || { echo "Corelib tests did not receive the process fixture" >&2; exit 66; }
if IFS= read -r unexpected; then
  printf 'unexpected inherited stdin: %s\n' "$unexpected" >&2
  exit 64
fi
if [[ -n "${BESKID_TEST_CLI_LOG:-}" ]]; then
  printf '%s|%s\n' "$PWD" "$*" >> "${BESKID_TEST_CLI_LOG}"
fi
case " $* " in
  *" --target RawHandle "*) echo 'inaccessible struct field `handle`' >&2; exit 1 ;;
  *" --target RawDeadline "*) echo 'type mismatch: expected Core::Optional::Option::Option<Core::Time::Deadline::Deadline>, got i64' >&2; exit 1 ;;
  *" --target UdpIsNotStream "*)
    [[ "${BESKID_TEST_COMPILE_FAIL_ACCEPTS:-0}" == 1 ]] && exit 0
    echo 'type mismatch: expected Stream, got UdpSocket' >&2; exit 1 ;;
esac
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
  BESKID_TEST_CLI_LOG="${PASS_FIXTURE}/cli.log" \
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
assert_contains "${PASS_MD}" "| provision release-case inputs | PASS |" "report records release-case input provisioning"
assert_contains "${PASS_MD}" "| run network package tests | PASS |" "report records the network package test step"
assert_contains "${PASS_MD}" "| check network compile-fail fixtures | PASS |" "report records the compile-fail fixture step"
PASS_CLI_LOG="$(cat "${PASS_FIXTURE}/cli.log")"
for project in uri codec crypto x509 connect tls quic http2 http3 websocket web; do
  dir="packages/${project}/tests"
  assert_contains "${PASS_CLI_LOG}" "/compiler/corelib/${dir}|test --project fixture_tests.bproj --all-targets --plain --exclude-tag bench" \
    "network test project ${dir} runs every target and excludes bench tests"
done
for target in RawHandle RawDeadline UdpIsNotStream; do
  assert_contains "${PASS_CLI_LOG}" "/compiler/corelib/packages/network/tests/compile-fail|test --project fixture_tests.bproj --target ${target} --plain" \
    "compile-fail target ${target} is checked on its own"
done

ACCEPTS_FIXTURE="${TMP}/compile-fail-accepts"
make_fixture "${ACCEPTS_FIXTURE}" pass
if CORELIB_REPORT_DIR="${ACCEPTS_FIXTURE}/report" PATH="${ACCEPTS_FIXTURE}/bin:${PATH}" BESKID_TEST_COMPILE_FAIL_ACCEPTS=1 \
  bash "${ACCEPTS_FIXTURE}/scripts/ci/corelib-gate.sh" >"${ACCEPTS_FIXTURE}/stdout" 2>"${ACCEPTS_FIXTURE}/stderr"; then
  fail "a compile-fail fixture that compiles must fail the Corelib gate"
fi
assert_contains "$(cat "${ACCEPTS_FIXTURE}/report/corelib-build-report.md")" \
  "| check network compile-fail fixtures | FAIL" "an accepted compile-fail fixture fails its reported stage"

NO_CORPUS_FIXTURE="${TMP}/no-corpus"
make_fixture "${NO_CORPUS_FIXTURE}" pass
rm -rf "${NO_CORPUS_FIXTURE}/beskid_bsol"
if CORELIB_REPORT_DIR="${NO_CORPUS_FIXTURE}/report" PATH="${NO_CORPUS_FIXTURE}/bin:${PATH}" \
  bash "${NO_CORPUS_FIXTURE}/scripts/ci/corelib-gate.sh" >"${NO_CORPUS_FIXTURE}/stdout" 2>"${NO_CORPUS_FIXTURE}/stderr"; then
  fail "a missing BSOL corpus must fail the Corelib gate"
fi
assert_contains "$(cat "${NO_CORPUS_FIXTURE}/report/corelib-build-report.md")" \
  "| provision release-case inputs | FAIL" "missing release-case inputs fail their reported stage"

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
