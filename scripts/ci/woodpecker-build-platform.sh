#!/usr/bin/env bash
# Build and verify one stable native release target for a Woodpecker worker.
# Usage: woodpecker-build-platform.sh <linux|macos|windows> <version> <absolute-output-dir>
set -euo pipefail

platform="${1:?platform (linux | macos | windows)}"
requested_version="${2:?stable release version}"
output_dir="${3:?absolute durable output directory}"

root="$(cd "$(dirname "$0")/../.." && pwd)"
if [[ -n "${CI_PIPELINE_NUMBER:-}" || -n "${CI_COMMIT_SHA:-}" ]]; then
  for override in WOODPECKER_RELEASE_VERSION_VALIDATOR WOODPECKER_INIT_SUBMODULES_SCRIPT WOODPECKER_RELEASE_PLATFORM_SCRIPT WOODPECKER_FEATURE_EVIDENCE_SCRIPT WOODPECKER_CLI_SURFACE_GATE_SCRIPT WOODPECKER_CLI_SURFACE_CORELIB_VERIFIER WOODPECKER_VSWHERE WOODPECKER_RELEASE_CASES_SCRIPT WOODPECKER_RELEASE_CASES_MANIFEST WOODPECKER_RELEASE_HARNESS_BUILDER; do
    if printenv "${override}" >/dev/null; then
      echo "${override} is test-only and forbidden in a pipeline" >&2
      exit 2
    fi
  done
  [[ "${CI_COMMIT_SHA:-}" == "$(git -C "${root}" rev-parse HEAD)" ]] || { echo 'pipeline source does not match checkout' >&2; exit 2; }
  git -C "${root}" diff --quiet
  git -C "${root}" diff --cached --quiet
fi
version_validator="${WOODPECKER_RELEASE_VERSION_VALIDATOR:-${root}/scripts/ci/release-version.mjs}"
init_submodules="${WOODPECKER_INIT_SUBMODULES_SCRIPT:-${root}/scripts/ci/init-submodules.sh}"
platform_builder="${WOODPECKER_RELEASE_PLATFORM_SCRIPT:-${root}/scripts/ci/build-release-platform.sh}"
feature_evidence_runner="${WOODPECKER_FEATURE_EVIDENCE_SCRIPT:-${root}/scripts/ci/woodpecker-feature-evidence.mjs}"
cli_surface_gate="${WOODPECKER_CLI_SURFACE_GATE_SCRIPT:-${root}/compiler/scripts/ci/cli_surface_gate.py}"
corelib_verifier="${WOODPECKER_CLI_SURFACE_CORELIB_VERIFIER:-${root}/scripts/ci/verify-release-corelib-bundle.mjs}"
# 0.6 schema-2 producer and harness builder; the manifest override exists for the CI test shell only.
release_cases_runner="${WOODPECKER_RELEASE_CASES_SCRIPT:-${root}/scripts/ci/woodpecker-release-cases-v06.mjs}"
release_cases_manifest="${WOODPECKER_RELEASE_CASES_MANIFEST:-}"
release_harness_builder="${WOODPECKER_RELEASE_HARNESS_BUILDER:-${root}/scripts/ci/build-release-artifact.sh}"

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
# Diagnostic logs live beside the durable packet, never inside it: every file of the packet is
# checksummed and the schema-2 reader rejects undeclared entries.
logs_dir="${output_dir}-logs"
mkdir -p "${logs_dir}"
case "${version}" in 0.6.*) schema2=1 ;; *) schema2=0 ;; esac

bash "${init_submodules}" compiler beskid_bsol
if [[ -n "${CI_PIPELINE_NUMBER:-}" || -n "${CI_COMMIT_SHA:-}" ]]; then
  for dependency in compiler beskid_bsol; do
    [[ "$(git -C "${root}" rev-parse "HEAD:${dependency}")" == "$(git -C "${root}/${dependency}" rev-parse HEAD)" ]] || { echo "${dependency} differs from pinned source" >&2; exit 2; }
    git -C "${root}/${dependency}" diff --quiet
    git -C "${root}/${dependency}" diff --cached --quiet
  done
