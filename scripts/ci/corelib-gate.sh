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

# CI retains this report independently of the job log. Keep the implementation
# in this gate so failures before the test runner starts are still recorded.
CORELIB_REPORT_DIR="${CORELIB_REPORT_DIR:-}"
CORELIB_REPORT_FILE="${CORELIB_REPORT_DIR:+${CORELIB_REPORT_DIR}/corelib-build-report.md}"
# Command logs are deliberately held outside the uploaded report directory.
# The report contains only a redacted tail for failed steps.
CORELIB_REPORT_LOG_DIR=""
CORELIB_GATE_STARTED="$(date +%s)"
CORELIB_REPORT_STEPS=()
CORELIB_REPORT_RESULTS=()
CORELIB_REPORT_DURATIONS=()
CORELIB_REPORT_LOGS=()

corelib_report_step() {
  local label="$1"
  shift
  local started ended duration rc log
  started="$(date +%s)"
  if [[ -n "${CORELIB_REPORT_DIR}" ]]; then
    if [[ -z "${CORELIB_REPORT_LOG_DIR}" ]]; then
      CORELIB_REPORT_LOG_DIR="$(mktemp -d "${RUNNER_TEMP:-${TMPDIR:-/tmp}}/corelib-gate-logs.XXXXXX")"
    fi
    log="${CORELIB_REPORT_LOG_DIR}/${#CORELIB_REPORT_STEPS[@]}.log"
    # Do not pipe a shell function through tee: quality validation establishes
    # metadata used later in the report, and a pipeline would lose it in a
    # subshell. Replay the captured output immediately after each command.
    if "$@" >"${log}" 2>&1; then
      rc=0
    else
      rc=$?
    fi
    cat "${log}"
  else
    log=""
    if "$@"; then
    rc=0
    else
      rc=$?
    fi
  fi
  ended="$(date +%s)"
  duration=$((ended - started))
  CORELIB_REPORT_STEPS+=("${label}")
  CORELIB_REPORT_RESULTS+=("${rc}")
  CORELIB_REPORT_DURATIONS+=("${duration}")
  CORELIB_REPORT_LOGS+=("${log}")
  return "${rc}"
}

corelib_run_bounded_phase() {
  local label="$1"
  local timeout_seconds="$2"
  shift 2

  echo "==> ${label} (timeout: ${timeout_seconds}s)"
  set +e
  timeout --kill-after=60s "${timeout_seconds}" "$@"
  local rc=$?
  set -e
  if [[ "${rc}" -eq 124 ]]; then
    echo "::error::${label} exceeded its ${timeout_seconds}s hard cap; failing with phase evidence." >&2
  fi
  return "${rc}"
}

corelib_run_test_matrix() {
  corelib_run_bounded_phase "run Corelib tests" "${CORELIB_TEST_TIMEOUT:-1800}" \
    "$CLI" test --project "${TESTS_MANIFEST}" --all-targets --plain </dev/null
}

corelib_sanitize_diagnostic_tail() {
  local log="$1"
  tail -n 40 "${log}" 2>/dev/null | sed -E \
    -e 's/github_pat_[[:alnum:]_]+/[REDACTED]/g' \
    -e 's/gh[pousr]_[[:alnum:]_]+/[REDACTED]/g' \
    -e 's/((GITHUB_TOKEN|NODE_AUTH_TOKEN|NPM_TOKEN|CARGO_REGISTRY_TOKEN|OPENBAO_TOKEN)=)[^[:space:]]+/\1[REDACTED]/g'
}

