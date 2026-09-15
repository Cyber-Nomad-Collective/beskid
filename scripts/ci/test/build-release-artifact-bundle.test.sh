#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
builder="${root}/scripts/ci/build-release-artifact.sh"
extractor="${root}/beskid_distrib/scripts/extract-release-bundle.sh"
tmp="$(mktemp -d)"
trap 'rm -rf "${tmp}"' EXIT

git -C "${root}" diff --quiet -- beskid_distrib
[[ "$(git -C "${root}" rev-parse HEAD:beskid_distrib)" == "$(git -C "${root}/beskid_distrib" rev-parse HEAD)" ]]

mkdir -p "${tmp}/root/scripts/ci" "${tmp}/root/compiler/crates/beskid_cli" \
  "${tmp}/root/compiler/crates/beskid_lsp" "${tmp}/root/compiler/crates/beskid_up" \
  "${tmp}/root/compiler/corelib/beskid_corelib" "${tmp}/root/compiler/corelib/packages/foundation" \
  "${tmp}/root/compiler/scripts" "${tmp}/bin"
cp "${builder}" "${tmp}/root/scripts/ci/"
for manifest in beskid_cli beskid_lsp beskid_up; do
  printf '[package]\nname = "%s"\nversion = "0.0.1"\n' "${manifest}" >"${tmp}/root/compiler/crates/${manifest}/Cargo.toml"
done
printf '# fixture lock\n' >"${tmp}/root/compiler/Cargo.lock"
printf 'project { name = "corelib" }\n' >"${tmp}/root/compiler/corelib/beskid_corelib/corelib.bproj"
printf 'project { name = "foundation" }\n' >"${tmp}/root/compiler/corelib/packages/foundation/foundation.bproj"

cat >"${tmp}/bin/cargo" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
target=''
args=("$@")
for index in "${!args[@]}"; do
  [[ "${args[$index]}" == --target ]] && target="${args[$((index + 1))]}"
done
mkdir -p "target/${target}/release"
extension=''; [[ "${target}" == x86_64-pc-windows-msvc ]] && extension=.exe
for binary in beskid_cli beskid_lsp beskid-up; do
  printf '#!/usr/bin/env bash\nexit 0\n' >"target/${target}/release/${binary}${extension}"
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
runtime="${BESKID_RUNTIME_PREFIX}/lib/beskid-runtime/abi-5/${target}/release"
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
  test -f "${extracted}/beskid_corelib/corelib.bproj"
  test -f "${extracted}/packages/foundation/foundation.bproj"
  grep -Fxq 1.2.3 "${extracted}/release-version.txt"
  test ! -e "${extracted}/native-runtime-kit"
  test ! -e "${extracted}/beskid_cli${extension}"
}

assert_bundle x86_64-unknown-linux-gnu ''
assert_bundle x86_64-pc-windows-msvc .exe

grep -Fq 'version = "0.0.1"' "${tmp}/root/compiler/crates/beskid_cli/Cargo.toml"
echo 'build release artifact bundle tests OK'
