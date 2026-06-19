# CI Cleanup & Diagnosability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the CI cleanup begun in WS1 by building the gate harness (WS2), local preflight (WS3), and rich failure reports + release artifact (WS4), so every gate is host-callable, DRY, and produces a detailed report on failure.

**Architecture:** A single sourced bash library — `scripts/ci/lib/gate-harness.sh` — gives every gate script four capabilities (step tracking, log-fragment capture on failure, per-gate summary, optional JUnit XML emission) with zero new runtime deps. The same gate scripts then run three ways: in GHA (XML on → upload-artifact), under `just gate` (XML off → fast host tier), and under `just gate --full` (host tier + act/podman). A pure-bash report builder converts the collected JUnit into markdown + consolidated XML for GHA annotations and release attachment.

**Tech Stack:** Bash (sourced libs, matching existing `scripts/ci/lib/*.sh` and `scripts/install-deps.sh` conventions), YAML anchors (GitHub Actions parser), `act` + `podman` (opt-in full tier), `actions/upload-artifact@v6`, `actions/download-artifact@v6`, `dorny/test-reporter@v1`, `softprops/action-gh-release@v2`. No Node, no jq, no Bats — all new bash is zero-dependency.

**Spec:** `docs/superpowers/specs/2026-06-19-ci-cleanup-and-diagnosability-design.md`

**Sequencing:** WS2 → WS3 → WS4. WS2 is the foundation (harness); WS3 and WS4 both consume it. Each workstream is one commit. Push to `main` directly per user instruction (no PRs), but each commit must be independently green.

**Conventions for every task:**
- All paths are relative to the superrepo root (`/Users/mikserek/Projects/beskid`).
- All new bash files start with `set -euo pipefail` unless they are *sourced* (harness, libs) — those set strict mode themselves and document that the caller owns `set`.
- Commit message style matches the existing `fix(ci):` / `feat(ci):` convention (see `60978543`). No `Co-authored-by` (AGENTS.md).

---

## Workstream 2 — DRY the CI surface

### Task 2.1: Create the gate harness library

**Files:**
- Create: `scripts/ci/lib/gate-harness.sh`

**Responsibility:** Sourced library giving gate scripts step tracking, log capture, summary, and optional JUnit emission. Never executed standalone. Pure bash + coreutils.

- [ ] **Step 1: Write the harness**

Create `scripts/ci/lib/gate-harness.sh`:

```bash
#!/usr/bin/env bash
# Gate harness — sourced by every scripts/ci/*.sh gate script.
#
# Gives a gate four capabilities with zero new runtime deps (bash + coreutils):
#   - gate_init <name>            set GATE_NAME, prepare log + junit dirs
#   - gate_step <step> -- <cmd…>  run a sub-step, capture pass/fail + log tail
#   - gate_summary                print per-gate pass/fail summary to stderr
#   - gate_emit_junit             write JUnit XML iff GATE_JUNIT_DIR is set
#
# Sourced, not exec'd. The harness enforces `set -euo pipefail` on itself but
# the CALLER owns process exit — gate_step records failures without aborting, so
# a gate runs all its steps and reports the worst at the end.
#
# Env:
#   GATE_JUNIT_DIR   if set, gate_emit_junit writes <GATE_NAME>.xml there
#   GATE_LOG_DIR     if set, step logs tee to $GATE_LOG_DIR/<GATE>/<step>.log
#                    (defaults to $(mktemp -d) if unset; cleared on gate_init)

# shellcheck shell=bash
set -euo pipefail

# State for the current gate (arrays; re-sourcing is a no-op via _GATE_INIT).
declare -ga _GATE_STEPS=()      # "step-name" entries, in order
declare -ga _GATE_RESULTS=()    # parallel: "pass" | "fail"
declare -ga _GATE_DURATIONS=()  # parallel: integer seconds
declare -g  _GATE_INIT=0

gate_init() {
  local name="${1:?gate_init: gate name required}"
  GATE_NAME="$name"
  _GATE_STEPS=()
  _GATE_RESULTS=()
  _GATE_DURATIONS=()
  _GATE_INIT=1
  GATE_LOG_DIR="${GATE_LOG_DIR:-$(mktemp -d)}"
  mkdir -p "${GATE_LOG_DIR}/${GATE_NAME}"
  export GATE_NAME GATE_LOG_DIR
}

# gate_step <step-name> -- <cmd...>
gate_step() {
  [[ "${_GATE_INIT:-0}" -eq 1 ]] || { echo "gate_step: gate_init not called" >&2; return 1; }
  local step=""
  local cmd=()
  local saw_separator=0
  while [[ $# -gt 0 ]]; do
    if [[ "$1" == "--" ]]; then
      saw_separator=1
      shift
      cmd=("$@")
      break
    fi
    if [[ -z "$step" ]]; then
      step="$1"
    else
      echo "gate_step: unexpected arg '$1' before --" >&2
      return 1
    fi
    shift
  done
  [[ -n "$step" ]] || { echo "gate_step: step name required" >&2; return 1; }
  [[ "$saw_separator" -eq 1 ]] || { echo "gate_step: missing -- before command" >&2; return 1; }
  [[ ${#cmd[@]} -gt 0 ]] || { echo "gate_step: empty command for '$step'" >&2; return 1; }

  local log="${GATE_LOG_DIR}/${GATE_NAME}/${step}.log"
  echo "==> ${GATE_NAME}: ${step}" >&2

  local start_ns end_ns dur
  start_ns=$(date +%s%N)
  if "${cmd[@]}" >"$log" 2>&1; then
    _GATE_STEPS+=("$step"); _GATE_RESULTS+=("pass"); _GATE_DURATIONS+=("$(date +%s%N)")
    echo "    PASS  ${step}" >&2
  else
    local rc=$?
    _GATE_STEPS+=("$step"); _GATE_RESULTS+=("fail"); _GATE_DURATIONS+=("$(date +%s%N)")
    echo "    FAIL  ${step} (rc=${rc})" >&2
    echo "    ----- log fragment (${step}) -----" >&2
    tail -n 20 "$log" | sed 's/^/    /' >&2
    echo "    ----------------------------------" >&2
  fi
  # Note: return 0 always; failures are recorded, not propagated, so the gate
  # runs all steps. gate_overall_rc reports the worst at the end.
  return 0
}

# Worst-step exit code: 0 if all pass, 1 if any fail. Caller exits with this.
gate_overall_rc() {
  local r
  for r in "${_GATE_RESULTS[@]:-}"; do
    [[ "$r" == "fail" ]] && return 1
  done
  return 0
}

gate_summary() {
  echo "" >&2
  echo "==== ${GATE_NAME} summary ====" >&2
  local i len=${#_GATE_STEPS[@]}
  for ((i = 0; i < len; i++)); do
    printf '  %-40s %s\n' "${_GATE_STEPS[$i]}" "${_GATE_RESULTS[$i]}" >&2
  done
  if gate_overall_rc; then
    echo "  ${GATE_NAME} OK" >&2
  else
    echo "  ${GATE_NAME} FAILED" >&2
  fi
}

# Emit JUnit XML iff GATE_JUNIT_DIR is set. Schema: minimal but valid for
# dorny/test-reporter (java-junit reporter) and most consumers.
gate_emit_junit() {
  [[ -n "${GATE_JUNIT_DIR:-}" ]] || return 0
  [[ "${_GATE_INIT:-0}" -eq 1 ]] || return 0
  mkdir -p "${GATE_JUNIT_DIR}"
  local out="${GATE_JUNIT_DIR}/${GATE_NAME}.xml"
  local total=${#_GATE_STEPS[@]}
  local failures=0
  local r
  for r in "${_GATE_RESULTS[@]:-}"; do [[ "$r" == "fail" ]] && ((failures++)) || true; done

  {
    echo '<?xml version="1.0" encoding="UTF-8"?>'
    echo '<testsuites>'
    printf '  <testsuite name="%s" tests="%d" failures="%d">\n' \
      "${GATE_NAME}" "${total}" "${failures}"
    local i len=${#_GATE_STEPS[@]}
    for ((i = 0; i < len; i++)); do
      local step="${_GATE_STEPS[$i]}"
      local res="${_GATE_RESULTS[$i]}"
      # Duration: recompute from timestamps we stored (seconds, 3 decimals).
      local dur_s="0.000"
      if [[ $i -gt 0 ]]; then
        local prev="${_GATE_DURATIONS[$((i-1))]}"
        local cur="${_GATE_DURATIONS[$i]}"
        dur_s=$(awk -v a="$prev" -v b="$cur" 'BEGIN{printf "%.3f", (b-a)/1000000000}')
      fi
      local log="${GATE_LOG_DIR}/${GATE_NAME}/${step}.log"
      printf '    <testcase name="%s" classname="%s" time="%s">\n' \
        "${step}" "${GATE_NAME}" "${dur_s}"
      if [[ "$res" == "fail" ]]; then
        echo '      <failure message="step failed"><![CDATA['
        # Tail into CDATA; the CDATA close is on its own line so a ]]> in the
        # log body can't prematurely terminate it (split any literal ]]> ).
        tail -n 40 "$log" 2>/dev/null | sed 's/]]>/] ] >/g' || true
        echo ']]></failure>'
      fi
      echo '    </testcase>'
    done
    echo '  </testsuite>'
    echo '</testsuites>'
  } >"$out"
}
```

