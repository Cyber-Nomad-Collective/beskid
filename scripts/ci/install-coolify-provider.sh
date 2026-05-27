#!/usr/bin/env bash
# Pre-install arcusis/coolify for OpenTofu CI (not on registry.opentofu.org).
set -euo pipefail

VERSION="${COOLIFY_PROVIDER_VERSION:-1.1.13}"
OS="${RUNNER_OS:-linux}"
ARCH="${RUNNER_ARCH:-X64}"

_os="$(printf '%s' "${OS}" | tr '[:upper:]' '[:lower:]')"
_arch="$(printf '%s' "${ARCH}" | tr '[:upper:]' '[:lower:]')"
case "${_os}:${_arch}" in
  linux:x64 | linux:amd64) platform="linux_amd64" ;;
  linux:arm64 | linux:aarch64) platform="linux_arm64" ;;
  macos:x64 | macos:amd64) platform="darwin_amd64" ;;
  macos:arm64 | macos:aarch64) platform="darwin_arm64" ;;
  *)
    echo "Unsupported platform: ${OS}/${ARCH}" >&2
    exit 1
    ;;
esac

plugin_root="${HOME}/.terraform.d/plugins/registry.terraform.io/arcusis/coolify/${VERSION}/${platform}"
mkdir -p "${plugin_root}"

_os_part="${platform%_*}"
_arch_part="${platform#*_}"
download_url="$(
  curl -fsSL "https://registry.terraform.io/v1/providers/arcusis/coolify/${VERSION}/download/${_os_part}/${_arch_part}" \
    | jq -r '.download_url'
)"

tmpdir="$(mktemp -d)"
trap 'rm -rf "${tmpdir}"' EXIT
curl -fsSL "${download_url}" -o "${tmpdir}/provider.zip"
unzip -qo "${tmpdir}/provider.zip" -d "${tmpdir}"
install -m 0755 "${tmpdir}"/terraform-provider-coolify* "${plugin_root}/terraform-provider-coolify_v${VERSION}"

echo "Installed arcusis/coolify ${VERSION} for ${platform} at ${plugin_root}"
