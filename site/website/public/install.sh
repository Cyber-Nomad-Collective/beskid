#!/usr/bin/env bash
set -euo pipefail

BASE_URL="https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/download/cli-latest"
VERSION_URL="${BASE_URL}/cli-version.txt"
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

if ! cli_version="$(curl -fsSL "${VERSION_URL}" | tr -d '[:space:]')"; then
  echo "Failed to download ${VERSION_URL} (rolling release metadata)."
  echo "If this persists, check that the cli-latest release includes cli-version.txt."
  exit 1
fi
if [[ -z "${cli_version}" ]]; then
  echo "cli-version.txt from ${VERSION_URL} was empty."
  exit 1
fi

echo "Installing Beskid CLI ${cli_version} (rolling build)"

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
