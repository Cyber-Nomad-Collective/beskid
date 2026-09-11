#!/usr/bin/env bash
# Contract: Rust build surfaces use the repository's supported fast-linker and
# binary-install toolchain without leaking Linux-only linker settings to macOS
# or Windows.
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
failures=0

pass() {
  echo "  ok   - $1"
}

fail() {
  echo "  FAIL - $1" >&2
  failures=$((failures + 1))
}

check_text() {
  local file="$1"
  local pattern="$2"
  local label="$3"

  if grep -Eq -- "${pattern}" "${root}/${file}"; then
    pass "${label}"
  else
    fail "${label} (${file})"
  fi
}

if node - "${root}/repo-deps.json" <<'NODE'
const fs = require("fs");
const manifest = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const errors = [];
const beskidTools = manifest.groups?.beskid?.tools ?? [];

for (const tool of ["cargo-binstall", "mold"]) {
  if (!beskidTools.includes(tool)) {
    errors.push(`groups.beskid.tools must declare ${tool}`);
  }
}

const binstall = manifest.tools?.["cargo-binstall"];
for (const platform of ["darwin", "linux", "windows"]) {
  if (!Array.isArray(binstall?.install?.[platform]) || binstall.install[platform].length === 0) {
    errors.push(`cargo-binstall must provide a ${platform} install method`);
    continue;
  }
  if (binstall.install[platform].length !== 1 || binstall.install[platform][0].method !== "cargo_binstall_bootstrap") {
    errors.push(`cargo-binstall ${platform} install must use only the pinned bootstrap`);
    continue;
  }
  for (const arch of ["amd64", "arm64"]) {
    const asset = binstall.install[platform][0].assets?.[arch];
    if (!asset?.target || !/^[0-9a-f]{64}$/.test(asset?.sha256 ?? "")) {
      errors.push(`cargo-binstall ${platform}/${arch} must pin an asset target and sha256`);
    }
  }
}

const mold = manifest.tools?.mold;
if (JSON.stringify(mold?.supported_platforms) !== JSON.stringify(["linux"])) {
  errors.push("mold.supported_platforms must explicitly be [\"linux\"]");
}
if (!Array.isArray(mold?.install?.linux) || mold.install.linux.length === 0) {
  errors.push("mold must provide a Linux install method");
}
if (mold?.install?.darwin || mold?.install?.windows) {
  errors.push("mold must remain Linux-only");
}

if (errors.length > 0) {
  for (const error of errors) console.error(`  FAIL - ${error}`);
  process.exit(1);
}
NODE
then
  pass "repo-deps declares the supported cargo-binstall and mold platforms"
else
  failures=$((failures + 1))
fi

# Exercise the platform filter itself, including the legacy default for tools
# that predate supported_platforms.
# shellcheck disable=SC1090,SC1091
source "${root}/scripts/lib/deps-check.sh"
export BESKID_OS=windows
if beskid_tool_supported_on_platform cargo-binstall "${root}/repo-deps.json" \
  && ! beskid_tool_supported_on_platform mold "${root}/repo-deps.json" \
  && beskid_tool_supported_on_platform git "${root}/repo-deps.json"; then
  pass "dependency platform filtering supports explicit and legacy entries"
else
  fail "dependency platform filtering returned the wrong Windows eligibility"
fi

if [[ "$(uname -s)" == "Darwin" ]]; then
  if unsupported_output="$("${root}/scripts/install-deps.sh" --check --group beskid --tool mold 2>&1)" \
    && [[ "${unsupported_output}" == *"Skip mold (not supported on darwin)"* ]] \
    && [[ "${unsupported_output}" == *"All 0 tools available"* ]]; then
    pass "an unsupported single-tool check handles an empty filtered tool list"
  else
    fail "an unsupported single-tool check must not trip Bash nounset"
  fi
fi

