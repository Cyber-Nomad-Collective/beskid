#!/usr/bin/env bash
# Local CI preflight — run the host-callable gates before pushing.
#
#   scripts/local-preflight.sh           # host tier (seconds)
#   scripts/local-preflight.sh --full    # host tier + workflow policy checks
#
# Host tier runs the same scripts/ci/*.sh gates GHA runs, so the class of bug
# that broke main (stale pnpm-lock.yaml) is caught in seconds locally. --full adds
# static workflow validation without invoking deployment jobs.
#
# Skip rules (non-failing):
#   - @beskid/* / @cyber-nomad-* app gates skip if NODE_AUTH_TOKEN unset
#   - compiler gate is never run here (Blacksmith Testbox only)
#   - --full requires actionlint
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

run_host_gate "openspec" bash "${ROOT}/scripts/ci/openspec-gate.sh"
run_host_gate "conformance" bash "${ROOT}/scripts/ci/conformance-gate.sh"
run_host_gate "platform-integration" bash "${ROOT}/scripts/ci/platform-integration-gate.sh"
run_host_gate "supply-chain-security" bash "${ROOT}/scripts/ci/security-policy-gate.sh"

if [[ "$FULL" -eq 1 ]]; then
  echo ""
  echo "==> FULL TIER (workflow policy)"
  "${ROOT}/scripts/local-preflight-full.sh" || HOST_RC=$?
fi

echo ""
if [[ "$HOST_RC" -eq 0 ]]; then
  echo "preflight: HOST TIER OK"
else
  echo "preflight: HOST TIER FAILED (rc=${HOST_RC})" >&2
fi
exit "$HOST_RC"
