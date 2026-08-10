#!/usr/bin/env bash
# Installs the Beskid CLI raw binary. Platform packages (.deb, .msi, .dmg, Snap, Homebrew)
# are also available — see https://beskid-lang.org/downloads/ for alternatives.
set -euo pipefail

if [[ -n "${BESKID_RELEASE_TAG:-}" ]]; then
  RELEASE_TAG="${BESKID_RELEASE_TAG}"
else
  case "${BESKID_RELEASE_CHANNEL:-stable}" in
    stable) RELEASE_TAG="cli-stable" ;;
    unstable) RELEASE_TAG="cli-unstable" ;;
    *) RELEASE_TAG="cli-stable" ;;
  esac
fi
BASE_URL="https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/download/${RELEASE_TAG}"
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
  echo "Failed to download ${VERSION_URL} (release metadata)."
  echo "If this persists, check that the ${RELEASE_TAG} release includes cli-version.txt."
  exit 1
fi
if [[ -z "${cli_version}" ]]; then
  echo "cli-version.txt from ${VERSION_URL} was empty."
  exit 1
fi

if [[ "${RELEASE_TAG}" == "cli-stable" || "${RELEASE_TAG}" == "cli-unstable" ]]; then
  echo "Installing Beskid CLI ${cli_version} (rolling build from ${RELEASE_TAG})"
else
  echo "Installing Beskid CLI ${cli_version} (pinned release ${RELEASE_TAG})"
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
