#!/usr/bin/env bash
# Canonical platform registry, image lanes, and tag construction for AppVeyor.

readonly BESKID_PLATFORM_REGISTRY="cr.beskid-lang.org"
readonly BESKID_PLATFORM_NAMESPACE="${BESKID_PLATFORM_REGISTRY}/beskid"
readonly -a BESKID_PLATFORM_LANES=(site learn tracker nexus pckg)

BESKID_REGISTRY_SESSION_CONFIG=""
BESKID_REGISTRY_SESSION_CONFIG_PARENT=""
BESKID_REGISTRY_SESSION_LOGGED_IN=false
BESKID_REGISTRY_SESSION_CLEANED=false
BESKID_REGISTRY_SESSION_PREVIOUS_UMASK=""
BESKID_REGISTRY_SESSION_HAD_DOCKER_CONFIG=false
BESKID_REGISTRY_SESSION_PREVIOUS_DOCKER_CONFIG=""

beskid_platform_lane_is_known() {
  local candidate="$1"
  local lane
  for lane in "${BESKID_PLATFORM_LANES[@]}"; do
    [[ "${candidate}" != "${lane}" ]] || return 0
  done
  return 1
}

beskid_platform_immutable_ref() {
  local lane="$1"
  local commit_sha="$2"
  beskid_platform_lane_is_known "${lane}" || return 2
  printf '%s/%s:sha-%s\n' "${BESKID_PLATFORM_NAMESPACE}" "${lane}" "${commit_sha}"
}

beskid_platform_production_ref() {
  local lane="$1"
  beskid_platform_lane_is_known "${lane}" || return 2
  printf '%s/%s:production\n' "${BESKID_PLATFORM_NAMESPACE}" "${lane}"
}

beskid_platform_digest_prefix() {
  local lane="$1"
  beskid_platform_lane_is_known "${lane}" || return 2
  printf '%s/%s@sha256:\n' "${BESKID_PLATFORM_NAMESPACE}" "${lane}"
}

beskid_registry_session_cleanup() {
  local original_status="${1:-0}"
  local cleanup_status=0
  local command_status

  if [[ "${BESKID_REGISTRY_SESSION_CLEANED}" == "true" ]]; then
    return "${original_status}"
  fi
  BESKID_REGISTRY_SESSION_CLEANED=true
  trap - HUP INT TERM

  if [[ "${BESKID_REGISTRY_SESSION_LOGGED_IN}" == "true" ]]; then
    docker logout "${BESKID_PLATFORM_REGISTRY}" || {
      command_status=$?
      echo "Failed to log out of ${BESKID_PLATFORM_REGISTRY}" >&2
      cleanup_status="${command_status}"
    }
    BESKID_REGISTRY_SESSION_LOGGED_IN=false
  fi

  if [[ -n "${BESKID_REGISTRY_SESSION_CONFIG}" ]]; then
    case "${BESKID_REGISTRY_SESSION_CONFIG}" in
      "${BESKID_REGISTRY_SESSION_CONFIG_PARENT%/}"/beskid-docker-config.*)
        rm -rf -- "${BESKID_REGISTRY_SESSION_CONFIG}" || {
          command_status=$?
          echo "Failed to remove isolated Docker configuration" >&2
          [[ "${cleanup_status}" -ne 0 ]] || cleanup_status="${command_status}"
        }
        ;;
      *)
        echo "Refusing to remove unexpected Docker configuration path" >&2
        [[ "${cleanup_status}" -ne 0 ]] || cleanup_status=90
        ;;
    esac
  fi

  if [[ "${BESKID_REGISTRY_SESSION_HAD_DOCKER_CONFIG}" == "true" ]]; then
    DOCKER_CONFIG="${BESKID_REGISTRY_SESSION_PREVIOUS_DOCKER_CONFIG}"
    export DOCKER_CONFIG
  else
    unset DOCKER_CONFIG
  fi
  [[ -z "${BESKID_REGISTRY_SESSION_PREVIOUS_UMASK}" ]] || umask "${BESKID_REGISTRY_SESSION_PREVIOUS_UMASK}"

  if [[ "${original_status}" -ne 0 ]]; then
    return "${original_status}"
  fi
  return "${cleanup_status}"
}

beskid_registry_session_exit_trap() {
  local original_status=$?
  beskid_registry_session_cleanup "${original_status}"
}

beskid_registry_session_signal_trap() {
  local signal_status="$1"
  trap - EXIT HUP INT TERM
  set +e
  beskid_registry_session_cleanup "${signal_status}"
  exit "${signal_status}"
}

beskid_registry_session_install_traps() {
  trap 'beskid_registry_session_exit_trap' EXIT
  trap 'beskid_registry_session_signal_trap 129' HUP
  trap 'beskid_registry_session_signal_trap 130' INT
  trap 'beskid_registry_session_signal_trap 143' TERM
}

beskid_registry_login() {
  local username="$1"
  local password="$2"

  [[ -z "${BESKID_REGISTRY_SESSION_CONFIG}" ]] || {
    echo "Registry session is already initialized" >&2
    return 2
  }

  BESKID_REGISTRY_SESSION_CONFIG_PARENT="${TMPDIR:-/tmp}"
  BESKID_REGISTRY_SESSION_PREVIOUS_UMASK="$(umask)"
  if [[ "${DOCKER_CONFIG+x}" == "x" ]]; then
    BESKID_REGISTRY_SESSION_HAD_DOCKER_CONFIG=true
    BESKID_REGISTRY_SESSION_PREVIOUS_DOCKER_CONFIG="${DOCKER_CONFIG}"
  fi

  umask 077
  BESKID_REGISTRY_SESSION_CONFIG="$(mktemp -d "${BESKID_REGISTRY_SESSION_CONFIG_PARENT%/}/beskid-docker-config.XXXXXX")"
  chmod 700 "${BESKID_REGISTRY_SESSION_CONFIG}"
  DOCKER_CONFIG="${BESKID_REGISTRY_SESSION_CONFIG}"
  export DOCKER_CONFIG

  printf '%s' "${password}" | \
    docker login "${BESKID_PLATFORM_REGISTRY}" --username "${username}" --password-stdin
  BESKID_REGISTRY_SESSION_LOGGED_IN=true
}
