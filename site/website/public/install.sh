#!/usr/bin/env bash
set -euo pipefail

BASE_URL="https://cdn.beskid-lang.org/releases/latest"
INSTALL_DIR="${HOME}/.beskid/bin"

os_name="$(uname -s)"
arch_name="$(uname -m)"

case "${os_name}" in
  Linux) os="linux" ;;
  Darwin) os="darwin" ;;
  *)
    echo "Unsupported OS: ${os_name}"
    exit 1
    ;;
 esac

case "${arch_name}" in
  x86_64) arch="amd64" ;;
  arm64|aarch64) arch="arm64" ;;
  *)
    echo "Unsupported architecture: ${arch_name}"
    exit 1
    ;;
 esac

if [[ "${os}" == "darwin" && "${arch}" != "arm64" ]]; then
  echo "Only Apple Silicon (arm64) builds are currently published for macOS."
  exit 1
fi

binary_name="beskid-${os}-${arch}"
url="${BASE_URL}/${binary_name}"

mkdir -p "${INSTALL_DIR}"

echo "Downloading ${url}"
curl -fsSL "${url}" -o "${INSTALL_DIR}/beskid"
chmod +x "${INSTALL_DIR}/beskid"

echo "Installed to ${INSTALL_DIR}/beskid"

case ":${PATH}:" in
  *":${INSTALL_DIR}:"*)
    ;;
  *)
    echo "Add this to your shell profile:"
    echo "  export PATH=\"${INSTALL_DIR}:\$PATH\""
    ;;
 esac
