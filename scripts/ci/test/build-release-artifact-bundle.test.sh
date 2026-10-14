#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
builder="${root}/scripts/ci/build-release-artifact.sh"
extractor="${BESKID_DISTRIB_ROOT:-${root}/beskid_distrib}/scripts/extract-release-bundle.sh"
tmp="$(mktemp -d)"
trap 'rm -rf "${tmp}"' EXIT

git -C "${root}" diff --quiet -- beskid_distrib
[[ "$(git -C "${root}" rev-parse HEAD:beskid_distrib)" == "$(git -C "${root}/beskid_distrib" rev-parse HEAD)" ]]

mkdir -p "${tmp}/root/scripts/ci" "${tmp}/root/compiler/crates/beskid_cli" \
  "${tmp}/root/compiler/crates/beskid_lsp" "${tmp}/root/compiler/crates/beskid_up" \
  "${tmp}/root/compiler/crates/beskid_execution/src/bin" \
  "${tmp}/root/compiler/corelib/beskid_corelib" "${tmp}/root/compiler/corelib/packages/foundation" \
  "${tmp}/root/compiler/corelib/mods/example_mod" \
  "${tmp}/root/compiler/scripts" "${tmp}/bin"
cp "${builder}" "${root}/scripts/ci/qualify-native-tool-driver.py" "${tmp}/root/scripts/ci/"
for manifest in beskid_cli beskid_lsp beskid_up; do
  printf '[package]\nname = "%s"\nversion = "1.2.3"\n\n[dependencies]\nclap = { version = "4.4" }\n' "${manifest}" >"${tmp}/root/compiler/crates/${manifest}/Cargo.toml"
done
printf '# fixture lock\n' >"${tmp}/root/compiler/Cargo.lock"
printf '[workspace]\nmembers = ["crates/*"]\n\n[profile.release]\nopt-level = 3\n' >"${tmp}/root/compiler/Cargo.toml"
# Source files the native tool driver qualifier digests.
printf '[package]\nname = "beskid_execution"\nversion = "0.1.0"\n' >"${tmp}/root/compiler/crates/beskid_execution/Cargo.toml"
for source in src/lib.rs src/compiler_driver.rs src/bin/beskid_native_tool_driver.rs; do
  printf '// fixture %s\n' "${source}" >"${tmp}/root/compiler/crates/beskid_execution/${source}"
done
printf 'project { name = "corelib" }\n' >"${tmp}/root/compiler/corelib/beskid_corelib/corelib.bproj"
printf 'project { name = "foundation" }\n' >"${tmp}/root/compiler/corelib/packages/foundation/foundation.bproj"
printf 'example_mod { name = "example_mod"\n  type = Mod }\n' >"${tmp}/root/compiler/corelib/mods/example_mod/example_mod.bproj"
cat >"${tmp}/root/compiler/corelib/CoreLib.bws" <<'BWS'
workspace {
  name = "corelib"
}

member "corelib" {
  path = "beskid_corelib"
}

member "foundation" {
  path = "packages/foundation"
}

member "example_mod" {
  path = "mods/example_mod"
}
BWS

cat >"${tmp}/bin/cargo" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
target=''
args=("$@")
for index in "${!args[@]}"; do
  [[ "${args[$index]}" == --target ]] && target="${args[$((index + 1))]}"
done
[[ " $* " == *" --locked "* ]] || { echo 'fixture cargo requires --locked' >&2; exit 1; }
mkdir -p "target/${target}/release"
extension=''; [[ "${target}" == x86_64-pc-windows-msvc ]] && extension=.exe
if [[ " $* " == *" --message-format=json "* ]]; then
  [[ " $* " == *" -p beskid_execution "* && " $* " == *" --bin beskid_native_tool_driver "* ]] || exit 1
  driver="${PWD}/target/${target}/release/beskid_native_tool_driver${extension}"
  printf '#!/usr/bin/env bash\nexit 0\n' >"${driver}"
  chmod +x "${driver}"
  printf '{"reason":"compiler-artifact","manifest_path":"%s","target":{"name":"beskid_native_tool_driver","kind":["bin"]},"profile":{"test":false,"opt_level":"3"},"executable":"%s"}\n' \
    "${PWD}/crates/beskid_execution/Cargo.toml" "${driver}"
  printf '{"reason":"build-finished","success":true}\n'
  exit 0
