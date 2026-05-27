# Map git branch → OpenTofu / OpenBao lane (production | staging).
# Canonical copy for superrepo CI; kept in sync with beskid_infra/scripts/lib/git-tofu-env.sh.
# shellcheck shell=bash

beskid_git_branch() {
  if [[ -n "${GITHUB_EVENT_NAME:-}" && "${GITHUB_EVENT_NAME}" == "pull_request" ]]; then
    printf '%s' "${GITHUB_BASE_REF:?GITHUB_BASE_REF required on pull_request}"
    return 0
  fi
  if [[ -n "${GITHUB_REF_NAME:-}" ]]; then
    printf '%s' "${GITHUB_REF_NAME}"
    return 0
  fi
  git rev-parse --abbrev-ref HEAD 2>/dev/null
}

beskid_tofu_env_from_git() {
  local branch
  branch="$(beskid_git_branch)" || true
  [[ -n "${branch}" ]] || {
    echo "Could not determine git branch (not in a git checkout?)" >&2
    return 1
  }

  case "${branch}" in
    main) printf '%s' "production" ;;
    stg) printf '%s' "staging" ;;
    *)
      echo "Branch '${branch}' has no OpenTofu lane (use main → production, stg → staging)" >&2
      return 1
      ;;
  esac
}

beskid_assert_tofu_env() {
  local expected="$1"
  local actual
  actual="$(beskid_tofu_env_from_git)" || return 1
  if [[ "${actual}" != "${expected}" ]]; then
    echo "Current branch maps to '${actual}', not '${expected}' (checkout main or stg)" >&2
    return 1
  fi
}