if node - "${root}/compiler/.cargo/config.toml" <<'NODE'
const fs = require("fs");
const config = fs.readFileSync(process.argv[2], "utf8");
const errors = [];
const linux = config.match(/\[target\.'cfg\(target_os = "linux"\)'\]([\s\S]*?)(?=\n\[|$)/)?.[1] ?? "";

if (!/^\s*linker\s*=\s*"clang"\s*$/m.test(linux)) {
  errors.push("Linux target must use clang as its linker driver");
}
if (!/link-arg=-fuse-ld=mold/.test(linux)) {
  errors.push("Linux target must pass -fuse-ld=mold");
}

const apple = config.match(/\[target\.aarch64-apple-darwin\]([\s\S]*?)(?=\n\[|$)/)?.[1] ?? "";
if (!/^\s*linker\s*=\s*"rust-lld"\s*$/m.test(apple)) {
  errors.push("Apple target must preserve rust-lld");
}

const windows = config.match(/\[target\.x86_64-pc-windows-msvc\]([\s\S]*?)(?=\n\[|$)/)?.[1] ?? "";
if (!/^\s*linker\s*=\s*"rust-lld\.exe"\s*$/m.test(windows)) {
  errors.push("Windows target must preserve rust-lld.exe");
}

if (errors.length > 0) {
  for (const error of errors) console.error(`  FAIL - ${error}`);
  process.exit(1);
}
NODE
then
  pass "Cargo selects mold only for Linux and preserves Apple/Windows linkers"
else
  failures=$((failures + 1))
fi

tools_action=".github/actions/setup-rust-build-tools/action.yml"
check_text "${tools_action}" 'cargo-bins/cargo-binstall@b874e25ea559687bec77e281e9b271aa1367b624' \
  "Rust build tools pin cargo-binstall v1.23.0"
check_text "${tools_action}" 'version: "1\.23\.0"' \
  "Rust build tools pin the installed cargo-binstall binary"
check_text "${tools_action}" 'rui314/setup-mold@7e4f20ad28a2e8ca6fd0892ccf72e2abb706b9c3' \
  "Rust build tools pin setup-mold v1"
check_text "${tools_action}" 'mold-version: "2\.42\.0"' \
  "Rust build tools pin mold"
check_text "${tools_action}" 'make-default: false' \
  "Rust build tools leave system ld unchanged"
check_text "${tools_action}" 'SCCACHE_VERSION="0\.9\.1"' \
  "Rust build tools pin sccache"
check_text "${tools_action}" 'cargo binstall([^[:cntrl:]]*)--version "\$\{SCCACHE_VERSION\}"([^[:cntrl:]]*)sccache' \
  "Rust build tools install pinned sccache with cargo-binstall"
check_text "${tools_action}" '--strategies crate-meta-data,quick-install' \
  "Rust build tools fail closed instead of compiling sccache"
check_text "${tools_action}" 'cargo-binstall -V' \
  "Rust build tools use cargo-binstall's non-ambiguous version probe"

if rg -n 'cargo install cargo-binstall' \
  "${root}/.github/actions" "${root}/.github/workflows" >/dev/null; then
  fail "CI must install prebuilt cargo-binstall instead of compiling it from source"
else
  pass "CI does not compile cargo-binstall from source"
fi

check_text ".github/workflows/publish-open-vsx.yml" \
  'uses: \./\.github/actions/setup-rust-build-tools' \
  "Open VSX publication uses the shared Rust build tools action"

check_text "compiler/justfile" 'cargo binstall cargo-sweep' \
  "cargo-sweep guidance recommends cargo binstall"

if node - "${root}/pckg/Dockerfile" "${root}/site/learn/Dockerfile" \
  "${root}/compiler/crates/beskid_pckg_server/Dockerfile" <<'NODE'
const fs = require("fs");
const surfaces = [
  { path: process.argv[2], stage: "server-build", cargoConfig: /COPY compiler \.\/compiler/ },
  { path: process.argv[3], stage: "rust", cargoConfig: /COPY compiler\/\.cargo \.\/compiler\/\.cargo/ },
  { path: process.argv[4], stage: "build", cargoConfig: /COPY \.cargo \.\/\.cargo/ },
];
const errors = [];

for (const surface of surfaces) {
  const dockerfile = fs.readFileSync(surface.path, "utf8");
  const escaped = surface.stage.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const stage = dockerfile.match(new RegExp(`FROM rust:[^\\n]+ AS ${escaped}([\\s\\S]*?)(?=\\nFROM |$)`))?.[1] ?? "";
  const label = surface.path.replace(/^.*\/beskid\//, "");

  if (!/apt-get install[^\n\\]*(?:\\\n[^\n]*)*\bmold\b/.test(stage)) {
    errors.push(`${label} Rust stage must install mold`);
  }
  if (!/(?:command -v mold|mold --version)/.test(stage)) {
    errors.push(`${label} Rust stage must verify mold`);
  }
  if (!surface.cargoConfig.test(stage)) {
    errors.push(`${label} Rust stage must copy the compiler Cargo configuration`);
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`  FAIL - ${error}`);
  process.exit(1);
}
NODE
then
  pass "Rust Docker build stages provision and verify mold"
else
  failures=$((failures + 1))
fi

if [[ "${failures}" -ne 0 ]]; then
  echo "rust linker toolchain contract failed: ${failures} check group(s) failed" >&2
  exit 1
fi

echo "rust linker toolchain contract OK"