fi
for binary in beskid_cli beskid_lsp beskid-up; do
  if [[ "${binary}" == beskid_cli ]]; then
    cat >"target/${target}/release/${binary}${extension}" <<'CLI'
#!/usr/bin/env bash
set -euo pipefail
if [[ "${1:-}" == dev && "${2:-}" == runtime-kit && "${3:-}" == build-native-host ]]; then
  target="$(basename "$(dirname "$(dirname "$0")")")"
  mkdir -p "${BESKID_RUNTIME_PREFIX}/lib/beskid-runtime/abi-5/${target}/release"
  printf '{}\n' >"${BESKID_RUNTIME_PREFIX}/lib/beskid-runtime/abi-5/${target}/release/abi.json"
  exit 0
fi
if [[ "${1:-}" == dev && "${2:-}" == mod && "${3:-}" == rebuild ]]; then
  manifest="$4"; triple=''
  args=("$@")
  for index in "${!args[@]}"; do
    [[ "${args[$index]}" == --target-triple ]] && triple="${args[$((index + 1))]}"
  done
  [[ -n "${triple}" && "${BESKID_RUNTIME_KIT_PROFILE:-}" == debug ]] || exit 1
  [[ -f "${BESKID_RUNTIME_PREFIX}/lib/beskid-runtime/abi-5/${triple}/debug/abi.json" ]] || exit 1
  [[ -z "${FAIL_MOD_BUILD:-}" ]] || exit 1
  artifact="$(dirname "${manifest}")/.beskid/obj/mods/$(basename "${manifest}" .bproj)/key/${triple}"
  mkdir -p "${artifact}"
  printf '{}\n' >"${artifact}/mod.descriptor.json"
  exit 0
fi
[[ "${1:-}" == dev && "${2:-}" == corelib ]] || exit 1
mkdir -p "${BESKID_CORELIB_ROOT}"
cp -a corelib/CoreLib.bws corelib/beskid_corelib corelib/packages corelib/mods "${BESKID_CORELIB_ROOT}/"
if [[ -n "${OMIT_CORELIB_MOD:-}" ]]; then rm -rf "${BESKID_CORELIB_ROOT}/mods"; fi
printf '%064d\n' 0 >"${BESKID_CORELIB_ROOT}/.beskid-bundle.sha256"
CLI
  else
    printf '#!/usr/bin/env bash\nexit 0\n' >"target/${target}/release/${binary}${extension}"
  fi
  chmod +x "target/${target}/release/${binary}${extension}"
done
SH
cat >"${tmp}/bin/rustup" <<'SH'
#!/usr/bin/env bash
exit 0
SH
cat >"${tmp}/bin/powershell" <<'SH'
#!/usr/bin/env bash
exit 0
SH
cat >"${tmp}/root/compiler/scripts/stage-native-runtime-kit.sh" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
target_path="$(dirname "$(dirname "${BESKID_CLI_BIN}")")"
target="$(basename "${target_path}")"
runtime="${BESKID_RUNTIME_PREFIX}/lib/beskid-runtime/abi-5/${target}/${BESKID_RUNTIME_KIT_PROFILE}"
rm -rf "${BESKID_RUNTIME_PREFIX}/lib/beskid-runtime/abi-5"
mkdir -p "${runtime}"
printf '{}\n' >"${runtime}/abi.json"
SH
chmod +x "${tmp}/bin/cargo" "${tmp}/bin/rustup" "${tmp}/bin/powershell" \
  "${tmp}/root/compiler/scripts/stage-native-runtime-kit.sh"

