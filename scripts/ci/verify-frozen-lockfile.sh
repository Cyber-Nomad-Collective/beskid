#!/usr/bin/env bash
# Verify that bun.lock matches package.json for one or more directories.
#
# Canonical multi-dir frozen-lockfile check. Runs identically here, in the
# container-images GHA matrix, and under `just gate`. Sourced gate-harness
# gives structured output, log-fragment capture, and JUnit emission.
#
# Usage: verify-frozen-lockfile.sh <dir>[,<dir>...] [<dir>[,<dir>...] ...]
# Example: verify-frozen-lockfile.sh "beskid_nexus/gitnexus,beskid_nexus/gitnexus-web"
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "${ROOT}"

# shellcheck source=lib/gate-harness.sh
source "${ROOT}/scripts/ci/lib/gate-harness.sh"

if [[ $# -eq 0 ]]; then
  echo "Usage: $0 <dir>[,<dir>...] [<dir>[,<dir>...] ...]" >&2
  exit 1
fi

# Collect comma-separated dir lists from all args into a flat list.
dirs=()
for arg in "$@"; do
  IFS=',' read -r -a parts <<< "$arg"
  dirs+=("${parts[@]}")
done

# Gate name reflects the dirs checked, so JUnit testcase names are stable.
gate_init "frozen-lockfile"

for d in "${dirs[@]}"; do
  if [[ -f "$d/package.json" && -f "$d/bun.lock" ]]; then
    # Sluggify the dir for the step name (no slashes).
    local_step="lock-$(echo "$d" | tr '/.' '--')"
    gate_step "${local_step}" -- sh -c "cd '$d' && bun install --frozen-lockfile"
  else
    echo "skip $d (no package.json or bun.lock)" >&2
  fi
done

gate_summary
gate_emit_junit

if gate_overall_rc; then
  echo "All lockfiles match package.json"
  exit 0
else
  echo "Some lockfiles out of sync — run 'bun install' and commit bun.lock" >&2
  exit 1
fi
