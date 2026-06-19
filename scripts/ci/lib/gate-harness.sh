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
#                    (defaults to a fresh mktemp -d if unset; gate_init creates it)

# shellcheck shell=bash
set -euo pipefail

# State for the current gate. Plain globals (no `declare -g`) so this works on
# bash 3.2 (macOS /bin/bash) as well as bash 4+. Re-sourcing is a no-op.
_GATE_STEPS=()      # "step-name" entries, in order
_GATE_RESULTS=()    # parallel: "pass" | "fail"
_GATE_DURATIONS=()  # parallel: nanosecond timestamp at step end
_GATE_INIT=0

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
  # Always return 0: failures are recorded, not propagated, so the gate runs
  # all its steps. gate_overall_rc reports the worst at the end.
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

# Emit JUnit XML iff GATE_JUNIT_DIR is set. Minimal but valid schema for
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
      # Duration: delta from the previous step's end timestamp (seconds, 3 decimals).
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
        # Tail into CDATA; split any literal ]]> so it can't terminate the block.
        tail -n 40 "$log" 2>/dev/null | sed 's/]]>/] ] >/g' || true
        echo ']]></failure>'
      fi
      echo '    </testcase>'
    done
    echo '  </testsuite>'
    echo '</testsuites>'
  } >"$out"
}