assert_bundle() {
  local target="$1" extension="$2"
  local archive="beskid-1.2.3-${target}.tar.gz"
  PATH="${tmp}/bin:${PATH}" bash "${tmp}/root/scripts/ci/build-release-artifact.sh" \
    beskid_bundle ignored "${target}" "${archive}" 1.2.3
  local extracted="${tmp}/extracted-${target}"
  bash "${extractor}" "${tmp}/root/${archive}" 1.2.3 "${target}" "${extracted}"
  for binary in beskid beskid_lsp beskid-up; do
    test -x "${extracted}/bin/${binary}${extension}"
  done
  test -f "${extracted}/lib/beskid-runtime/abi-5/${target}/release/abi.json"
  test -f "${extracted}/lib/beskid-runtime/abi-5/${target}/debug/abi.json"
  test -f "${extracted}/beskid_corelib/.beskid-bundle.sha256"
  test -f "${extracted}/beskid_corelib/CoreLib.bws"
  test -f "${extracted}/beskid_corelib/beskid_corelib/corelib.bproj"
  test -f "${extracted}/beskid_corelib/packages/foundation/foundation.bproj"
  test -f "${extracted}/beskid_corelib/mods/example_mod/example_mod.bproj"
  test -f "${extracted}/beskid_corelib/mods/example_mod/.beskid/obj/mods/example_mod/key/${target}/mod.descriptor.json"
  test ! -e "${extracted}/beskid_corelib/packages/foundation/.beskid"
  test ! -e "${extracted}/packages"
  grep -Fxq 1.2.3 "${extracted}/release-version.txt"
  test ! -e "${extracted}/native-runtime-kit"
  test ! -e "${extracted}/beskid_cli${extension}"
}

assert_bundle x86_64-unknown-linux-gnu ''
assert_bundle x86_64-pc-windows-msvc .exe

if PATH="${tmp}/bin:${PATH}" bash "${tmp}/root/scripts/ci/build-release-artifact.sh" \
  beskid_bundle ignored x86_64-unknown-linux-gnu beskid-1.2.4-x86_64-unknown-linux-gnu.tar.gz 1.2.4 2>"${tmp}/version.err"; then
  echo 'a release version that differs from the checked-in crate versions must be rejected' >&2
  exit 1
fi
grep -Fq "release version 1.2.4 does not match compiler/crates/beskid_cli/Cargo.toml version '1.2.3'" "${tmp}/version.err"
test ! -e "${tmp}/root/beskid-1.2.4-x86_64-unknown-linux-gnu.tar.gz"

if OMIT_CORELIB_MOD=1 PATH="${tmp}/bin:${PATH}" bash "${tmp}/root/scripts/ci/build-release-artifact.sh" \
  beskid_bundle ignored x86_64-unknown-linux-gnu beskid-1.2.3-missing-mod.tar.gz 1.2.3 2>"${tmp}/missing-mod.err"; then
  echo 'a bundle without a CoreLib.bws member must be rejected' >&2
  exit 1
fi
grep -Fq 'missing member mods/example_mod' "${tmp}/missing-mod.err"

if FAIL_MOD_BUILD=1 PATH="${tmp}/bin:${PATH}" bash "${tmp}/root/scripts/ci/build-release-artifact.sh" \
  beskid_bundle ignored x86_64-unknown-linux-gnu beskid-1.2.3-failed-mod.tar.gz 1.2.3 2>"${tmp}/failed-mod.err"; then
  echo 'a bundle whose Corelib Mod cannot be prebuilt must be rejected' >&2
  exit 1
fi
test ! -e "${tmp}/root/beskid-1.2.3-failed-mod.tar.gz"

# The build verifies the release version; it never edits manifests or the lock file.
for manifest in beskid_cli beskid_lsp beskid_up; do
  grep -Fxq 'version = "1.2.3"' "${tmp}/root/compiler/crates/${manifest}/Cargo.toml"
  grep -Fxq 'clap = { version = "4.4" }' "${tmp}/root/compiler/crates/${manifest}/Cargo.toml"
done
grep -Fxq '# fixture lock' "${tmp}/root/compiler/Cargo.lock"
echo 'build release artifact bundle tests OK'