- [ ] **Step 2: Sanity-check it sources cleanly**

Run:
```bash
bash -c 'source scripts/ci/lib/gate-harness.sh && echo sourced-ok'
```
Expected: prints `sourced-ok`, exit 0.

- [ ] **Step 3: Commit**

```bash
git add scripts/ci/lib/gate-harness.sh
git commit -m "feat(ci): add gate-harness.sh sourced library (WS2)

Zero-dependency sourced bash library giving every gate script step tracking,
log-fragment capture on failure, per-gate summary, and optional JUnit XML
emission. Foundation for WS3 (just gate) and WS4 (rich reports).

The harness records failures without aborting so a gate runs all its steps;
gate_overall_rc reports the worst at the end. JUnit is emitted only when
GATE_JUNIT_DIR is set, so the same scripts run quiet+fast under 'just gate'
and verbose+XML under GHA."
```

---

### Task 2.2: Harness self-tests (zero-dependency runner)

**Files:**
- Create: `scripts/ci/test/run-gate-harness-tests.sh`
- Create: `scripts/ci/test/lib/assert.sh`

**Responsibility:** Prove the harness's four functions work, with no new test framework. A tiny `assert.sh` (functions, not a framework) drives fixture scenarios.

- [ ] **Step 1: Create the assert helper**

Create `scripts/ci/test/lib/assert.sh`:

```bash
#!/usr/bin/env bash
# Tiny zero-dependency assert helpers for scripts/ci/test/*.sh runners.
# Not a framework — just functions. Sourced by test runners.
# shellcheck shell=bash
_TESTS_RUN=0
_TESTS_FAIL=0

assert_eq() {  # assert_eq <expected> <actual> <label>
  local expected="$1" actual="$2" label="${3:-assert}"
  _TESTS_RUN=$((_TESTS_RUN + 1))
  if [[ "$expected" == "$actual" ]]; then
    echo "  ok   - ${label}"
  else
    _TESTS_FAIL=$((_TESTS_FAIL + 1))
    echo "  FAIL - ${label}"
    echo "        expected: ${expected}"
    echo "        actual:   ${actual}"
  fi
}

assert_contains() {  # assert_contains <haystack> <needle> <label>
  local haystack="$1" needle="$2" label="${3:-assert}"
  _TESTS_RUN=$((_TESTS_RUN + 1))
  if [[ "$haystack" == *"$needle"* ]]; then
    echo "  ok   - ${label}"
  else
    _TESTS_FAIL=$((_TESTS_FAIL + 1))
    echo "  FAIL - ${label}"
    echo "        needle '${needle}' not in:"
    echo "${haystack}" | sed 's/^/          /'
  fi
}

assert_file_exists() {  # assert_file_exists <path> <label>
  local path="$1" label="${2:-file exists}"
  _TESTS_RUN=$((_TESTS_RUN + 1))
  if [[ -f "$path" ]]; then
    echo "  ok   - ${label}"
  else
    _TESTS_FAIL=$((_TESTS_FAIL + 1))
    echo "  FAIL - ${label}: ${path} missing"
  fi
}

finish_tests() {  # call at end of runner; exits with proper code
  echo ""
  echo "ran ${_TESTS_RUN}, failed ${_TESTS_FAIL}"
  [[ "${_TESTS_FAIL}" -eq 0 ]]
}
```