fi
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

bundle_extension=""
[[ "${platform}" == windows ]] && bundle_extension=.exe
cli_version="$("${cli_path}" --version)"
lsp_version="$("${lsp_path}" --version)"
[[ "${cli_version}" == "beskid ${version}" ]]
[[ "${lsp_version}" == "beskid_lsp ${version}" ]]
printf 'cli=%s\nlsp=%s\n' "${cli_version}" "${lsp_version}" \
  >"${logs_dir}/artifact-version-smoke.log"

bundle_root="beskid-${version}-${target}"
tar -tzf "${bundle_path}" >"${logs_dir}/bundle-contents.log"
for required in \
  "${bundle_root}/bin/beskid${bundle_extension}" \
  "${bundle_root}/bin/beskid_lsp${bundle_extension}" \
  "${bundle_root}/bin/beskid-up${bundle_extension}" \
  "${bundle_root}/lib/beskid-runtime/abi-5/${target}/release/abi.json" \
  "${bundle_root}/beskid_corelib/CoreLib.bws" \
  "${bundle_root}/beskid_corelib/.beskid-bundle.sha256" \
  "${bundle_root}/beskid_corelib/beskid_corelib/corelib.bproj" \
  "${bundle_root}/beskid_corelib/packages/" \
  "${bundle_root}/release-version.txt"; do
  grep -Fxq "${required}" "${logs_dir}/bundle-contents.log" || {
    echo "bundle is missing ${required}" >&2
    exit 1
  }
done
# Bundle assembly prunes the Corelib Mod prebuild caches; a bundle that still carries one fails here.
node "${root}/scripts/ci/lib/bundle-caches.mjs" check "${bundle_root}" <"${logs_dir}/bundle-contents.log"
[[ "$(tar -xOzf "${bundle_path}" "${bundle_root}/release-version.txt")" == "${version}" ]] || {
  echo 'bundle release-version.txt does not match the requested version' >&2
  exit 1
}

superrepo_sha="$(git -C "${root}" rev-parse HEAD)"
compiler_sha="$(git -C "${root}/compiler" rev-parse HEAD 2>/dev/null || printf unavailable)"
bundle_stage="${output_dir}/feature-bundle"
mkdir -p "${bundle_stage}"
tar -xzf "${bundle_path}" -C "${bundle_stage}"
bundle_root="${bundle_stage}/beskid-${version}-${target}"
if [[ "${platform}" == linux || "${schema2}" == 1 ]]; then
  # Schema 2 pins the installed CLI to the versioned asset on every target; 0.5 kept the Linux-only check.
  [[ -f "${bundle_root}/bin/beskid${bundle_extension}" && ! -L "${bundle_root}/bin/beskid${bundle_extension}" ]] &&
    cmp -s -- "${cli_path}" "${bundle_root}/bin/beskid${bundle_extension}" || {
    echo 'bundle CLI differs from versioned CLI asset' >&2
    exit 1
  }
fi
runtime_kit="${bundle_root}/lib/beskid-runtime/abi-5/${target}/release"
if [[ "${schema2}" == 1 ]]; then
  runtime_kit_sha="$(node "${root}/scripts/ci/woodpecker-runtime-kit-digest.mjs" "${runtime_kit}" --receipt "${output_dir}/runtime-kit.json")"
  runtime_abi_sha="$(node -e 'const fs=require("fs"),crypto=require("crypto");process.stdout.write(crypto.createHash("sha256").update(fs.readFileSync(process.argv[1])).digest("hex"))' "${runtime_kit}/abi.json")"
  installed_cli="${bundle_root}/bin/beskid${bundle_extension}"
else
  runtime_kit_sha="$(node "${root}/scripts/ci/woodpecker-runtime-kit-digest.mjs" "${runtime_kit}")"
  runtime_abi_sha=""
  installed_cli=""
