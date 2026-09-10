#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
gate="${root}/scripts/ci/appveyor-macos-cross-gate.sh"
entrypoint="${root}/scripts/ci/appveyor-entrypoint.sh"
installer="${root}/scripts/ci/appveyor-install.sh"

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  exit 1
}

[[ -x "${gate}" ]] || fail "macOS cross-validation gate is missing or not executable"

entrypoint_source="$(<"${entrypoint}")"
rg -q 'bash scripts/ci/appveyor-macos-cross-gate\.sh' <<<"${entrypoint_source}" || \
  fail "macOS AppVeyor lane does not use the cross-validation gate"
if rg -n 'native-runtime-kit-macos-matrix' <<<"${entrypoint_source}"; then
  fail "Intel macOS lane still claims native runtime-kit coverage"
fi

installer_source="$(<"${installer}")"
rg -q 'install_brew_formula ripgrep' <<<"${installer_source}" || \
  fail "macOS cross-validation does not provision ripgrep"
if rg -q 'install_brew_formula llvm' <<<"${installer_source}"; then
  fail "cross-only macOS lane still provisions the native LLVM symbol toolchain"
fi

scratch="$(mktemp -d "${TMPDIR:-/tmp}/beskid-macos-cross-gate.XXXXXX")"
trap 'rm -rf "${scratch}"' EXIT
mkdir -p "${scratch}/bin"

cat >"${scratch}/bin/uname" <<'EOF'
#!/usr/bin/env bash
case "${1:-}" in
  -s) printf '%s\n' "${FAKE_UNAME_S:-Darwin}" ;;
  -m) printf '%s\n' "${FAKE_UNAME_M:-x86_64}" ;;
  *) exit 64 ;;
esac
EOF
cat >"${scratch}/bin/cargo" <<'EOF'
#!/usr/bin/env bash
printf 'cargo %s\n' "$*" >>"${CROSS_GATE_LOG:?}"
EOF
chmod +x "${scratch}/bin/uname" "${scratch}/bin/cargo"

log="${scratch}/commands.log"
output="$(PATH="${scratch}/bin:${PATH}" CROSS_GATE_LOG="${log}" "${gate}")"
expected='cargo test -p beskid_manifest --test abi_v5_source_authority
cargo test -p beskid_abi --test abi_v5_contract --test runtime_bootstrap_contract
cargo build -p beskid_cli -p beskid_lsp --release --target aarch64-apple-darwin'
[[ "$(<"${log}")" == "${expected}" ]] || fail "cross gate did not run the exact authority/build commands"
rg -q 'cross-validation only; no arm64 runtime execution coverage is claimed' <<<"${output}" || \
  fail "cross gate does not state its non-native coverage boundary"

set +e
PATH="${scratch}/bin:${PATH}" CROSS_GATE_LOG="${log}" FAKE_UNAME_S=Linux "${gate}" >/dev/null 2>&1
status=$?
set -e
[[ "${status}" -ne 0 ]] || fail "cross gate accepted a non-Darwin worker"

set +e
PATH="${scratch}/bin:${PATH}" CROSS_GATE_LOG="${log}" FAKE_UNAME_M=arm64 "${gate}" >/dev/null 2>&1
status=$?
set -e
[[ "${status}" -ne 0 ]] || fail "cross gate obscured an arm64 worker as an Intel cross-validation lane"

echo "AppVeyor macOS cross-validation contract OK"
