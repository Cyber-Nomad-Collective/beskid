#!/usr/bin/env bash
# Platform smoke gate — root workspace install + structure check.
#
# Runs identically here, in the beskid-platform GHA job, and under `just gate`.
# Sourced gate-harness gives structured output, log-fragment capture, and JUnit
# emission (when GATE_JUNIT_DIR is set).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "${ROOT}"

# shellcheck source=lib/gate-harness.sh
source "${ROOT}/scripts/ci/lib/gate-harness.sh"

gate_init "platform-smoke"

gate_step "root-frozen-install" -- bun install --frozen-lockfile

gate_summary
gate_emit_junit

# Exit with the worst step's rc so CI fails on any failed step.
if gate_overall_rc; then
  echo "platform-smoke OK"
  exit 0
else
  echo "platform-smoke FAILED" >&2
  exit 1
fi