- [ ] **Step 2: Write the harness test runner**

Create `scripts/ci/test/run-gate-harness-tests.sh`:

```bash
#!/usr/bin/env bash
# Self-tests for scripts/ci/lib/gate-harness.sh. Zero-dependency.
# Run: bash scripts/ci/test/run-gate-harness-tests.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "${ROOT}"

# shellcheck source=lib/assert.sh
source "${ROOT}/scripts/ci/test/lib/assert.sh"

TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT
export GATE_LOG_DIR="${TMP}/logs"
export GATE_JUNIT_DIR="${TMP}/junit"

# shellcheck source=../lib/gate-harness.sh
source "${ROOT}/scripts/ci/lib/gate-harness.sh"

echo "== pass path =="
gate_init "demo-pass"
gate_step "true-step" -- /bin/true
gate_step "echo-step" -- /bin/sh -c 'echo hello'
gate_summary
assert_eq "0" "$(gate_overall_rc >/dev/null; echo $?)" "overall rc passes when all steps pass"
assert_file_exists "${GATE_JUNIT_DIR}/demo-pass.xml" "junit emitted"

echo "== fail path =="
gate_init "demo-fail"
gate_step "ok-step" -- /bin/true
gate_step "bad-step" -- /bin/sh -c 'echo about to fail; exit 7'
gate_summary
assert_eq "1" "$(gate_overall_rc >/dev/null; echo $?)" "overall rc fails when any step fails"

echo "== junit failure content =="
JUNIT="$(cat "${GATE_JUNIT_DIR}/demo-fail.xml")"
assert_contains "${JUNIT}" 'tests="2"' "junit records 2 testcases"
assert_contains "${JUNIT}" 'failures="1"' "junit records 1 failure"
assert_contains "${JUNIT}" '<failure' "junit has a failure element"
assert_contains "${JUNIT}" 'about to fail' "junit failure CDATA contains log tail"

echo "== no GATE_JUNIT_DIR → no xml =="
unset GATE_JUNIT_DIR
gate_init "no-xml"
gate_step "s" -- /bin/true
gate_emit_junit
# Nothing should be written under TMP/junit for no-xml.
assert_eq "0" "$(ls -1 "${TMP}/junit" | grep -c '^no-xml\.xml$' || true)" "no junit when GATE_JUNIT_DIR unset"

finish_tests
```

- [ ] **Step 3: Run the tests, confirm pass**

Run:
```bash
bash scripts/ci/test/run-gate-harness-tests.sh
```
Expected: all `ok -` lines, ends with `ran 8, failed 0`, exit 0.

- [ ] **Step 4: Commit**

```bash
git add scripts/ci/test/lib/assert.sh scripts/ci/test/run-gate-harness-tests.sh
git commit -m "test(ci): add zero-dependency gate-harness self-tests (WS2)"
```

---

### Task 2.3: Refactor `platform-smoke.sh` onto the harness

**Files:**
- Modify: `scripts/ci/platform-smoke.sh`

**Responsibility:** Wrap the existing root install + structure checks in `gate_step`. Behavior unchanged for a green run; on failure, structured fragment + JUnit instead of a bare traceback.

- [ ] **Step 1: Read the current file**

Run: `cat scripts/ci/platform-smoke.sh`
Confirm it currently reads (post-WS1):
```bash
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "${ROOT}"
echo "==> bun install --frozen-lockfile (root)"
bun install --frozen-lockfile
echo "platform-smoke OK"
```

- [ ] **Step 2: Rewrite onto the harness**

Replace the entire file with:

```bash
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
```

- [ ] **Step 3: Run it green locally**

Run:
```bash
bash scripts/ci/platform-smoke.sh; echo "rc=$?"
```
Expected: prints `==> platform-smoke: root-frozen-install`, `PASS root-frozen-install`, summary block, `platform-smoke OK`, `rc=0`.

- [ ] **Step 4: Run it with JUnit on, confirm XML**

Run:
```bash
GATE_JUNIT_DIR=/tmp/smoke-junit bash scripts/ci/platform-smoke.sh >/dev/null 2>&1
cat /tmp/smoke-junit/platform-smoke.xml
```
Expected: well-formed XML with `tests="1" failures="0"`.

- [ ] **Step 5: Commit**

```bash
git add scripts/ci/platform-smoke.sh
git commit -m "refactor(ci): platform-smoke onto gate-harness (WS2)

Behavior unchanged on green; on failure now emits structured step summary +
log fragment + optional JUnit instead of a bare traceback."
```

---

### Task 2.4: Refactor `site-build-gate.sh` onto the harness

**Files:**
- Modify: `scripts/ci/site-build-gate.sh`

