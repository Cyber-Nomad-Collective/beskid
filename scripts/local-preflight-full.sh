#!/usr/bin/env bash
# Full-fidelity preflight tier: act + podman, for YAML/container fidelity.
# Invoked by scripts/local-preflight.sh --full. Exits non-zero on any failure.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${ROOT}"

die() { echo "full: $*" >&2; exit 1; }

command -v act    >/dev/null 2>&1 || die "act not installed (brew install act)"
command -v podman >/dev/null 2>&1 || die "podman not installed (brew install podman)"

SOCK="/tmp/preflight-podman.sock"
echo "full: starting podman service at ${SOCK}"
podman system service --time=0 "unix://${SOCK}" &
PODMAN_PID=$!
trap 'kill "${PODMAN_PID}" 2>/dev/null || true' EXIT
export DOCKER_HOST="unix://${SOCK}"

# Give the socket a moment to come up.
for _ in 1 2 3 4 5; do
  podman info >/dev/null 2>&1 && break
  sleep 0.5
done
podman info >/dev/null 2>&1 || die "podman socket did not come up"

RC=0
run_act() {  # run_act <workflow>
  local wf="$1"
  echo ""
  echo "======== act: ${wf} ========"
  if act -W ".github/workflows/${wf}" \
       --container-architecture linux/amd64 \
       --env GATE_JUNIT_DIR=/tmp/gate-junit \
       ; then
    echo "======== act: ${wf}: PASS ========"
  else
    local rc=$?
    echo "======== act: ${wf}: FAIL (rc=${rc}) ========" >&2
    RC=$rc
  fi
}

# Act-runnable workflows. Container builds run; deploy is skipped via env below.
run_act "beskid-platform.yml"
run_act "container-images.yml"
run_act "normative-spec.yml"

# Explicit SKIP: compiler gate cannot run under act.
echo ""
echo "======== compiler-gate-testbox: SKIP ========"
echo "  The compiler gate uses useblacksmith/*-testbox actions that require a"
echo "  live Blacksmith runner. Run its underlying scripts directly to iterate:"
echo "    bash scripts/ci/compiler-rust-gate.sh"
echo "    bash scripts/ci/lsp-command-contract-gate.sh"

if [[ "$RC" -eq 0 ]]; then
  echo "full: ALL ACT WORKFLOWS OK"
else
  echo "full: ACT WORKFLOWS FAILED (rc=${RC})" >&2
fi
exit "$RC"
