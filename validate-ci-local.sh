#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "[1/5] Sync submodules"
git -C "$ROOT_DIR" submodule update --init --recursive

echo "[2/5] Validate required workflow paths"
test -d "$ROOT_DIR/compiler"
test -d "$ROOT_DIR/pckg/src/Server.Tests"
test -d "$ROOT_DIR/beskid_vscode"

echo "[3/5] Validate pckg unit-test command"
dotnet test \
  --filter "FullyQualifiedName~Server.Tests.Unit" \
  --configuration Release \
  "$ROOT_DIR/pckg/src/Server.Tests/Server.Tests.csproj"

echo "[4/5] Validate runtime workflow commands"
cargo test -p beskid_tests runtime:: --manifest-path "$ROOT_DIR/compiler/Cargo.toml"
cargo test -p beskid_tests abi::contracts:: --manifest-path "$ROOT_DIR/compiler/Cargo.toml"

echo "[5/5] Validate runtime e2e command"
cargo build -p beskid_cli --manifest-path "$ROOT_DIR/compiler/Cargo.toml"
cargo test -p beskid_e2e_tests --manifest-path "$ROOT_DIR/compiler/Cargo.toml"

echo "All local CI workflow checks passed."
