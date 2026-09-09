#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
validator="${root}/scripts/ci/validate-zed-extension-metadata.py"
extension_root="${root}/editors/zed"
scratch="$(mktemp -d)"
trap 'rm -rf -- "${scratch}"' EXIT

python_bin=python3
if ! "${python_bin}" -c 'import tomllib' >/dev/null 2>&1; then
  for candidate in /opt/homebrew/bin/python3 /usr/local/bin/python3; do
    if [[ -x "${candidate}" ]] && "${candidate}" -c 'import tomllib' >/dev/null 2>&1; then
      python_bin="${candidate}"
      break
    fi
  done
fi
"${python_bin}" -c 'import tomllib' >/dev/null 2>&1 || {
  echo 'FAIL: Python 3.11 or newer is required for TOML validation' >&2
  exit 1
}

"${python_bin}" "${validator}" "${extension_root}/extension.toml" "${extension_root}/Cargo.toml"

cp "${extension_root}/extension.toml" "${scratch}/extension.toml"
cp "${extension_root}/Cargo.toml" "${scratch}/Cargo.toml"
sed -i.bak 's/^version = "0.7.0"$/version = "0.7.1"/' "${scratch}/extension.toml"
if "${python_bin}" "${validator}" "${scratch}/extension.toml" "${scratch}/Cargo.toml" >/dev/null 2>&1; then
  echo 'FAIL: metadata validator accepted a mismatched [lib].version' >&2
  exit 1
fi

cp "${extension_root}/extension.toml" "${scratch}/extension.toml"
sed -i.bak 's/^zed_extension_api = "0.7.0"$/zed_extension_api = "^0.7.0"/' "${scratch}/Cargo.toml"
if "${python_bin}" "${validator}" "${scratch}/extension.toml" "${scratch}/Cargo.toml" >/dev/null 2>&1; then
  echo 'FAIL: metadata validator accepted a non-exact SDK dependency' >&2
  exit 1
fi

printf 'Zed extension metadata tests OK\n'
