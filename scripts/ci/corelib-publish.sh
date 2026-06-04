#!/usr/bin/env bash
# Publish corelib workspace bundle to pckg.beskid-lang.org.
# Requires: BESKID_PCKG_KEY secret; COMPILER_SUBMODULE_TOKEN for submodule init.
# Usage: ./scripts/ci/corelib-publish.sh [version_bump]
#   version_bump: patch (default), minor, or major
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

VERSION_BUMP="${1:-patch}"
if [[ "$VERSION_BUMP" != "patch" && "$VERSION_BUMP" != "minor" && "$VERSION_BUMP" != "major" ]]; then
  echo "version_bump must be patch, minor, or major; got: ${VERSION_BUMP}" >&2
  exit 1
fi

echo "==> Init compiler submodule (recursive corelib)"
bash ./scripts/ci/init-compiler-submodule.sh

echo "==> Build Beskid CLI from compiler workspace"
cargo build -p beskid_cli --release --manifest-path compiler/Cargo.toml

echo "==> Install Python dependencies for corelib CI"
python3 -m pip install --upgrade pip --quiet
python3 -m pip install -r compiler/corelib/ci/requirements.txt --quiet

echo "==> Publish corelib workspace to pckg (version bump: ${VERSION_BUMP})"
export BESKID_CLI_BIN="${ROOT}/compiler/target/release/beskid_cli"
export BESKID_CORELIB_ROOT="${ROOT}/compiler/corelib"
export BESKID_PCKG_BASE_URL="${BESKID_PCKG_BASE_URL:-https://pckg.beskid-lang.org}"
export BESKID_PCKG_VERSION_BUMP="${VERSION_BUMP}"

# BESKID_PCKG_KEY is the GitHub secret; BESKID_PCKG_API_KEY is what publish_corelib.py expects.
export BESKID_PCKG_API_KEY="${BESKID_PCKG_API_KEY:-${BESKID_PCKG_KEY:-}}"

if [[ -z "${BESKID_PCKG_API_KEY:-}" ]]; then
  echo "BESKID_PCKG_API_KEY is not set — cannot publish to pckg" >&2
  exit 1
fi

(
  cd compiler/corelib
  python3 -m nox --non-interactive -s publish_corelib
)

echo "==> Corelib publish complete"