fi
corelib_fingerprint="$(tr -d '\r\n' <"${bundle_root}/beskid_corelib/.beskid-bundle.sha256")"
[[ "${corelib_fingerprint}" =~ ^[a-f0-9]{64}$ ]] || { echo 'invalid release Corelib fingerprint' >&2; exit 1; }
jq -n \
  --arg platform "${platform}" \
  --arg target "${target}" \
  --arg version "${version}" \
  --arg output_path "${output_dir}" \
  --arg superrepo_sha "${superrepo_sha}" \
  --arg compiler_sha "${compiler_sha}" \
  --arg runtime_kit_sha "${runtime_kit_sha}" \
  --arg runtime_abi_sha "${runtime_abi_sha}" \
  --arg installed_cli "${installed_cli}" \
  --argjson schema2 "${schema2}" '
  {
    schema_version: 1,
    platform: $platform,
    target: $target,
    version: $version,
    channel: "stable",
    output_path: $output_path,
    source: {superrepo_commit: $superrepo_sha, compiler_commit: $compiler_sha},
    runtime_kit_sha256: $runtime_kit_sha,
    platform_result_status: "success",
    published: false
  } | if $schema2 == 1 then . + {runtime_abi_sha256: $runtime_abi_sha, installed_cli: $installed_cli} else . end
' >"${output_dir}/woodpecker-build-result.json"

if [[ "${schema2}" == 1 ]]; then
  # 0.6: build the reviewed harness executables from this commit, then run every frozen case against
  # the extracted bundle. The v1 producer and its exemption never run for a 0.6 candidate.
  harness_dir="${logs_dir}/release-harness"
  rm -rf "${harness_dir}"
  mkdir -p "${harness_dir}"
  (cd "${logs_dir}" && bash "${release_harness_builder}" beskid_release_harness ignored "${target}" "${harness_dir}" "${version}") \
    >"${logs_dir}/release-harness-build.log" 2>&1 || {
    tail -n 40 "${logs_dir}/release-harness-build.log" >&2
    echo 'release harness build failed' >&2
    exit 1
  }
  # Glue cases build a Rust owner with explicit tools (glue_owned.rs require_tools). Pin the
  # toolchain's own cargo and rustc, not rustup proxies: each case runs with a private HOME, and
  # the harness canonicalizes the paths it receives.
  if [[ -z "${BESKID_V06_GLUE_CARGO:-}" || -z "${BESKID_V06_GLUE_RUSTC:-}" || -z "${BESKID_V06_GLUE_LINKER:-}" ]]; then
    rust_sysroot="$(rustc --print sysroot | tr -d '\r')"
    glue_extension=""
    case "${platform}" in
      windows)
        glue_extension=.exe
        rust_sysroot="$(cygpath -m "${rust_sysroot}")"
        if [[ -n "${VCToolsInstallDir:-}" ]]; then
          glue_linker="$(cygpath -m "${VCToolsInstallDir}")/bin/Hostx64/x64/link.exe"
        else
          glue_linker="$(cygpath -m "$(command -v link.exe)")"
        fi
        ;;
      *) glue_linker="$(command -v cc)" ;;
    esac
    export BESKID_V06_GLUE_CARGO="${BESKID_V06_GLUE_CARGO:-${rust_sysroot}/bin/cargo${glue_extension}}"
    export BESKID_V06_GLUE_RUSTC="${BESKID_V06_GLUE_RUSTC:-${rust_sysroot}/bin/rustc${glue_extension}}"
    export BESKID_V06_GLUE_LINKER="${BESKID_V06_GLUE_LINKER:-${glue_linker}}"
  fi
  for glue_tool in BESKID_V06_GLUE_CARGO BESKID_V06_GLUE_RUSTC BESKID_V06_GLUE_LINKER; do
    [[ -f "${!glue_tool}" ]] || { echo "${glue_tool} does not name a file: ${!glue_tool}" >&2; exit 2; }
  done
  printf 'glue tools: cargo=%s rustc=%s linker=%s\n' "${BESKID_V06_GLUE_CARGO}" "${BESKID_V06_GLUE_RUSTC}" "${BESKID_V06_GLUE_LINKER}"
  case_arguments=("${platform}" "${version}" "${output_dir}" "${bundle_root}" --harness-dir "${harness_dir}")
  [[ -z "${release_cases_manifest}" ]] || case_arguments+=(--manifest "${release_cases_manifest}")
  node "${release_cases_runner}" "${case_arguments[@]}"
