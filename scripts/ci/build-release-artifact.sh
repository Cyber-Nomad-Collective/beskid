#!/usr/bin/env bash
# Build a compiler release artifact or a complete direct-install bundle for the
# host runner's native target.
#
# Builds natively on the matching OS runner. Cross-platform coverage comes
# from the calling workflow's OS matrix (linux on ubuntu, mac on macos, windows
# on windows) — each target builds on its native host, which avoids the
# fragile Linux→macOS/Windows cross-linker setup behind QEMU/binfmt.
#
# Checks that the CLI, LSP, and updater crates already carry the resolved
# release version, builds the requested package(s) in release mode against the
# checked-in Cargo.lock, and copies the binary or archive to <asset-name> in the
# caller's cwd.
#
# Usage: build-release-artifact.sh <package> <binary> <target> <asset-name> <release-version>
#   package         beskid_cli | beskid_lsp | beskid_bundle | beskid_release_harness
#   binary          beskid_cli | beskid_lsp | ignored for beskid_bundle and beskid_release_harness
#   target          x86_64-unknown-linux-gnu | aarch64-apple-darwin | x86_64-apple-darwin | x86_64-pc-windows-msvc
#   asset-name      output file name (e.g. beskid-linux-amd64); for beskid_release_harness an absolute
#                   output directory that receives the 0.6 release harness and fixture executables
#   release-version resolved semantic version
set -euo pipefail

PACKAGE="${1:?package (beskid_cli | beskid_lsp | beskid_bundle | beskid_release_harness)}"
BINARY="${2:?binary name}"
TARGET="${3:?rust target triple}"
ASSET_NAME="${4:?asset-name}"
RELEASE_VERSION="${5:?release-version}"

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

case "$TARGET" in
  x86_64-unknown-linux-gnu)  runner_os="Linux" ;;
  aarch64-apple-darwin|x86_64-apple-darwin) runner_os="macOS" ;;
  x86_64-pc-windows-msvc)    runner_os="Windows" ;;
  *) echo "unsupported release target: $TARGET" >&2; exit 1 ;;
esac

binary_extension=""
[[ "$runner_os" == "Windows" ]] && binary_extension=".exe"

export RUST_MIN_STACK="${RUST_MIN_STACK:-67108864}"

cd "${ROOT}/compiler"

# The release version is source: beskid_cli, beskid_lsp and beskid_up carry it
# in their manifests and in Cargo.lock. Every Cargo build below is --locked, so
# the build never edits the authoring tree; a version that differs from the
# checked-in one is a source change to commit, not a build-time stamp.
release_stage=""
cleanup_release_stage() {
  [[ -z "${release_stage}" ]] || rm -rf "${release_stage}"
}
trap cleanup_release_stage EXIT

