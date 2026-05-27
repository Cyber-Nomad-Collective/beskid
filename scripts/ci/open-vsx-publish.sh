#!/usr/bin/env bash
# Build beskid_lsp and publish the VS Code extension to Open VSX (native CI runners).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

platform="${OPENVSX_PLATFORM:-}"
bin_name="${OPENVSX_BIN_NAME:-}"
rust_target="${OPENVSX_RUST_TARGET:-}"

if [[ -z "$platform" || -z "$bin_name" ]]; then
  echo "Set OPENVSX_PLATFORM and OPENVSX_BIN_NAME (e.g. linux-x64, beskid_lsp)." >&2
  echo "Optional OPENVSX_RUST_TARGET for cross-compiles (e.g. x86_64-apple-darwin for darwin-x64)." >&2
  exit 1
fi

if [[ -z "${OVSX_TOKEN:-}" ]]; then
  echo "Missing required environment variable: OVSX_TOKEN" >&2
  exit 1
fi

init_submodule() {
  local path="$1"
  local default_url="$2"
  local url_env="$3"
  local token_env="$4"
  local recursive="${5:-false}"

  git submodule sync -- "$path"

  local url="${!url_env:-$default_url}"
  local token="${!token_env:-}"
  if [[ -n "$token" ]]; then
    url="https://x-access-token:${token}@github.com/Cyber-Nomad-Collective/${path}.git"
    case "$path" in
      compiler) url="https://x-access-token:${token}@github.com/Cyber-Nomad-Collective/beskid_compiler.git" ;;
      beskid_vscode) url="https://x-access-token:${token}@github.com/Cyber-Nomad-Collective/beskid_vscode.git" ;;
    esac
  fi

  git config "submodule.${path}.url" "$url"
  local update_args=(git -c protocol.version=2 submodule update --init --depth 1 "$path")
  if [[ "$recursive" == "true" ]]; then
    update_args=(git -c protocol.version=2 submodule update --init --recursive --depth 1 "$path")
  fi
  "${update_args[@]}"
}

echo "==> Init compiler submodule"
init_submodule compiler \
  "https://github.com/Cyber-Nomad-Collective/beskid_compiler.git" \
  COMPILER_SUBMODULE_URL \
  COMPILER_SUBMODULE_TOKEN \
  true

cargo_cmd=(cargo build -p beskid_lsp --release)
if [[ -n "$rust_target" ]]; then
  cargo_cmd+=(--target "$rust_target")
fi
echo "==> Build LSP: ${cargo_cmd[*]}"
(
  cd compiler
  "${cargo_cmd[@]}"
)

if [[ -n "$rust_target" ]]; then
  bin_src="compiler/target/${rust_target}/release/${bin_name}"
else
  bin_src="compiler/target/release/${bin_name}"
fi
if [[ ! -f "$bin_src" ]]; then
  echo "Missing LSP binary: $bin_src" >&2
  exit 1
fi

echo "==> Init beskid_vscode submodule"
init_submodule beskid_vscode \
  "${BESKID_VSCODE_SUBMODULE_URL:-https://github.com/Cyber-Nomad-Collective/beskid_vscode.git}" \
  BESKID_VSCODE_SUBMODULE_URL \
  BESKID_VSCODE_SUBMODULE_TOKEN

server_dir="beskid_vscode/server/${platform}"
mkdir -p "$server_dir"
bin_dst="${server_dir}/${bin_name}"
cp "$bin_src" "$bin_dst"
if [[ ! "$platform" =~ ^win32 ]]; then
  chmod +x "$bin_dst"
fi

export BESKID_REPO_ROOT="$ROOT"
bash "$ROOT/beskid_infra/dagger/scripts/open-vsx-bundle-publish.sh" \
  "$platform" \
  "$bin_name" \
  "$OVSX_TOKEN"
