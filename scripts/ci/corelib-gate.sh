#!/usr/bin/env bash
# Corelib gate: workspace/manifest quality checks (corelibQuality) + the
# beskid_cli corelib test suite (corelibTest).
#
# Runs directly on a Blacksmith runner and surfaces full per-test output.
#
# Run from the superrepo root. The compiler workspace lives in `compiler/` and the
# corelib sources under `compiler/corelib/beskid_corelib`.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

# Corelib lowering can recurse deeply; preserve the required stack bump.
export RUST_MIN_STACK="${RUST_MIN_STACK:-67108864}"

# ---------------------------------------------------------------------------
# Resolve the corelib workspace root: superrepo → compiler/corelib, or compiler
# checkout → corelib. Mirrors resolveCorelibRoot() in lib/corelib-manifest.ts.
# ---------------------------------------------------------------------------
if [[ -f "${ROOT}/CoreLib.bws" ]]; then
  CORELIB_ROOT="${ROOT}"
elif [[ -f "${ROOT}/compiler/corelib/CoreLib.bws" ]]; then
  CORELIB_ROOT="${ROOT}/compiler/corelib"
elif [[ -f "${ROOT}/compiler/CoreLib.bws" ]]; then
  CORELIB_ROOT="${ROOT}/compiler"
else
  echo "source must be superrepo root, compiler workspace, or corelib workspace root" >&2
  exit 1
fi

# Helper: read a top-level `key = "value"` field from a BSOL manifest line.
# Mirrors projectField() in lib/corelib-manifest.ts (manifests are BSOL, not JSON).
project_field() {
  local file="$1" key="$2"
  awk -F= -v k="$key" '
    {
      line=$0
      sub(/^[[:space:]]+/, "", line)
      sub(/[[:space:]]+$/, "", line)
      if (line == "" || substr(line,1,1) == "#") next
      n=index(line, "=")
      if (n == 0) next
      ck=substr(line, 1, n-1)
      gsub(/[[:space:]]+$/, "", ck)
      if (ck == k) {
        v=substr(line, n+1)
        gsub(/^[[:space:]]+/, "", v)
        sub(/^"/, "", v); sub(/"$/, "", v)
        print v
        exit
      }
    }
  ' "$file"
}

# discoverProjectManifest(): exactly one *.bproj in a directory.
discover_project_manifest() {
  local dir="$1" found=""
  found="$(find "$dir" -maxdepth 1 -name '*.bproj' -type f | sort)"
  local count
  count="$(printf '%s\n' "$found" | grep -c . || true)"
  if [[ "$count" -ne 1 ]]; then
    echo "Expected exactly one .bproj in ${dir}, found ${count}" >&2
    return 1
  fi
  basename "$(printf '%s\n' "$found" | head -n1)"
}

echo "==> Corelib quality checks"
if [[ ! -d "${CORELIB_ROOT}/beskid_corelib" ]]; then
  echo "Missing corelib package directory: beskid_corelib" >&2
  exit 1
fi

CORELIB_PKG="${CORELIB_ROOT}/beskid_corelib"
MANIFEST_NAME="$(discover_project_manifest "${CORELIB_PKG}")"
MANIFEST_PATH="${CORELIB_PKG}/${MANIFEST_NAME}"

name="$(project_field "${MANIFEST_PATH}" name)"
if [[ "$name" != "corelib" ]]; then
  echo "${MANIFEST_NAME}: project.name must be corelib, got ${name:-null}" >&2
  exit 1
fi

project_type="$(project_field "${MANIFEST_PATH}" type)"
if [[ "$project_type" != "Aggregate" ]]; then
  echo "${MANIFEST_NAME}: Aggregate corelib manifest must set type = Aggregate, got ${project_type:-null}" >&2
  exit 1
fi

version="$(project_field "${MANIFEST_PATH}" version)"
if [[ -z "$version" ]]; then
  echo "${MANIFEST_NAME} is missing version" >&2
  exit 1
fi

WORKSPACE_PATH="${CORELIB_ROOT}/CoreLib.bws"
if [[ ! -f "$WORKSPACE_PATH" ]]; then
  echo "Missing workspace manifest: CoreLib.bws" >&2
  exit 1
fi
ws_name="$(project_field "$WORKSPACE_PATH" name)"
if [[ "$ws_name" != "corelib" ]]; then
  echo "CoreLib.bws workspace name must be corelib, got ${ws_name:-null}" >&2
  exit 1
fi

# WORKSPACE_MEMBERS (registryName, memberId, sourceRel) — must match
# scripts/ci/lib/corelib-publish-runner.mjs.
WORKSPACE_MEMBERS=(
  "corelib corelib beskid_corelib"
  "corelib_foundation foundation packages/foundation"
  "corelib_runtime runtime packages/runtime"
  "corelib_compiler_sdk compiler_sdk packages/compiler-sdk"
  "corelib_console console packages/console"
  "corelib_concurrency concurrency packages/concurrency"
)

