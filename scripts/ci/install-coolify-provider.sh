#!/usr/bin/env bash
# Pre-install arcusis/coolify for OpenTofu CI (not on registry.opentofu.org).
# Builds from upstream with beskid_infra/provider-patches/destination_uuid.patch
# so POST /services and /applications include destination_uuid (multi-destination servers).
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

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
patch_file="${repo_root}/beskid_infra/provider-patches/destination_uuid.patch"
if [[ ! -f "${patch_file}" ]]; then
  echo "Missing provider patch: ${patch_file}" >&2
  exit 1
fi

tmpdir="$(mktemp -d)"
trap 'rm -rf "${tmpdir}"' EXIT

git clone --depth 1 --branch "v${VERSION}" https://github.com/arcusis/terraform-provider-coolify.git "${tmpdir}/src" 2>/dev/null \
  || git clone --depth 1 https://github.com/arcusis/terraform-provider-coolify.git "${tmpdir}/src"

cd "${tmpdir}/src"
git checkout "v${VERSION}" 2>/dev/null || true
patch -p1 --forward < "${patch_file}"

export CGO_ENABLED=0
go build -o "${tmpdir}/terraform-provider-coolify" .

install -m 0755 "${tmpdir}/terraform-provider-coolify" "${plugin_root}/terraform-provider-coolify_v${VERSION}"

echo "Installed patched arcusis/coolify ${VERSION} (${platform}) at ${plugin_root}"
