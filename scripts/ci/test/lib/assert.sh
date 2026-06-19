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
