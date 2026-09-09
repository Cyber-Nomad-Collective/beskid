#!/usr/bin/env bash
# Shared trust predicate for every mutating AppVeyor publication path.

appveyor_flag_is_true() {
  case "${1:-}" in
    [Tt][Rr][Uu][Ee]) return 0 ;;
    *) return 1 ;;
  esac
}

appveyor_is_trusted_main_push() {
  [[ "${APPVEYOR_REPO_BRANCH:-}" == "main" ]] &&
    [[ -z "${APPVEYOR_PULL_REQUEST_NUMBER:-}" ]] &&
    ! appveyor_flag_is_true "${APPVEYOR_REPO_TAG:-}" &&
    ! appveyor_flag_is_true "${APPVEYOR_FORCED_BUILD:-}" &&
    ! appveyor_flag_is_true "${APPVEYOR_SCHEDULED_BUILD:-}"
}
