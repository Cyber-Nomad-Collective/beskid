#!/usr/bin/env bash
# Local CI preflight — run the host-callable gates before pushing.
#
#   scripts/local-preflight.sh           # host tier (seconds)
#   scripts/local-preflight.sh --full    # host tier + act/podman (minutes)
#
# Host tier runs the same scripts/ci/*.sh gates GHA runs, so the class of bug
# that broke main (stale bun.lock) is caught in seconds locally. --full adds
# act+podman for YAML/container fidelity.
#
# Skip rules (non-failing):
#   - @beskid/* / @cyber-nomad-* app gates skip if NODE_AUTH_TOKEN unset
#   - compiler gate is never run here (Blacksmith Testbox only)
#   - --full skips with a clear reason if act or podman are missing
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${ROOT}"

FULL=0
for a in "$@"; do
  case "$a" in
    --full) FULL=1 ;;
    -h|--help)
      sed -n '2,16p' "$0"
      exit 0
      ;;
    *) echo "unknown arg: $a (try --help)" >&2; exit 1 ;;
  esac
done

# Host tier collects JUnit too, so a local run looks like a CI run for triage.
export GATE_JUNIT_DIR="${GATE_JUNIT_DIR:-$(mktemp -d)}"
export GATE_LOG_DIR="${GATE_LOG_DIR:-$(mktemp -d)}"
JUNIT="${GATE_JUNIT_DIR}"
echo "preflight: junit -> ${JUNIT}"
echo "preflight: logs  -> ${GATE_LOG_DIR}"

HOST_RC=0

run_host_gate() {  # run_host_gate <label> <cmd...>
  local label="$1"; shift
  echo ""
  echo "======== ${label} ========"
  if "$@"; then
    echo "======== ${label}: PASS ========"
  else
    local rc=$?
    echo "======== ${label}: FAIL (rc=${rc}) ========" >&2
    HOST_RC=$rc
  fi
}

echo "==> HOST TIER"

# 1. Lockfile drift — the check that would have caught the week-long main break.
run_host_gate "verify-frozen-lockfile" \
  bash "${ROOT}/scripts/ci/verify-frozen-lockfile.sh" \
    "." "site/website" "site/auth" "site/platform-spec" "beskid_web_common"

# 2. Root workspace structure.
run_host_gate "platform-smoke" \
  bash "${ROOT}/scripts/ci/platform-smoke.sh"

# 3. App gates — skip cleanly if the GitHub Packages token is missing.
if [[ -z "${NODE_AUTH_TOKEN:-${BESKID_NODE_AUTH_TOKEN:-}}" ]]; then
  echo ""
  echo "======== site-build-gate: SKIP ========"
  echo "  set NODE_AUTH_TOKEN (or BESKID_NODE_AUTH_TOKEN) to run the auth and"
  echo "  platform-spec app gates (needed for @beskid/* GitHub Packages deps)."
else
  export NODE_AUTH_TOKEN="${NODE_AUTH_TOKEN:-${BESKID_NODE_AUTH_TOKEN}}"
  run_host_gate "site-build-gate (auth)" \
    bash "${ROOT}/scripts/ci/site-build-gate.sh" auth "${NODE_AUTH_TOKEN}"
  run_host_gate "site-build-gate (platform-spec)" \
    bash "${ROOT}/scripts/ci/site-build-gate.sh" platform-spec "${NODE_AUTH_TOKEN}"
fi

# 4. Normative spec validation — same invocation as normative-spec.yml.
if [[ -f "${ROOT}/beskid_web_common/packages/spec-core/scripts/validate-workspace.ts" ]] \
  && [[ -d "${ROOT}/site/spec-content" ]]; then
  run_host_gate "normative-spec-validate" \
    sh -c '(cd beskid_web_common/packages/spec-core && bun install >/dev/null 2>&1) && bun run beskid_web_common/packages/spec-core/scripts/validate-workspace.ts site/spec-content'
else
  echo ""
  echo "======== normative-spec-validate: SKIP ========"
  echo "  beskid_web_common submodule or site/spec-content not present."
fi

if [[ "$FULL" -eq 1 ]]; then
  echo ""
  echo "==> FULL TIER (act + podman)"
  "${ROOT}/scripts/local-preflight-full.sh" || HOST_RC=$?
fi

echo ""
if [[ "$HOST_RC" -eq 0 ]]; then
  echo "preflight: HOST TIER OK"
else
  echo "preflight: HOST TIER FAILED (rc=${HOST_RC})" >&2
fi
exit "$HOST_RC"