for cargo_toml in crates/beskid_cli/Cargo.toml crates/beskid_lsp/Cargo.toml crates/beskid_up/Cargo.toml; do
  manifest_version="$(awk '
    /^\[/ { in_package = ($0 == "[package]"); next }
    in_package && /^version[[:space:]]*=/ {
      value = $0
      sub(/^[^=]*=[[:space:]]*"/, "", value)
      sub(/".*$/, "", value)
      print value
      exit
    }
  ' "${cargo_toml}" | tr -d '\r')"
  if [[ "${manifest_version}" != "${RELEASE_VERSION}" ]]; then
    echo "release version ${RELEASE_VERSION} does not match compiler/${cargo_toml} version '${manifest_version}'; commit the version bump and Cargo.lock to the compiler before building this release" >&2
    exit 1
  fi
done

# Every package builds with the qualified native tool driver receipt, so the
# versioned CLI and LSP assets are byte-identical to the bundle binaries and the
# release harnesses link the same beskid_abi. The qualifier reads Cargo profiles
# with tomllib.
python3 -c 'import sys, tomllib' 2>/dev/null || {
  echo "build-release-artifact.sh ${PACKAGE} requires python3 3.11 or newer on PATH" >&2
  exit 1
}

# Build and qualify the owned native tool driver, then export its receipt. The
# receipt lives at one path per target and is rewritten only when its bytes
# change: beskid_abi's build script reruns when the receipt path or file
# changes, and a rerun between the CLI, LSP and bundle builds would relink them.
qualify_native_tool_driver() {
  local stage receipt
  stage="$(mktemp -d)"
  receipt="${ROOT}/compiler/target/${TARGET}/native-tool-driver-receipt.json"
  python3 "${ROOT}/scripts/ci/qualify-native-tool-driver.py" --snapshot --output "${stage}/source.json"
  cargo build --locked -p beskid_execution --bin beskid_native_tool_driver --release --target "$TARGET" --message-format=json >"${stage}/cargo.json"
  python3 "${ROOT}/scripts/ci/qualify-native-tool-driver.py" --messages "${stage}/cargo.json" --target "$TARGET" --profile release --source-snapshot "${stage}/source.json" --output "${stage}/driver.json"
  mkdir -p "$(dirname "${receipt}")"
  cmp -s "${stage}/driver.json" "${receipt}" || cp -f "${stage}/driver.json" "${receipt}"
  rm -rf "${stage}"
  export BESKID_COMPILER_DRIVER_BUILD_RECEIPT="${receipt}"
}

# Add the Rust target and build natively on the host.
rustup target add "$TARGET" >/dev/null 2>&1 || true
case "$PACKAGE" in
  beskid_cli|beskid_lsp|beskid_bundle)
    # One build for all three binaries: the CLI, LSP and bundle runs of this
    # script then share every artifact instead of resolving features per package.
    qualify_native_tool_driver
    cargo build --locked -p beskid_cli -p beskid_lsp -p beskid_up --release --target "$TARGET"
    ;;
  beskid_release_harness)
    # 0.6 release case harnesses: libtest executables of the reviewed harness crates and the process
    # fixture binary, built from this commit with the same qualified driver receipt the bundle used so
    # the Glue harness admits the shipped driver. They are retained as flat packet files, never published.
    case "$ASSET_NAME" in
      /* | [A-Za-z]:/*) ;;
      *) echo "beskid_release_harness output must be an absolute directory: $ASSET_NAME" >&2; exit 1 ;;
    esac
    qualify_native_tool_driver
    driver_stage="$(mktemp -d)"
    cargo test --no-run --locked --release --target "$TARGET" -p beskid_tests_release -p beskid_tests_interop --message-format=json >"${driver_stage}/harness.json"
    cargo build --locked --release --target "$TARGET" -p beskid_tests_interop --bin beskid_release_fixture --message-format=json >"${driver_stage}/fixture.json"
    node "${ROOT}/scripts/ci/release-harness-executables.mjs" "$TARGET" "$ASSET_NAME" \
      "${ROOT}/scripts/ci/release-cases-v06.json" "${driver_stage}/harness.json" "${driver_stage}/fixture.json"
    rm -rf "${driver_stage}"
    echo "built release harness executables in ${ASSET_NAME} (Beskid ${RELEASE_VERSION} for ${TARGET})"
    exit 0
    ;;
  *)
    echo "unsupported release package: $PACKAGE" >&2
    exit 1
    ;;
esac

if [[ "$PACKAGE" == "beskid_bundle" ]]; then
  runtime_prefix="${ROOT}/compiler/target/native-runtime-kit"
  BESKID_RUNTIME_PREFIX="${runtime_prefix}" \
    BESKID_RUNTIME_KIT_PROFILE=debug \
    BESKID_CLI_BIN="${ROOT}/compiler/target/${TARGET}/release/beskid_cli${binary_extension}" \
    bash ./scripts/stage-native-runtime-kit.sh
  # Ordinary installed `beskid build` and `beskid run` select the debug kit.
  # The release kit is additional; stage-native-runtime-kit.sh clears its
  # destination, so publish this profile with the CLI without clearing debug.
  BESKID_RUNTIME_PREFIX="${runtime_prefix}" \
    "${ROOT}/compiler/target/${TARGET}/release/beskid_cli${binary_extension}" \
    dev runtime-kit build-native-host --prefix "${runtime_prefix}" --profile release

  release_stage="$(mktemp -d)"
  bundle_dir="${release_stage}/beskid-${RELEASE_VERSION}-${TARGET}"
  mkdir -p "${bundle_dir}/bin"
  for binary_mapping in beskid_cli:beskid beskid_lsp:beskid_lsp beskid-up:beskid-up beskid_native_tool_driver:beskid_native_tool_driver; do
    built_name="${binary_mapping%%:*}"
    installed_name="${binary_mapping#*:}"
    built_binary="target/${TARGET}/release/${built_name}${binary_extension}"
    [[ -f "$built_binary" ]] || { echo "Missing built bundle artifact: $built_binary" >&2; exit 1; }
    cp -f "$built_binary" "${bundle_dir}/bin/${installed_name}${binary_extension}"
  done
  chmod 0755 "${bundle_dir}/bin/beskid${binary_extension}" \
    "${bundle_dir}/bin/beskid_lsp${binary_extension}" \
    "${bundle_dir}/bin/beskid-up${binary_extension}" \
    "${bundle_dir}/bin/beskid_native_tool_driver${binary_extension}"
  for profile in debug release; do
    [[ -f "${runtime_prefix}/lib/beskid-runtime/abi-5/${TARGET}/${profile}/abi.json" ]] || {
      echo "Native runtime kit omitted ${TARGET}/${profile}/abi.json" >&2
      exit 1
    }
  done
  cp -a "${runtime_prefix}/lib" "${bundle_dir}/lib"
  # Materialize the CLI's exact embedded Corelib workspace, including its
  # integrity marker. Installed discovery resolves <prefix>/beskid_corelib as
  # the *workspace* root; copying only the aggregate project there creates an
  # unrecognized, unmanaged directory and blocks the first installed command.
  BESKID_CORELIB_ROOT="${bundle_dir}/beskid_corelib" \
    "${bundle_dir}/bin/beskid${binary_extension}" dev corelib --output "${bundle_dir}/beskid_corelib"
  [[ -f "${bundle_dir}/beskid_corelib/.beskid-bundle.sha256" ]] || {
    echo 'Bundled Corelib workspace is missing its integrity marker' >&2
    exit 1
  }
  [[ -f "${bundle_dir}/beskid_corelib/CoreLib.bws" ]] || {
    echo 'Bundled Corelib workspace is missing CoreLib.bws' >&2
    exit 1
  }
  [[ -f "${bundle_dir}/beskid_corelib/beskid_corelib/corelib.bproj" ]] || {
    echo 'Bundled Corelib workspace is missing its aggregate project' >&2
    exit 1
  }
  # Every CoreLib.bws member (packages and compiler mods alike) must ship as a
  # project directory; a member that cannot be resolved breaks every installed
  # dependency on it.
  corelib_members="$(awk '
    /^member "[^"]*"[[:space:]]*\{[[:space:]]*$/ { in_member = 1; next }
    in_member && /^\}[[:space:]]*$/ { in_member = 0; next }
    in_member && /^[[:space:]]*path[[:space:]]*=/ {
      value = $0
      sub(/^[^=]*=[[:space:]]*"/, "", value)
      sub(/"[[:space:]]*$/, "", value)
      print value
    }
  ' "${bundle_dir}/beskid_corelib/CoreLib.bws")"
  [[ -n "${corelib_members}" ]] || {
    echo 'Bundled CoreLib.bws lists no members' >&2
    exit 1
  }
  while IFS= read -r member; do
    if ! compgen -G "${bundle_dir}/beskid_corelib/${member}/*.bproj" >/dev/null; then
      echo "Bundled Corelib workspace is missing member ${member}" >&2
      exit 1
    fi
  done <<<"${corelib_members}"
  # Ship each Corelib compiler Mod prebuilt, as toolchains ship prebuilt macro
  # plugins: the bundled CLI builds the Mod's executable descriptor into
  # <corelib>/<member>/.beskid/obj/mods/<package>/<key>/<target>/. The artifact is
  # keyed by target, runtime-kit profile and the exact bundled CLI digest, so it
  # is current only for this bundle; consumers (CLI, LSP) reuse it without a
  # rebuild. `.beskid`, `obj` and Project.lock are outside the Corelib
  # fingerprint, so the bundle seal stays valid. Installed `beskid build` and
  # `beskid run` select the debug kit, so the debug profile is shipped.
  mod_state="$(mktemp -d)"
  while IFS= read -r member; do
    for mod_manifest in "${bundle_dir}/beskid_corelib/${member}"/*.bproj; do
      grep -Eq 'type[[:space:]]*=[[:space:]]*"?Mod"?([^A-Za-z0-9_]|$)' "${mod_manifest}" || continue
      mod_package="$(grep -Eo 'name[[:space:]]*=[[:space:]]*"[^"]+"' "${mod_manifest}" | head -n 1 | sed -E 's/.*"([^"]+)"/\1/')"
      [[ -n "${mod_package}" ]] || {
        echo "Bundled Corelib Mod ${mod_manifest} declares no package name" >&2
        exit 1
      }
      BESKID_HOME="${mod_state}/home" \
        BESKID_CONFIG_DIR="${mod_state}/config" \
        BESKID_CORELIB_ROOT="${bundle_dir}/beskid_corelib" \
        BESKID_RUNTIME_PREFIX="${bundle_dir}" \
        BESKID_RUNTIME_KIT_PROFILE=debug \
        "${bundle_dir}/bin/beskid${binary_extension}" dev mod rebuild "${mod_manifest}" \
        --target-triple "${TARGET}" --plain
      shipped_descriptors="$(find "${bundle_dir}/beskid_corelib/${member}/.beskid/obj/mods/${mod_package}" \
        -path "*/${TARGET}/mod.descriptor.json" -type f 2>/dev/null | wc -l | tr -d '[:space:]')"
      [[ "${shipped_descriptors}" == 1 ]] || {
        echo "Bundled Corelib Mod ${mod_package} must ship exactly one ${TARGET} descriptor, found ${shipped_descriptors}" >&2
        exit 1
      }
    done
  done <<<"${corelib_members}"
  rm -rf "${mod_state}"
  printf '%s\n' "${RELEASE_VERSION}" >"${bundle_dir}/release-version.txt"
  tar -C "${release_stage}" -czf "${ROOT}/${ASSET_NAME}" "$(basename "$bundle_dir")"
  echo "built ${ASSET_NAME} (Beskid ${RELEASE_VERSION} bundle for ${TARGET})"
  exit 0
fi

# Resolve the built binary path (Windows targets get .exe).
BIN_BASE="target/${TARGET}/release/${BINARY}${binary_extension}"
[[ -f "$BIN_BASE" ]] || { echo "Missing built artifact: $BIN_BASE" >&2; exit 1; }

cp -f "$BIN_BASE" "${ROOT}/${ASSET_NAME}"
echo "built ${ASSET_NAME} (${PACKAGE} ${RELEASE_VERSION} for ${TARGET})"