corelib_write_report() {
  [[ -n "${CORELIB_REPORT_FILE}" ]] || return 0
  local final_rc="${1:-0}" finished total i result status runtime_files runtime_size
  finished="$(date +%s)"
  total=$((finished - CORELIB_GATE_STARTED))
  mkdir -p "${CORELIB_REPORT_DIR}"
  runtime_files="not staged"
  runtime_size="not staged"
  if [[ -n "${BESKID_RUNTIME_PREFIX:-}" && -d "${BESKID_RUNTIME_PREFIX}" ]]; then
    runtime_files="$(find "${BESKID_RUNTIME_PREFIX}" -type f | wc -l | tr -d ' ')"
    runtime_size="$(du -sh "${BESKID_RUNTIME_PREFIX}" | awk '{print $1}')"
  fi
  {
    echo "# Corelib build report"
    echo
    echo "## Run metadata"
    echo
    echo "| field | value |"
    echo "|---|---|"
    echo "| final exit code | ${final_rc} |"
    echo "| total duration | ${total}s |"
    echo "| commit | ${GITHUB_SHA:-$(git -C "${ROOT}" rev-parse --short HEAD 2>/dev/null || echo unknown)} |"
    echo "| workflow run | ${GITHUB_SERVER_URL:-}/${GITHUB_REPOSITORY:-}/actions/runs/${GITHUB_RUN_ID:-local} |"
    echo "| corelib root | ${CORELIB_ROOT:-unresolved} |"
    echo "| corelib manifest version | ${version:-unresolved} |"
    echo "| runtime kit prefix | ${BESKID_RUNTIME_PREFIX:-unresolved} |"
    echo "| runtime kit files | ${runtime_files} |"
    echo "| runtime kit size | ${runtime_size} |"
    echo
    echo "## Command outcomes"
    echo
    echo "| command | result | duration |"
    echo "|---|---|---:|"
    for ((i = 0; i < ${#CORELIB_REPORT_STEPS[@]}; i++)); do
      result="${CORELIB_REPORT_RESULTS[$i]}"
      status="PASS"
      [[ "${result}" == 0 ]] || status="FAIL (exit ${result})"
      echo "| ${CORELIB_REPORT_STEPS[$i]} | ${status} | ${CORELIB_REPORT_DURATIONS[$i]}s |"
    done
    if [[ "${final_rc}" -ne 0 ]]; then
      echo
      echo "## Failure diagnostics"
      echo
      for ((i = 0; i < ${#CORELIB_REPORT_STEPS[@]}; i++)); do
        [[ "${CORELIB_REPORT_RESULTS[$i]}" == 0 ]] && continue
        echo "### ${CORELIB_REPORT_STEPS[$i]}"
        echo
        echo '```text'
        corelib_sanitize_diagnostic_tail "${CORELIB_REPORT_LOGS[$i]}" || true
        echo '```'
        echo
      done
    fi
  } > "${CORELIB_REPORT_FILE}"
}

corelib_report_exit() {
  local rc=$?
  trap - EXIT
  corelib_write_report "${rc}" || true
  [[ -z "${CORELIB_REPORT_LOG_DIR}" ]] || rm -rf "${CORELIB_REPORT_LOG_DIR}"
  exit "${rc}"
}

if [[ -n "${CORELIB_REPORT_DIR}" ]]; then
  trap corelib_report_exit EXIT
  trap 'exit 143' INT TERM
fi

# Corelib lowering can recurse deeply; preserve the required stack bump.
export RUST_MIN_STACK="${RUST_MIN_STACK:-67108864}"

# ---------------------------------------------------------------------------
# Resolve the corelib workspace root: superrepo → compiler/corelib, or compiler
# checkout → corelib. Mirrors resolveCorelibRoot() in lib/corelib-manifest.ts.
# ---------------------------------------------------------------------------
corelib_resolve_workspace() {
  if [[ -f "${ROOT}/CoreLib.bws" ]]; then
    CORELIB_ROOT="${ROOT}"
  elif [[ -f "${ROOT}/compiler/corelib/CoreLib.bws" ]]; then
    CORELIB_ROOT="${ROOT}/compiler/corelib"
  elif [[ -f "${ROOT}/compiler/CoreLib.bws" ]]; then
    CORELIB_ROOT="${ROOT}/compiler"
  else
    echo "source must be superrepo root, compiler workspace, or corelib workspace root" >&2
    return 1
  fi
}

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

corelib_quality_checks() {
echo "==> Corelib quality checks"
if [[ ! -d "${CORELIB_ROOT}/beskid_corelib" ]]; then
  echo "Missing corelib package directory: beskid_corelib" >&2
  return 1
fi

CORELIB_PKG="${CORELIB_ROOT}/beskid_corelib"
if ! MANIFEST_NAME="$(discover_project_manifest "${CORELIB_PKG}")"; then
  return 1
fi
MANIFEST_PATH="${CORELIB_PKG}/${MANIFEST_NAME}"

name="$(project_field "${MANIFEST_PATH}" name)"
if [[ "$name" != "corelib" ]]; then
  echo "${MANIFEST_NAME}: project.name must be corelib, got ${name:-null}" >&2
  return 1
fi

project_type="$(project_field "${MANIFEST_PATH}" type)"
if [[ "$project_type" != "Aggregate" ]]; then
  echo "${MANIFEST_NAME}: Aggregate corelib manifest must set type = Aggregate, got ${project_type:-null}" >&2
  return 1
fi

version="$(project_field "${MANIFEST_PATH}" version)"
if [[ -z "$version" ]]; then
  echo "${MANIFEST_NAME} is missing version" >&2
  return 1
fi

WORKSPACE_PATH="${CORELIB_ROOT}/CoreLib.bws"
if [[ ! -f "$WORKSPACE_PATH" ]]; then
  echo "Missing workspace manifest: CoreLib.bws" >&2
  return 1
fi
ws_name="$(project_field "$WORKSPACE_PATH" name)"
if [[ "$ws_name" != "corelib" ]]; then
  echo "CoreLib.bws workspace name must be corelib, got ${ws_name:-null}" >&2
  return 1
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
    return 1
  fi
  if ! member_manifest_name="$(discover_project_manifest "$member_dir")"; then
    return 1
  fi
  member_name="$(project_field "${member_dir}/${member_manifest_name}" name)"
  if [[ "$member_name" != "$registry_name" ]]; then
    echo "${member_manifest_name}: project.name must be ${registry_name}, got ${member_name:-null}" >&2
    return 1
  fi
  if [[ ! -f "${member_dir}/README.md" && ! -f "${member_dir}/readme.md" ]]; then
    echo "Missing member README for ${registry_name}" >&2
    return 1
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
    return 1
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
    return 1
  fi
done
echo "quality OK: corelib workspace manifest version ${version}"
}

# API-SHAPE-004: Prelude SHALL only re-export @tier(standard) modules.
# Scans foundation source files and verifies that:
#  1. Every module imported by an aggregate/document-level module carries @tier(standard).
#  2. No @tier(supported) module is re-exported from a hub that feeds the prelude.
corelib_prelude_tier_validation() {
  local foundation_src="${CORELIB_ROOT}/packages/foundation/src"
  local violations=0

  # Known hub files whose direct submodules form the prelude surface.
  # These hubs aggregate child modules; anything they re-export must be @tier(standard).
  local prelude_hubs=(
    "Core/Error/Error.bd"
    "Core/Input/Input.bd"
    "Core/Output/Output.bd"
    "Core/Optional/Option.bd"
    "Core/Optional/Optional.bd"
    "Core/Results/Results.bd"
    "Core/ErrorHandling/ErrorHandling.bd"
    "Core/String/String.bd"
    "Core/Encoding/Encoding.bd"
    "Core/Bytes/Bytes.bd"
    "Collections/Collections.bd"
    "Collections/Array.bd"
    "Core/Syscall/Syscall.bd"
  )

  for hub in "${prelude_hubs[@]}"; do
    local hub_path="${foundation_src}/${hub}"
    if [[ ! -f "${hub_path}" ]]; then
      continue
    fi
    # Check: the hub itself must have @tier(standard) or be the primary module.
    if ! grep -q '@tier(standard)' "${hub_path}"; then
      echo "Prelude violation (API-SHAPE-004): ${hub} is a prelude-surface module but lacks @tier(standard)" >&2
      violations=$((violations + 1))
    fi
  done

  # Scan all .bd files for @tier(supported) that are re-exported from a standard hub.
  while IFS= read -r -d '' file; do
    local rel="${file#${foundation_src}/}"
    # Check if this file has @tier(supported) and is imported by a standard hub.
    if grep -q '@tier(supported)' "${file}"; then
      # Check if any standard hub imports this module.
      for hub in "${prelude_hubs[@]}"; do
        local hub_path="${foundation_src}/${hub}"
        local mod_name="${rel%.bd}"
        mod_name="${mod_name//\//.}"
        if [[ -f "${hub_path}" ]] && grep -q "${mod_name}" "${hub_path}" 2>/dev/null; then
          echo "Prelude violation (API-SHAPE-004): ${rel} is @tier(supported) but imported by prelude hub ${hub}" >&2
          violations=$((violations + 1))
        fi
      done
    fi
  done < <(find "${foundation_src}" -name '*.bd' -print0 2>/dev/null)

  if [[ "${violations}" -gt 0 ]]; then
    echo "Prelude tier validation FAILED: ${violations} violation(s) found (API-SHAPE-004)" >&2
    return 1
  fi
  echo "prelude tier validation OK (API-SHAPE-004): all prelude-surface modules carry @tier(standard)"
}

if [[ "${CORELIB_QUALITY_ONLY:-0}" == "1" ]]; then
  corelib_report_step "resolve Corelib workspace" corelib_resolve_workspace
  corelib_report_step "quality checks" corelib_quality_checks
  exit $?
fi

# ---------------------------------------------------------------------------
# Corelib test suite via beskid_cli. Mirrors corelibTest() in corelib-test.ts:
# build the CLI release, ensure the runtime bridge, then run the test project.
# The test output now streams directly to the job log.
# ---------------------------------------------------------------------------
corelib_prepare_test_inputs() {
  TESTS_DIR="${CORELIB_ROOT}/beskid_corelib/tests/corelib_tests"
  if ! TESTS_MANIFEST="$(discover_project_manifest "${TESTS_DIR}")"; then
    return 1
  fi

  # Resolve the compiler workspace root (where cargo + scripts/ live).
  if [[ -f "${ROOT}/compiler/Cargo.toml" ]]; then
    COMPILER_ROOT="${ROOT}/compiler"
  elif [[ -f "${ROOT}/Cargo.toml" ]]; then
    COMPILER_ROOT="${ROOT}"
  else
    echo "Could not locate compiler workspace root (no compiler/Cargo.toml)" >&2
    return 1
  fi
}

corelib_report_step "resolve Corelib workspace" corelib_resolve_workspace
corelib_report_step "quality checks" corelib_quality_checks
corelib_report_step "resolve Corelib test inputs" corelib_prepare_test_inputs
cd "${COMPILER_ROOT}"
corelib_report_step "build beskid_cli (release)" \
  corelib_run_bounded_phase "build beskid_cli (release)" "${CORELIB_CLI_BUILD_TIMEOUT:-900}" \
  cargo build -p beskid_cli --release

CLI="${COMPILER_ROOT}/target/release/beskid_cli"
export BESKID_CLI_BIN="${CLI}"
export BESKID_RUNTIME_PREFIX="${BESKID_RUNTIME_PREFIX:-${CARGO_TARGET_DIR:-${COMPILER_ROOT}/target}/native-runtime-kit}"
export BESKID_RUNTIME_KIT_PROFILE=release
corelib_report_step "stage native runtime kit" \
  corelib_run_bounded_phase "stage native runtime kit" "${CORELIB_RUNTIME_KIT_TIMEOUT:-900}" \
  bash scripts/stage-native-runtime-kit.sh
cd "${TESTS_DIR}"
corelib_report_step "run Corelib tests" corelib_run_test_matrix
