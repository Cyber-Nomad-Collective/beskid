#!/usr/bin/env bash
# Cross-validates the shipped arm64 macOS compiler artifacts from AppVeyor's
# Intel Sonoma worker. This is deliberately not a native runtime smoke gate.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
target="aarch64-apple-darwin"
host_os="$(uname -s)"
host_arch="$(uname -m)"

if [[ "${host_os}" != "Darwin" || "${host_arch}" != "x86_64" ]]; then
  echo "macOS cross-validation requires the Darwin-x86_64 AppVeyor worker; found ${host_os}-${host_arch}" >&2
  exit 2
fi

cd "${root}/compiler"

# These host-executable tests prove that the canonical source manifest and ABI
# metadata retain the shipped arm64 target before cross-linking release tools.
cargo test -p beskid_manifest --test abi_v5_source_authority
cargo test -p beskid_abi --test abi_v5_contract --test runtime_bootstrap_contract
cargo build -p beskid_cli -p beskid_lsp --release --target "${target}"

echo "validated ${target} from ${host_os}-${host_arch}: cross-validation only; no arm64 runtime execution coverage is claimed"