for entry in "${WORKSPACE_MEMBERS[@]}"; do
  read -r registry_name member_id source_rel <<<"$entry"
  member_dir="${CORELIB_ROOT}/${source_rel}"
  if [[ ! -d "$member_dir" ]]; then
    echo "Missing member directory for ${registry_name}: ${source_rel}" >&2
    exit 1
  fi
  member_manifest_name="$(discover_project_manifest "$member_dir")"
  member_name="$(project_field "${member_dir}/${member_manifest_name}" name)"
  if [[ "$member_name" != "$registry_name" ]]; then
    echo "${member_manifest_name}: project.name must be ${registry_name}, got ${member_name:-null}" >&2
    exit 1
  fi
  if [[ ! -f "${member_dir}/README.md" && ! -f "${member_dir}/readme.md" ]]; then
    echo "Missing member README for ${registry_name}" >&2
    exit 1
  fi
  if ! awk -v wanted_member="$member_id" -v wanted_package="$registry_name" '
    {
      line=$0
      sub(/^[[:space:]]+/, "", line)
      sub(/[[:space:]]+$/, "", line)
      if (line == "member \"" wanted_member "\" {") {
        in_member=1
        saw_member=1
        next
      }
      if (in_member && line == "}") {
        in_member=0
        next
      }
      if (!in_member) next
      n=index(line, "=")
      if (n == 0) next
      key=substr(line, 1, n-1)
      gsub(/[[:space:]]+$/, "", key)
      if (key != "package") next
      value=substr(line, n+1)
      gsub(/^[[:space:]]+/, "", value)
      sub(/^"/, "", value)
      sub(/"$/, "", value)
      if (value == wanted_package) package_matches=1
    }
    END { exit !(saw_member && package_matches) }
  ' "$WORKSPACE_PATH"; then
    echo "CoreLib.bws member ${member_id} must declare package = \"${registry_name}\"" >&2
    exit 1
  fi
done

# REQUIRED_FILES — must match lib/corelib-manifest.ts.
REQUIRED_FILES=(
  "packages/foundation/src/Core/Results/Results.bd"
  "packages/foundation/.generated/Core/Text/Regex/Generated.g.bd"
  "packages/foundation/src/Core/ErrorHandling/ErrorHandling.bd"
  "packages/foundation/src/Core/String/String.bd"
  "packages/foundation/src/Core/Optional/Option.bd"
  "packages/foundation/src/Collections/Collections.bd"
  "packages/foundation/src/Collections/Array.bd"
  "packages/foundation/src/Query/Query.bd"
  "packages/foundation/src/Query/QueryState.bd"
  "packages/foundation/src/Testing/Testing.bd"
  "packages/foundation/src/Testing/Assert.bd"
  "packages/foundation/src/Testing/Contracts.bd"
  "packages/foundation/src/Core/Input/Input.bd"
  "packages/foundation/src/Core/Output/Output.bd"
  "packages/foundation/src/Core/Syscall/Syscall.bd"
)
for rel in "${REQUIRED_FILES[@]}"; do
  if [[ ! -f "${CORELIB_ROOT}/${rel}" ]]; then
    echo "Missing required file: ${rel}" >&2
    exit 1
  fi
done
echo "quality OK: corelib workspace manifest version ${version}"

if [[ "${CORELIB_QUALITY_ONLY:-0}" == "1" ]]; then
  exit 0
fi

# ---------------------------------------------------------------------------
# Corelib test suite via beskid_cli. Mirrors corelibTest() in corelib-test.ts:
# build the CLI release, ensure the runtime bridge, then run the test project.
# The test output now streams directly to the job log.
# ---------------------------------------------------------------------------
TESTS_DIR="${CORELIB_ROOT}/beskid_corelib/tests/corelib_tests"
TESTS_MANIFEST="$(discover_project_manifest "${TESTS_DIR}")"

# Resolve the compiler workspace root (where cargo + scripts/ live).
if [[ -f "${ROOT}/compiler/Cargo.toml" ]]; then
  COMPILER_ROOT="${ROOT}/compiler"
elif [[ -f "${ROOT}/Cargo.toml" ]]; then
  COMPILER_ROOT="${ROOT}"
else
  echo "Could not locate compiler workspace root (no compiler/Cargo.toml)" >&2
  exit 1
fi
cd "${COMPILER_ROOT}"
cargo build -p beskid_cli --release

CLI="${COMPILER_ROOT}/target/release/beskid_cli"
export BESKID_CLI_BIN="${CLI}"
export BESKID_RUNTIME_PREFIX="${BESKID_RUNTIME_PREFIX:-${CARGO_TARGET_DIR:-${COMPILER_ROOT}/target}/native-runtime-kit}"
export BESKID_RUNTIME_KIT_PROFILE=release
bash scripts/stage-native-runtime-kit.sh
cd "${TESTS_DIR}"
"$CLI" test --project "${TESTS_MANIFEST}" --all-targets --plain
