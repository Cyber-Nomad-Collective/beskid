#!/usr/bin/env bash
# Corelib quality + test gate. Builds compiler CLI and runs Nox sessions.
# Usage: ./scripts/ci/corelib-gate.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "==> Init compiler submodule (recursive corelib)"
bash ./scripts/ci/init-compiler-submodule.sh

echo "==> Install Python dependencies for corelib CI"
python3 -m pip install --upgrade pip --quiet
python3 -m pip install -r compiler/corelib/ci/requirements.txt --quiet

echo "==> Corelib quality gate (Nox quality)"
(
  cd compiler/corelib
  python3 -m nox --non-interactive -s quality
)

echo "==> Build Beskid CLI from compiler workspace"
cargo build -p beskid_cli --release --manifest-path compiler/Cargo.toml

echo "==> Corelib test gate (Nox test)"
export BESKID_CLI_BIN="${ROOT}/compiler/target/release/beskid_cli"
(
  cd compiler/corelib
  python3 -m nox --non-interactive -s test
)

echo "==> Corelib gate passed"
