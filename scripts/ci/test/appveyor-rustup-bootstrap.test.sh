#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
posix_helper="${root}/scripts/ci/lib/appveyor-rust-toolchain.sh"
windows_helper="${root}/scripts/ci/lib/AppVeyorRustToolchain.ps1"
posix_entrypoint="${root}/scripts/ci/appveyor-install.sh"
windows_entrypoint="${root}/scripts/ci/appveyor-entrypoint.ps1"

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  exit 1
}

[[ -f "${posix_helper}" ]] || fail "shared POSIX Rust toolchain helper is missing"
[[ -f "${windows_helper}" ]] || fail "shared Windows Rust toolchain helper is missing"

fixture="$(mktemp -d "${TMPDIR:-/tmp}/appveyor-rustup-bootstrap.XXXXXX")"
trap 'rm -rf "${fixture}"' EXIT
mkdir -p "${fixture}/bin" "${fixture}/home" "${fixture}/cargo"

cat >"${fixture}/bin/curl" <<'SH'
#!/usr/bin/env bash
printf 'curl %s\n' "$*" >>"${RUSTUP_TEST_LOG}"
cat "${RUSTUP_TEST_INSTALLER}"
SH
cat >"${fixture}/rustup-template" <<'SH'
#!/usr/bin/env bash
printf 'rustup %s\n' "$*" >>"${RUSTUP_TEST_LOG}"
SH
cat >"${fixture}/installer" <<'SH'
printf 'installer %s\n' "$*" >>"${RUSTUP_TEST_LOG}"
mkdir -p "${CARGO_HOME}/bin"
cp "${RUSTUP_TEST_RUSTUP_TEMPLATE}" "${CARGO_HOME}/bin/rustup"
chmod +x "${CARGO_HOME}/bin/rustup"
printf 'export PATH="%s/bin:$PATH"\n' "${CARGO_HOME}" >"${CARGO_HOME}/env"
SH
chmod +x "${fixture}/bin/curl"
: >"${fixture}/commands.log"

PATH="${fixture}/bin:/usr/bin:/bin" \
HOME="${fixture}/home" \
CARGO_HOME="${fixture}/cargo" \
RUSTUP_TEST_LOG="${fixture}/commands.log" \
RUSTUP_TEST_INSTALLER="${fixture}/installer" \
RUSTUP_TEST_RUSTUP_TEMPLATE="${fixture}/rustup-template" \
POSIX_HELPER_UNDER_TEST="${posix_helper}" \
bash -c '
  source "${POSIX_HELPER_UNDER_TEST}"
  activate_appveyor_rust_toolchain
  activate_appveyor_rust_toolchain
'

[[ "$(rg -c '^curl ' "${fixture}/commands.log")" -eq 1 ]] || \
  fail "POSIX bootstrap must download rustup exactly once when reused"
[[ "$(rg -c '^installer -y --profile minimal --default-toolchain none$' "${fixture}/commands.log")" -eq 1 ]] || \
  fail "POSIX bootstrap must use the unattended minimal rustup contract"
[[ "$(rg -c '^rustup toolchain install stable --profile minimal$' "${fixture}/commands.log")" -eq 2 ]] || \
  fail "POSIX activation must idempotently select the stable minimal toolchain"
[[ "$(rg -c '^rustup default stable$' "${fixture}/commands.log")" -eq 2 ]] || \
  fail "POSIX activation must select stable as the default"
[[ "$(rg -c '^rustup component add clippy$' "${fixture}/commands.log")" -eq 2 ]] || \
  fail "POSIX activation must install Clippy"

rg -q 'source .*appveyor-rust-toolchain\.sh' "${posix_entrypoint}" || \
  fail "POSIX AppVeyor installer does not source the shared Rust helper"
[[ "$(rg -c '^[[:space:]]*activate_appveyor_rust_toolchain$' "${posix_entrypoint}")" -eq 5 ]] || \
  fail "POSIX lanes must reuse one Rust activation function"

windows_content="$(<"${windows_helper}")"
rg -q 'Get-Command rustup' <<<"${windows_content}" || fail "Windows bootstrap is not idempotent"
rg -q 'https://win\.rustup\.rs/x86_64' <<<"${windows_content}" || fail "Windows bootstrap does not use rustup-init"
rg -q -- "'--profile', 'minimal', '--default-toolchain', 'none'" <<<"${windows_content}" || \
  fail "Windows bootstrap must use the unattended minimal rustup contract"
rg -q "'toolchain', 'install', 'stable', '--profile', 'minimal'" <<<"${windows_content}" || \
  fail "Windows activation must configure stable/minimal"
rg -q '\. .*AppVeyorRustToolchain\.ps1' "${windows_entrypoint}" || \
  fail "Windows AppVeyor entrypoint does not source the shared Rust helper"
rg -q '^Enable-AppVeyorRustToolchain$' "${windows_entrypoint}" || \
  fail "Windows AppVeyor entrypoint does not activate the shared Rust helper"
rg -q "^Invoke-AppVeyorNativeCommand -Command bash -Arguments @\('./scripts/ci/init-compiler-submodule\.sh'\)$" "${windows_entrypoint}" || \
  fail "Windows compiler initialization does not use the exit-code native boundary"
rg -q "ErrorActionPreference = 'Continue'" <<<"${windows_content}" || \
  fail "Windows native boundary does not tolerate informational stderr"
rg -q 'if \(\$exitCode -ne 0\)' <<<"${windows_content}" || \
  fail "Windows native boundary does not fail on the process exit code"

cp "${fixture}/rustup-template" "${fixture}/bin/rustup"
chmod +x "${fixture}/bin/rustup"
PATH="${fixture}/bin:${PATH}" \
RUSTUP_TEST_LOG="${fixture}/windows-commands.log" \
WINDOWS_HELPER_UNDER_TEST="${windows_helper}" pwsh -NoProfile -Command '
  $tokens = $null
  $errors = $null
  [System.Management.Automation.Language.Parser]::ParseFile(
    $env:WINDOWS_HELPER_UNDER_TEST,
    [ref]$tokens,
    [ref]$errors
  ) | Out-Null
  if ($errors.Count -ne 0) { throw ($errors | Out-String) }
  . $env:WINDOWS_HELPER_UNDER_TEST
  Invoke-AppVeyorNativeCommand -Command /bin/bash -Arguments @("-c", "printf native-progress >&2; exit 0")
  try {
    Invoke-AppVeyorNativeCommand -Command /bin/bash -Arguments @("-c", "exit 17")
    throw "nonzero native command unexpectedly passed"
  }
  catch {
    if ($_ -notmatch "exit code 17") { throw }
  }
  Enable-AppVeyorRustToolchain
'
[[ "$(rg -c '^rustup ' "${fixture}/windows-commands.log")" -eq 3 ]] || \
  fail "Windows activation did not configure stable/minimal and the MSVC target"

echo "AppVeyor Rustup bootstrap contract OK"
