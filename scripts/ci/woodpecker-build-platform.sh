#!/usr/bin/env bash
# Build and verify one stable native release target for a Woodpecker worker.
# Usage: woodpecker-build-platform.sh <linux|macos|windows> <version> <absolute-output-dir>
set -euo pipefail

platform="${1:?platform (linux | macos | windows)}"
requested_version="${2:?stable release version}"
output_dir="${3:?absolute durable output directory}"

root="$(cd "$(dirname "$0")/../.." && pwd)"
version_validator="${WOODPECKER_RELEASE_VERSION_VALIDATOR:-${root}/scripts/ci/release-version.mjs}"
init_submodules="${WOODPECKER_INIT_SUBMODULES_SCRIPT:-${root}/scripts/ci/init-submodules.sh}"
platform_builder="${WOODPECKER_RELEASE_PLATFORM_SCRIPT:-${root}/scripts/ci/build-release-platform.sh}"

for command in git jq node tar; do
  command -v "${command}" >/dev/null 2>&1 || {
    echo "required command is unavailable: ${command}" >&2
    exit 2
  }
done
version="$(node "${version_validator}" "${requested_version}" --stable-only)"

case "${platform}" in
  linux)
    target=x86_64-unknown-linux-gnu
    cli_asset=beskid-linux-amd64
    lsp_asset=beskid_lsp-linux-amd64
    ;;
  macos)
    target=aarch64-apple-darwin
    cli_asset=beskid-darwin-arm64
    lsp_asset=beskid_lsp-darwin-arm64
    ;;
  windows)
    target=x86_64-pc-windows-msvc
    cli_asset=beskid-windows-amd64.exe
    lsp_asset=beskid_lsp-windows-amd64.exe
    ;;
  *)
    echo "unsupported Woodpecker release platform: ${platform}" >&2
    exit 2
    ;;
esac

bundle_asset="beskid-${version}-${target}.tar.gz"
case "${output_dir}" in
  /* | [A-Za-z]:/*) ;;
  *) echo "Woodpecker output directory must be absolute: ${output_dir}" >&2; exit 2 ;;
esac

mkdir -p "${output_dir}"
if find "${output_dir}" -mindepth 1 -maxdepth 1 -print -quit | grep -q .; then
  echo "Woodpecker output directory must be empty: ${output_dir}" >&2
  exit 2
fi
output_dir="$(cd "${output_dir}" && pwd -P)"

if [[ "${platform}" == windows && -z "${CARGO_TARGET_X86_64_PC_WINDOWS_MSVC_LINKER:-}" ]]; then
  vswhere="${WOODPECKER_VSWHERE:-}"
  if [[ -z "${vswhere}" ]]; then
    program_files_x86="$(printenv 'ProgramFiles(x86)' 2>/dev/null || true)"
    if [[ -n "${program_files_x86}" ]] && command -v cygpath >/dev/null 2>&1; then
      program_files_x86="$(cygpath -u "${program_files_x86}")"
    fi
    vswhere="${program_files_x86:-/c/Program Files (x86)}/Microsoft Visual Studio/Installer/vswhere.exe"
  fi
  [[ -f "${vswhere}" ]] || {
    echo "vswhere.exe is required to resolve the x64 MSVC linker: ${vswhere}" >&2
    exit 2
  }
  visual_studio="$("${vswhere}" -latest -products '*' \
    -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 \
    -property installationPath | tr -d '\r' | tail -n 1)"
  if [[ "${visual_studio}" == [A-Za-z]:\\* ]] && command -v cygpath >/dev/null 2>&1; then
    visual_studio="$(cygpath -u "${visual_studio}")"
  fi
  tools_version="$(tr -d '\r\n' \
    <"${visual_studio}/VC/Auxiliary/Build/Microsoft.VCToolsVersion.default.txt")"
  linker="${visual_studio}/VC/Tools/MSVC/${tools_version}/bin/Hostx64/x64/link.exe"
  [[ -f "${linker}" ]] || {
    echo "resolved x64 MSVC linker does not exist: ${linker}" >&2
    exit 2
  }
  if command -v cygpath >/dev/null 2>&1; then
    linker="$(cygpath -w "${linker}")"
  fi
  export CARGO_TARGET_X86_64_PC_WINDOWS_MSVC_LINKER="${linker}"
fi

bash "${init_submodules}" compiler beskid_bsol
bash "${platform_builder}" \
  "${target}" "${cli_asset}" "${lsp_asset}" \
  "${version}" stable "${output_dir}" "${bundle_asset}"

platform_result="${output_dir}/platform-result-${target}.json"
jq -e --arg target "${target}" '
  .schema_version == 1 and .target == $target and
  (.builds | keys | sort) == ["bundle", "cli", "lsp"] and
  ([.builds[].status] | all(. == "success")) and
  ((.diagnostics // []) | length) == 0
' "${platform_result}" >/dev/null

cli_path="${output_dir}/${cli_asset}"
lsp_path="${output_dir}/${lsp_asset}"
bundle_path="${output_dir}/${bundle_asset}"
test -x "${cli_path}"
test -x "${lsp_path}"
test -f "${bundle_path}"

cli_version="$(${cli_path} --version)"
lsp_version="$(${lsp_path} --version)"
[[ "${cli_version}" == "beskid ${version}" ]]
[[ "${lsp_version}" == "beskid_lsp ${version}" ]]
printf 'cli=%s\nlsp=%s\n' "${cli_version}" "${lsp_version}" \
  >"${output_dir}/artifact-version-smoke.log"

bundle_root="beskid-${version}-${target}"
tar -tzf "${bundle_path}" >"${output_dir}/bundle-contents.log"
for required in \
  "${bundle_root}/beskid_cli" \
  "${bundle_root}/beskid_lsp" \
  "${bundle_root}/beskid-up" \
  "${bundle_root}/native-runtime-kit/beskid-runtime/abi-5/${target}/release/abi.json"; do
  grep -Fxq "${required}" "${output_dir}/bundle-contents.log" || {
    echo "bundle is missing ${required}" >&2
    exit 1
  }
done

superrepo_sha="$(git -C "${root}" rev-parse HEAD)"
compiler_sha="$(git -C "${root}/compiler" rev-parse HEAD 2>/dev/null || printf unavailable)"
jq -n \
  --arg platform "${platform}" \
  --arg target "${target}" \
  --arg version "${version}" \
  --arg output_path "${output_dir}" \
  --arg superrepo_sha "${superrepo_sha}" \
  --arg compiler_sha "${compiler_sha}" '
  {
    schema_version: 1,
    platform: $platform,
    target: $target,
    version: $version,
    channel: "stable",
    output_path: $output_path,
    source: {superrepo_commit: $superrepo_sha, compiler_commit: $compiler_sha},
    platform_result_status: "success",
    published: false
  }
' >"${output_dir}/woodpecker-build-result.json"

checksum_files=(
  "${cli_asset}"
  "${lsp_asset}"
  "${bundle_asset}"
  "platform-result-${target}.json"
  woodpecker-build-result.json
)
(
  cd "${output_dir}"
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "${checksum_files[@]}"
  else
    shasum -a 256 "${checksum_files[@]}"
  fi
) >"${output_dir}/SHA256SUMS"

printf 'WOODPECKER_OUTPUT_PATH=%s\n' "${output_dir}"
printf 'Woodpecker %s stable build verified: %s (%s)\n' "${platform}" "${version}" "${target}"