**Responsibility:** Each per-app check becomes a `gate_step`. The dead inline `bun install --frozen-lockfile` calls are replaced by `gate_step` wrapping (semantics preserved — these *are* the frozen checks for those dirs; the §5.2 "centralize" goal is satisfied because each app's frozen check is now uniformly a `gate_step`, and the standalone `verify-frozen-lockfile.sh` remains the canonical multi-dir helper).

- [ ] **Step 1: Rewrite the auth branch**

Replace the entire `if [[ "$APP" == "auth" ]]; then … elif … platform-spec … fi` body. Full new file:

```bash
#!/usr/bin/env bash
# Site build gate for the auth hub and the platform-spec app.
#
# Runs identically here, in the container-images GHA matrix, and under
# `just gate`. Sourced gate-harness gives structured output, log-fragment
# capture, and JUnit emission (when GATE_JUNIT_DIR is set).
#
# Usage: site-build-gate.sh <auth|platform-spec> [NODE_AUTH_TOKEN]
set -euo pipefail

APP="${1:-}"
NODE_AUTH_TOKEN="${2:-}"

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "${ROOT}"

# shellcheck source=lib/gate-harness.sh
source "${ROOT}/scripts/ci/lib/gate-harness.sh"

if [[ "$APP" == "auth" ]]; then
  gate_init "site-build-auth"
  [[ -n "$NODE_AUTH_TOKEN" ]] && export NODE_AUTH_TOKEN
  gate_step "auth-frozen-install"  -- sh -c 'cd site/auth && bun install --frozen-lockfile'
  gate_step "auth-test"            -- sh -c 'cd site/auth && bun run test'
  gate_step "auth-build"           -- sh -c 'cd site/auth && SKIP_ENV_VALIDATION=1 bun run build'
  gate_step "auth-verify-bundle"   -- sh -c 'cd site/auth && bun run verify:client-bundle'
  gate_step "auth-test-bundle"     -- sh -c 'cd site/auth && bun run test:bundle'
elif [[ "$APP" == "platform-spec" ]]; then
  gate_init "site-build-platform-spec"
  [[ -n "$NODE_AUTH_TOKEN" ]] && export NODE_AUTH_TOKEN
  gate_step "spec-core-install"    -- sh -c 'cd beskid_web_common && bun install --frozen-lockfile'
  gate_step "spec-core-test"       -- sh -c 'cd beskid_web_common && bun run --filter "@cyber-nomad-collective/spec-core" test'
  gate_step "pspec-frozen-install" -- sh -c 'cd site/platform-spec && bun install --frozen-lockfile'
  gate_step "pspec-test"           -- sh -c 'cd site/platform-spec && bun run test'
  gate_step "pspec-build"          -- sh -c 'cd site/platform-spec && SKIP_ENV_VALIDATION=1 bun run build'
  gate_step "pspec-verify-bundle"  -- sh -c 'cd site/platform-spec && bun run verify:client-bundle'
else
  echo "Usage: $0 <auth|platform-spec> [NODE_AUTH_TOKEN]" >&2
  exit 1
fi

gate_summary
gate_emit_junit

if gate_overall_rc; then
  echo "site-build-gate OK (${APP})"
  exit 0
else
  echo "site-build-gate FAILED (${APP})" >&2
  exit 1
fi
```

- [ ] **Step 2: Confirm usage-error path still works**

Run:
```bash
bash scripts/ci/site-build-gate.sh 2>&1; echo "rc=$?"
```
Expected: prints `Usage: … <auth|platform-spec>`, `rc=1`.

- [ ] **Step 3: Confirm structure (do NOT run full app builds locally — needs NODE_AUTH_TOKEN + minutes)**

Run a parse-only check:
```bash
bash -n scripts/ci/site-build-gate.sh && echo "syntax-ok"
```
Expected: `syntax-ok`. (Full app builds are verified in Task 3.4 via `just gate` if the token is set, else in GHA.)

- [ ] **Step 4: Commit**

```bash
git add scripts/ci/site-build-gate.sh
git commit -m "refactor(ci): site-build-gate onto gate-harness (WS2)

Each per-app check (install/test/build/verify-bundle) is now a gate_step with
structured output + log-fragment capture on failure. Behavior on green
unchanged."
```

---

### Task 2.5: Refactor `verify-frozen-lockfile.sh` onto the harness

**Files:**
- Modify: `scripts/ci/verify-frozen-lockfile.sh`

- [ ] **Step 1: Rewrite onto the harness**

Full new file:

```bash
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
```

- [ ] **Step 2: Run it green on root**

Run:
```bash
bash scripts/ci/verify-frozen-lockfile.sh "."; echo "rc=$?"
```
Expected: `==> frozen-lockfile: lock-`, `PASS`, `All lockfiles match package.json`, `rc=0`.

- [ ] **Step 3: Commit**

```bash
git add scripts/ci/verify-frozen-lockfile.sh
git commit -m "refactor(ci): verify-frozen-lockfile onto gate-harness (WS2)"
```

---

### Task 2.6: DRY the `beskid-platform.yml` path filter with a YAML anchor

**Files:**
- Modify: `.github/workflows/beskid-platform.yml`

- [ ] **Step 2 step renumbered below — Step 1 is the edit**

- [ ] **Step 1: Replace the duplicated paths blocks with an anchor**

In `.github/workflows/beskid-platform.yml`, replace the entire `on:` block:

```yaml
on:
  push:
    branches: [main, stg]
    paths:
      - 'site/**'
      - 'beskid_web_common'
      - 'beskid_web_common/**'
      - 'beskid_tracker'
      - 'beskid_tracker/**'
      - 'beskid_nexus'
      - 'beskid_nexus/**'
      - 'pckg'
      - 'pckg/**'
      - 'compiler'
      - 'compiler/**'
      - 'beskid_infra'
      - 'beskid_infra/**'
      - 'package.json'
      - 'bun.lock'
      - '.npmrc'
      - '.github/workflows/beskid-platform.yml'
      - '.github/workflows/container-images.yml'
      - '.github/workflows/coolify-compose-deploy.yml'
      - '.github/actions/**'
      - 'scripts/ci/**'
      - 'dagger.json'
  pull_request:
    branches: [main, stg]
    paths:
      - 'site/**'
      - 'beskid_web_common'
      - 'beskid_web_common/**'
      - 'beskid_tracker'
      - 'beskid_tracker/**'
      - 'beskid_nexus'
      - 'beskid_nexus/**'
      - 'pckg'
      - 'pckg/**'
      - 'compiler'
      - 'compiler/**'
      - 'beskid_infra'
      - 'beskid_infra/**'
      - '.github/workflows/beskid-platform.yml'
      - '.github/workflows/container-images.yml'
      - '.github/workflows/coolify-compose-deploy.yml'
      - '.github/actions/**'
      - 'scripts/ci/**'
      - 'dagger.json'
```

with:

```yaml
on:
  push:
    branches: [main, stg]
    paths: &platform-paths
      - 'site/**'
      - 'beskid_web_common'
      - 'beskid_web_common/**'
      - 'beskid_tracker'
      - 'beskid_tracker/**'
      - 'beskid_nexus'
      - 'beskid_nexus/**'
      - 'pckg'
      - 'pckg/**'
      - 'compiler'
      - 'compiler/**'
      - 'beskid_infra'
      - 'beskid_infra/**'
      - 'package.json'
      - 'bun.lock'
      - '.npmrc'
      - '.github/workflows/beskid-platform.yml'
      - '.github/workflows/container-images.yml'
      - '.github/workflows/coolify-compose-deploy.yml'
      - '.github/actions/**'
      - 'scripts/ci/**'
      - 'dagger.json'
  pull_request:
    branches: [main, stg]
    paths: *platform-paths
```

- [ ] **Step 2: Validate the YAML parses**

Run:
```bash
python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/beskid-platform.yml')); print('yaml-ok')"
```
Expected: `yaml-ok`. (If python3 is unavailable, `act --list -W .github/workflows/beskid-platform.yml` after WS3 lands; for now python3 is the lightweight check.)

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/beskid-platform.yml
git commit -m "refactor(ci): DRY beskid-platform paths via YAML anchor (WS2)

Single source of truth for push/PR path filters; drift between the two
triggers becomes impossible. GitHub Actions resolves anchors at parse time."
```

---

### Task 2.7: WS2 verification gate

**Files:** none (verification only)

- [ ] **Step 1: Run all WS2-touched gates green**

Run:
```bash
bash scripts/ci/test/run-gate-harness-tests.sh && \
bash scripts/ci/platform-smoke.sh && \
bash scripts/ci/verify-frozen-lockfile.sh "." && \
bash -n scripts/ci/site-build-gate.sh
```
Expected: all exit 0; last prints `syntax-ok`.

- [ ] **Step 2: Confirm workflow YAML parses**

Run:
```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/beskid-platform.yml')); print('ok')"
```
Expected: `ok`.

- [ ] **Step 3: Push WS2 to main**

```bash
git push origin main
```
Per user instruction: direct push, no PR. Watch the triggered `beskid-platform` run for the smoke job — it should be green and now produce JUnit (uploaded in WS4; for now the XML just isn't collected yet).

---

## Workstream 3 — Local preflight (`just gate`)

### Task 3.1: Create `scripts/local-preflight.sh` (host tier)

**Files:**
- Create: `scripts/local-preflight.sh`

**Responsibility:** Single entrypoint for `just gate`. Host tier runs the host-callable gates fast. `--full` adds act+podman. Skip rules for missing token / missing tools are explicit, non-failing.

- [ ] **Step 1: Write the host-tier preflight**

Create `scripts/local-preflight.sh`:

```bash
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

ROOT="$(cd "$(dirname "$0")" && pwd)"
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
```

- [ ] **Step 2: Make it executable**

Run: `chmod +x scripts/local-preflight.sh`

- [ ] **Step 3: Run the host tier green (no token → app gates skip)**

Run:
```bash
scripts/local-preflight.sh; echo "rc=$?"
```
Expected: lockfile + smoke + normative run/skip, app gates SKIP, ends `preflight: HOST TIER OK`, `rc=0`. (This is the acceptance test that WS2+WS3 work together.)

- [ ] **Step 4: Commit**

```bash
git add scripts/local-preflight.sh
git commit -m "feat(ci): add local-preflight.sh host tier (WS3)

Single entrypoint for 'just gate'. Runs the host-callable gates (lockfile,
smoke, app gates, normative validate) with the same JUnit output as CI, so a
local failure looks identical to a CI failure. App gates skip cleanly when
NODE_AUTH_TOKEN is unset rather than failing."
```

---

### Task 3.2: Create `scripts/local-preflight-full.sh` (act + podman tier)

**Files:**
- Create: `scripts/local-preflight-full.sh`

**Responsibility:** The opt-in `--full` path. Starts the podman socket, invokes `act` on the act-runnable workflows, explicitly SKIPs the compiler gate with a reason.

- [ ] **Step 1: Write the full-tier preflight**

Create `scripts/local-preflight-full.sh`:

```bash
#!/usr/bin/env bash
# Full-fidelity preflight tier: act + podman, for YAML/container fidelity.
# Invoked by scripts/local-preflight.sh --full. Exits non-zero on any failure.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
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
```

- [ ] **Step 2: Make it executable and syntax-check**

Run:
```bash
chmod +x scripts/local-preflight-full.sh
bash -n scripts/local-preflight-full.sh && echo syntax-ok
```
Expected: `syntax-ok`.

- [ ] **Step 3: Commit**

```bash
git add scripts/local-preflight-full.sh
git commit -m "feat(ci): add local-preflight-full.sh act+podman tier (WS3)"
```

---

### Task 3.3: Add `just gate` recipes

**Files:**
- Modify: `justfile`

- [ ] **Step 1: Append the gate recipes**

In `justfile`, after the `test-corelib-spine` recipe block, append:

```just

# Run the host-callable CI gates locally (fast tier, seconds). Catches lockfile
# drift, frozen-check failures, and normative-spec validation errors before push.
gate args='':
    "{{root}}/scripts/local-preflight.sh" {{args}}

# Full-fidelity run: host tier first (fail-fast), then act+podman for YAML and
# container gates. Compiler gate is SKIPped (Blacksmith Testbox only).
gate-full:
    "{{root}}/scripts/local-preflight.sh" --full
```

- [ ] **Step 2: Confirm `just` discovers them**

Run: `just --list`
Expected: the list now includes `gate` and `gate-full`.

- [ ] **Step 3: Run `just gate` green**

Run: `just gate; echo "rc=$?"`
Expected: same as Task 3.1 Step 3 (host tier OK, `rc=0`).

- [ ] **Step 4: Commit**

```bash
git add justfile
git commit -m "feat(ci): add 'just gate' and 'just gate-full' recipes (WS3)"
```

---

### Task 3.4: WS3 verification gate

- [ ] **Step 1: End-to-end host-tier run**

Run: `just gate; echo "rc=$?"`
Expected: `preflight: HOST TIER OK`, `rc=0`.

- [ ] **Step 2: Token-aware skip path**

Run with no token (already the case) and confirm the SKIP message appears for `site-build-gate`. Then, if you have a token, optionally:
```bash
NODE_AUTH_TOKEN=<token> just gate
```
and confirm the app gates run (not SKIP).

- [ ] **Step 3: Push WS3 to main**

```bash
git push origin main
```

---

## Workstream 4 — Rich reports & release artifact

### Task 4.1: Create `build-gate-report.sh` (markdown + JUnit consolidation)

**Files:**
- Create: `scripts/ci/build-gate-report.sh`
- Create: `scripts/ci/test/run-build-gate-report-tests.sh`

**Responsibility:** Pure bash + coreutils. Reads a dir of per-gate JUnit XML files, emits `gate-report.md` (human) and `gate-report.junit.xml` (consolidated machine). Must run on a clean runner with no `bun install` done yet.

- [ ] **Step 1: Write the report builder**

Create `scripts/ci/build-gate-report.sh`:

```bash
#!/usr/bin/env bash
# Build the gate report (markdown + consolidated JUnit XML) from per-gate
# JUnit files produced by the gate harness.
#
# Pure bash + coreutils — no node, no jq. Must run on a clean runner that may
# not have done 'bun install' yet (a failed install is exactly when we need it).
#
# Usage: build-gate-report.sh <junit-in-dir> <out-dir>
set -euo pipefail

IN="${1:?usage: build-gate-report.sh <junit-in-dir> <out-dir>}"
OUT="${2:?usage: build-gate-report.sh <junit-in-dir> <out-dir>}"
mkdir -p "${OUT}"

shopt -s nullglob
xmls=("${IN}"/*.xml)
if [[ ${#xmls[@]} -eq 0 ]]; then
  echo "build-gate-report: no JUnit XML found in ${IN}" >&2
  # Still emit an empty report so downstream upload-artifact has something.
  : > "${OUT}/gate-report.md"
  cat > "${OUT}/gate-report.junit.xml" <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<testsuites><testsuite name="empty" tests="0" failures="0"></testsuite></testsuites>
EOF
  exit 0
fi

# --- Consolidated JUnit: concatenate testsuites into one document. ---
{
  echo '<?xml version="1.0" encoding="UTF-8"?>'
  echo '<testsuites>'
  for f in "${xmls[@]}"; do
    # Extract each <testsuite ...>...</testsuite> block.
    sed -n '/<testsuite/,/<\/testsuite>/p' "$f"
  done
  echo '</testsuites>'
} > "${OUT}/gate-report.junit.xml"

# --- Markdown report: one section per gate (per file), tables of steps. ---
{
  echo "# Gate report"
  echo
  total_pass=0
  total_fail=0
  for f in "${xmls[@]}"; do
    suite_name="$(grep -o '<testsuite name="[^"]*"' "$f" | head -1 | sed 's/.*name="//;s/"//')"
    [[ -n "$suite_name" ]] || suite_name="$(basename "${f%.xml}")"
    tests="$(grep -o '<testsuite[^>]* tests="[0-9]*"' "$f" | head -1 | grep -o 'tests="[0-9]*"' | grep -o '[0-9]*')"
    fails="$(grep -o '<testsuite[^>]* failures="[0-9]*"' "$f" | head -1 | grep -o 'failures="[0-9]*"' | grep -o '[0-9]*')"
    tests="${tests:-0}"; fails="${fails:-0}"
    passes=$((tests - fails))
    total_pass=$((total_pass + passes))
    total_fail=$((total_fail + fails))
    badge="PASS"
    [[ "$fails" -gt 0 ]] && badge="FAIL"
    echo "## ${suite_name} — ${badge}"
    echo
    echo "| step | result |"
    echo "|---|---|"
    # Iterate <testcase> lines.
    while IFS= read -r line; do
      tc_name="$(echo "$line" | grep -o 'name="[^"]*"' | head -1 | sed 's/name="//;s/"//')"
      [[ -n "$tc_name" ]] || continue
      if echo "$line" | grep -q '<failure'; then
        echo "| ${tc_name} | FAIL |"
      else
        echo "| ${tc_name} | PASS |"
      fi
    done < <(grep '<testcase' "$f")
    echo
    # If any failures, show the captured log fragment.
    if [[ "$fails" -gt 0 ]] && grep -q '<failure' "$f"; then
      echo "<details><summary>Failure log fragments</summary>"
      echo
      # Print everything between each <failure...><![CDATA[ and ]]><
      awk '/<failure/ {inf=1} inf {print} /]]><\/failure>/ {inf=0}' "$f" \
        | sed 's/<[^>]*>//g' \
        | sed 's/^/    /'
      echo
      echo "</details>"
      echo
    fi
  done
  echo "---"
  echo
  echo "**Total:** ${total_pass} passed, ${total_fail} failed"
} > "${OUT}/gate-report.md"

echo "build-gate-report: wrote ${OUT}/gate-report.md and ${OUT}/gate-report.junit.xml"
```

- [ ] **Step 2: Make it executable**

Run: `chmod +x scripts/ci/build-gate-report.sh`

- [ ] **Step 3: Write its self-tests**

Create `scripts/ci/test/run-build-gate-report-tests.sh`:

```bash
#!/usr/bin/env bash
# Self-tests for build-gate-report.sh. Zero-dependency.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "${ROOT}"
# shellcheck source=lib/assert.sh
source "${ROOT}/scripts/ci/test/lib/assert.sh"

TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT
JIN="${TMP}/junit"; mkdir -p "${JIN}"
OUT="${TMP}/out"

# Fixture: one passing gate, one failing gate.
cat > "${JIN}/platform-smoke.xml" <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="platform-smoke" tests="1" failures="0">
    <testcase name="root-frozen-install" classname="platform-smoke" time="0.5"></testcase>
  </testsuite>
</testsuites>
EOF

cat > "${JIN}/site-build-auth.xml" <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="site-build-auth" tests="2" failures="1">
    <testcase name="auth-frozen-install" classname="site-build-auth" time="0.4"></testcase>
    <testcase name="auth-test" classname="site-build-auth" time="1.2">
      <failure message="step failed"><![CDATA[running tests...
AssertionError: expected 200 got 500]]></failure>
    </testcase>
  </testsuite>
</testsuites>
EOF

bash "${ROOT}/scripts/ci/build-gate-report.sh" "${JIN}" "${OUT}"

MD="$(cat "${OUT}/gate-report.md")"
XML="$(cat "${OUT}/gate-report.junit.xml")"

assert_file_exists "${OUT}/gate-report.md" "markdown report exists"
assert_file_exists "${OUT}/gate-report.junit.xml" "consolidated junit exists"

assert_contains "${MD}" "## platform-smoke — PASS" "md has passing gate section"
assert_contains "${MD}" "## site-build-auth — FAIL" "md has failing gate section"
assert_contains "${MD}" "| auth-test | FAIL |" "md lists failing step"
assert_contains "${MD}" "AssertionError" "md includes failure log fragment"
assert_contains "${MD}" "1 passed, 1 failed" "md has totals"

assert_contains "${XML}" "<testsuite name=\"platform-smoke\"" "xml keeps platform-smoke suite"
assert_contains "${XML}" "<testsuite name=\"site-build-auth\"" "xml keeps site-build-auth suite"

echo "== empty dir path =="
bash "${ROOT}/scripts/ci/build-gate-report.sh" "${TMP}/empty" "${OUT}-empty"
assert_file_exists "${OUT}-empty/gate-report.md" "empty dir still produces md"
assert_contains "$(cat "${OUT}-empty/gate-report.junit.xml")" "tests=\"0\"" "empty dir junit has 0 tests"

finish_tests
```

- [ ] **Step 4: Run the report-builder tests**

Run:
```bash
bash scripts/ci/test/run-build-gate-report-tests.sh
```
Expected: all `ok -` lines, `ran 11, failed 0`, exit 0.

- [ ] **Step 5: Commit**

```bash
git add scripts/ci/build-gate-report.sh scripts/ci/test/run-build-gate-report-tests.sh
git commit -m "feat(ci): add build-gate-report.sh markdown+junit builder (WS4)

Pure bash + coreutils (no node/jq) so it runs on a clean runner before any
'bun install'. Reads per-gate JUnit, emits gate-report.md (per-gate sections
with status badge + step tables + failure log fragments) and a consolidated
gate-report.junit.xml for dorny/test-reporter."
```

---

### Task 4.2: Wire the report job into `beskid-platform.yml`

**Files:**
- Modify: `.github/workflows/beskid-platform.yml`

**Responsibility:** Gate jobs upload JUnit; a final `report` job (runs on failure too) downloads, builds the report, publishes annotations + artifact.

- [ ] **Step 1: Make the smoke job emit + upload JUnit**

In `.github/workflows/beskid-platform.yml`, in the `smoke` job's steps, replace:

```yaml
      - name: Platform smoke
        run: bash ./scripts/ci/platform-smoke.sh
```

with:

```yaml
      - name: Platform smoke
        env:
          GATE_JUNIT_DIR: ${{ runner.temp }}/gate-junit
        run: bash ./scripts/ci/platform-smoke.sh

      - name: Upload gate JUnit
        if: always()
        uses: actions/upload-artifact@v6
        with:
          name: gate-junit-platform-smoke
          path: ${{ runner.temp }}/gate-junit/
          if-no-files-found: ignore
          retention-days: 14
```

- [ ] **Step 2: Add the `report` job**

At the end of the `jobs:` block (after `infra:`), append:

```yaml

  report:
    name: Gate report
    if: always()
    needs: [smoke, images, infra]
    runs-on: blacksmith-4vcpu-ubuntu-2404
    permissions:
      contents: read
      checks: write
    steps:
      - uses: actions/checkout@df4cb1c069e1874edd31b4311f1884172cec0e10 # v6

      - name: Download gate JUnit
        uses: actions/download-artifact@v6
        with:
          pattern: gate-junit-*
          path: junit
          merge-multiple: true

      - name: Build gate report
        run: bash ./scripts/ci/build-gate-report.sh junit report

      - name: Publish test annotations
        uses: dorny/test-reporter@v1
        if: always()
        with:
          name: Gate report
          path: report/gate-report.junit.xml
          reporter: java-junit

      - name: Upload gate report
        uses: actions/upload-artifact@v6
        with:
          name: gate-report
          path: report/
          retention-days: 30
```

- [ ] **Step 3: Validate YAML**

Run:
```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/beskid-platform.yml')); print('ok')"
```
Expected: `ok`.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/beskid-platform.yml
git commit -m "feat(ci): add gate report job to beskid-platform (WS4)

Smoke job now emits JUnit (GATE_JUNIT_DIR) and uploads it. A final 'report'
job runs always (even on failure), consolidates the JUnit, publishes GHA
annotations via dorny/test-reporter, and uploads the gate-report artifact."
```

---

### Task 4.3: Wire JUnit upload into `container-images.yml` and `normative-spec.yml`

**Files:**
- Modify: `.github/workflows/container-images.yml`
- Modify: `.github/workflows/normative-spec.yml`

**Responsibility:** The remaining gate-bearing workflows also emit + upload their JUnit, so a future cross-workflow report has full coverage. (For now, the `beskid-platform` report job consumes its own; these uploads are forward-compatible and consumed once a repo-level report job is added.)

- [ ] **Step 1: Add JUnit env + upload to the container-images gate steps**

In `.github/workflows/container-images.yml`, replace:

```yaml
      - name: Auth hub checks
        if: matrix.image == 'beskid-auth'
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NODE_AUTH_TOKEN }}
        run: bash ./scripts/ci/site-build-gate.sh auth "${NODE_AUTH_TOKEN}"

      - name: Platform spec checks
        if: matrix.image == 'beskid-platform-spec'
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NODE_AUTH_TOKEN }}
        run: bash ./scripts/ci/site-build-gate.sh platform-spec "${NODE_AUTH_TOKEN}"
```

with:

```yaml
      - name: Auth hub checks
        if: matrix.image == 'beskid-auth'
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NODE_AUTH_TOKEN }}
          GATE_JUNIT_DIR: ${{ runner.temp }}/gate-junit
        run: bash ./scripts/ci/site-build-gate.sh auth "${NODE_AUTH_TOKEN}"

      - name: Platform spec checks
        if: matrix.image == 'beskid-platform-spec'
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NODE_AUTH_TOKEN }}
          GATE_JUNIT_DIR: ${{ runner.temp }}/gate-junit
        run: bash ./scripts/ci/site-build-gate.sh platform-spec "${NODE_AUTH_TOKEN}"

      - name: Verify lockfiles
        if: matrix.image != 'beskid-pckg' && matrix.image != 'beskid-auth' && matrix.image != 'beskid-platform-spec'
        env:
          GATE_JUNIT_DIR: ${{ runner.temp }}/gate-junit
        run: |
          case "${{ matrix.image }}" in
            beskid-site)    bash ./scripts/ci/verify-frozen-lockfile.sh "." ;;
            beskid-tracker) bash ./scripts/ci/verify-frozen-lockfile.sh "beskid_tracker" ;;
            beskid-nexus)   bash ./scripts/ci/verify-frozen-lockfile.sh "beskid_nexus/gitnexus,beskid_nexus/gitnexus-web" ;;
            *)              bash ./scripts/ci/verify-frozen-lockfile.sh "." ;;
          esac

      - name: Upload gate JUnit
        if: always()
        uses: actions/upload-artifact@v6
        with:
          name: gate-junit-${{ matrix.image }}
          path: ${{ runner.temp }}/gate-junit/
          if-no-files-found: ignore
          retention-days: 14
```

Note: this **removes the standalone `Setup Bun` + `Verify lockfiles` block** that existed before (since we just folded Verify lockfiles above with the JUnit env). Verify by re-reading the file after the edit that the old `Setup Bun` step for `prebuild != true` still precedes the `Verify lockfiles` step. (It does — we left it untouched.)

- [ ] **Step 2: Add JUnit env + upload to normative-spec**

In `.github/workflows/normative-spec.yml`, replace:

```yaml
      - name: Validate normative workspace
        run: bun run beskid_web_common/packages/spec-core/scripts/validate-workspace.ts site/spec-content
```

with:

```yaml
      - name: Validate normative workspace
        env:
          GATE_JUNIT_DIR: ${{ runner.temp }}/gate-junit
        run: bun run beskid_web_common/packages/spec-core/scripts/validate-workspace.ts site/spec-content
```

and after the existing last step (`Smoke test CLI new node`) append:

```yaml

      - name: Upload gate JUnit
        if: always()
        uses: actions/upload-artifact@v6
        with:
          name: gate-junit-normative-spec
          path: ${{ runner.temp }}/gate-junit/
          if-no-files-found: ignore
          retention-days: 14
```

(Note: the normative `validate-workspace.ts` is not yet harness-wrapped — it is a bun TS script. Setting `GATE_JUNIT_DIR` is harmless until it emits; if it doesn't, `if-no-files-found: ignore` means the upload is a no-op. This is forward-compatible.)

- [ ] **Step 3: Validate both YAMLs**

Run:
```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/container-images.yml')); yaml.safe_load(open('.github/workflows/normative-spec.yml')); print('ok')"
```
Expected: `ok`.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/container-images.yml .github/workflows/normative-spec.yml
git commit -m "feat(ci): emit+upload gate JUnit in container-images and normative-spec (WS4)"
```

---

### Task 4.4: Attach gate report to releases

**Files:**
- Modify: `.github/workflows/release.yml`

**Responsibility:** After release images build, rebuild the report from the release run's own gate JUnit and attach `gate-report.md` (and XML) to the GitHub release.

- [ ] **Step 1: Add the gate-report job to release.yml**

In `.github/workflows/release.yml`, after the `infra-apply:` job block, append:

```yaml

  gate-report:
    name: Attach gate report to release
    needs: images
    runs-on: blacksmith-4vcpu-ubuntu-2404
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@df4cb1c069e1874edd31b4311f1884172cec0e10 # v6

      - name: Build gate report
        run: |
          # No gate JUnit is produced by the release images job today (it builds
          # images, it does not run gates). Build an explicit release-time gate
          # run so the attached report reflects real gate results.
          export GATE_JUNIT_DIR="$(mktemp -d)"
          bash ./scripts/ci/verify-frozen-lockfile.sh "." "site/website" "site/auth" "site/platform-spec" "beskid_web_common" || true
          bash ./scripts/ci/platform-smoke.sh || true
          mkdir -p report
          bash ./scripts/ci/build-gate-report.sh "${GATE_JUNIT_DIR}" report

      - name: Attach to release
        uses: softprops/action-gh-release@v2
        with:
          files: |
            report/gate-report.md
            report/gate-report.junit.xml
```

- [ ] **Step 2: Validate YAML**

Run:
```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/release.yml')); print('ok')"
```
Expected: `ok`.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/release.yml
git commit -m "feat(ci): attach gate report to releases (WS4)

Adds a gate-report job to release.yml that runs the host-callable gates
(lockfile + smoke) at release time and attaches gate-report.md and the
consolidated JUnit XML to the GitHub release. Satisfies the 'detailed gate
test report as artifact on release' requirement."
```

---

### Task 4.5: WS4 verification + final push

- [ ] **Step 1: Run the full local preflight + all self-tests**

Run:
```bash
bash scripts/ci/test/run-gate-harness-tests.sh && \
bash scripts/ci/test/run-build-gate-report-tests.sh && \
just gate
```
Expected: all three green; `just gate` ends `preflight: HOST TIER OK`.

- [ ] **Step 2: Validate every touched workflow YAML parses**

Run:
```bash
for wf in beskid-platform container-images normative-spec release; do
  python3 -c "import yaml; yaml.safe_load(open('.github/workflows/${wf}.yml'))" && echo "${wf}: ok"
done
```
Expected: four `ok` lines.

- [ ] **Step 3: Push WS4 to main**

```bash
git push origin main
```

- [ ] **Step 4: Watch the triggered run**

After push, the `beskid-platform` workflow runs. Expected:
- `smoke` job: green, uploads `gate-junit-platform-smoke`.
- `report` job (new): runs always, publishes GHA annotations, uploads `gate-report` artifact.
- Open the run → Artifacts → `gate-report` → confirm `gate-report.md` is non-empty and well-formed.

If `report` fails, the most likely cause is `dorny/test-reporter` needing `permissions: checks: write` (already added in Task 4.2) or a path mismatch — triage from the report job log.

---

## Self-review checklist (already run by the planner)

- **Spec coverage:** WS2 = §5 (harness + DRY). WS3 = §6 (just gate / --full). WS4 = §7 (reports + release artifact). §4 (WS1) already shipped in commit `60978543`. §8 data flow is realized by Tasks 4.2–4.4. §9 testing = Tasks 2.2 + 4.1. §10 sequencing respected (WS2→WS3→WS4, each its own commit). §11 risks mitigated (YAML anchors parse-checked; `if: always()` on report; `checks: write` scoped to report job only; zero-dependency bash avoids the "failed install can't run report" risk; no Bats → no vendoring awkwardness).
- **Placeholder scan:** none — every step has concrete code or an exact command.
- **Type consistency:** `gate_init` / `gate_step` / `gate_summary` / `gate_overall_rc` / `gate_emit_junit` names are used identically across Tasks 2.1, 2.3, 2.4, 2.5, 3.1. JUnit artifact names (`gate-junit-platform-smoke`, `gate-junit-${{ matrix.image }}`, `gate-junit-normative-spec`) match the download pattern `gate-junit-*` in Task 4.2.
- **Known simplification:** The release gate-report job (4.4) runs the host-callable gates fresh because the release `images` job doesn't produce gate JUnit. This is a deliberate, documented choice (the report reflects real release-time gate results) rather than reusing stale PR JUnit.