else
  node "${feature_evidence_runner}" \
    "${platform}" "${version}" "${output_dir}" "${bundle_root}"
fi
if [[ "${platform}" == linux ]]; then
  command -v python3 >/dev/null 2>&1 || { echo 'Linux CLI surface gate requires Python 3' >&2; exit 2; }
  [[ -f "${cli_surface_gate}" ]] || { echo "missing reviewed CLI surface gate: ${cli_surface_gate}" >&2; exit 1; }
  node "${corelib_verifier}" --verify "${root}/compiler/corelib" "${bundle_root}/beskid_corelib" \
    >"${logs_dir}/cli-surface-corelib-verify.log" 2>&1 || {
    tail -n 60 "${logs_dir}/cli-surface-corelib-verify.log" >&2
    echo 'bundled Corelib verification for the CLI surface gate failed' >&2
    exit 1
  }
  cli_sha="$(node -e 'const fs=require("fs"),crypto=require("crypto");process.stdout.write(crypto.createHash("sha256").update(fs.readFileSync(process.argv[1])).digest("hex"))' "${cli_path}")"
  BESKID_RUNTIME_PREFIX="${bundle_root}" python3 "${cli_surface_gate}" "${cli_path}" \
    --expected-sha256 "${cli_sha}" \
    --corelib-root "${bundle_root}/beskid_corelib" \
    --expected-corelib-fingerprint "${corelib_fingerprint}" \
    --json "${output_dir}/cli-surface-evidence-v1.json" \
    >"${logs_dir}/cli-surface-gate.log" 2>&1 || {
    tail -n 80 "${logs_dir}/cli-surface-gate.log" >&2
    echo 'Linux CLI surface gate failed' >&2
    exit 1
  }
  node "${root}/scripts/ci/woodpecker-cli-surface-evidence.mjs" create \
    "${output_dir}/cli-surface-evidence-v1.json" "${cli_path}" \
    "${output_dir}/cli-surface-receipt-v1.json" "${version}" \
    "${superrepo_sha}" "${compiler_sha}" "${runtime_kit_sha}" "${corelib_fingerprint}"
  jq --arg corelib "${corelib_fingerprint}" '.corelib_fingerprint = $corelib' \
    "${output_dir}/woodpecker-build-result.json" >"${output_dir}/woodpecker-build-result.json.tmp"
  mv "${output_dir}/woodpecker-build-result.json.tmp" "${output_dir}/woodpecker-build-result.json"
fi
rm -rf -- "${bundle_stage}"
# build-release-platform.sh writes its component logs into the packet root; keep them beside the packet.
if [[ -d "${output_dir}/release-logs" ]]; then
  rm -rf "${logs_dir}/release-logs"
  mv "${output_dir}/release-logs" "${logs_dir}/release-logs"
fi

checksum_files=()
if [[ "${schema2}" == 1 ]]; then
  # Schema 2: the packet is closed; every regular file is checksummed and nothing else may exist.
  while IFS= read -r name; do checksum_files+=("${name}"); done < <(
    cd "${output_dir}" && find . -mindepth 1 -maxdepth 1 -type f ! -name SHA256SUMS -exec basename {} \; | LC_ALL=C sort)
  if find "${output_dir}" -mindepth 1 -maxdepth 1 ! -type f -print -quit | grep -q .; then
    echo 'schema-2 packet directory contains an entry that is not a regular file' >&2
    exit 1
  fi
else
  checksum_files=(
    "${cli_asset}"
    "${lsp_asset}"
    "${bundle_asset}"
    "platform-result-${target}.json"
    woodpecker-build-result.json
    feature-evidence-v1.json
  )
  if [[ "${platform}" == linux ]]; then
    checksum_files+=(cli-surface-evidence-v1.json cli-surface-receipt-v1.json)
  fi
  for case_log in "${output_dir}"/feature-*.json; do
    case_log_name="$(basename "${case_log}")"
    [[ "${case_log_name}" == feature-evidence-v1.json ]] || checksum_files+=("${case_log_name}")
  done
fi
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
