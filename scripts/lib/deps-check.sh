# Read repo-deps.json and check/install tools.
# shellcheck shell=bash

beskid_repo_root() {
  local script_dir
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
  printf '%s' "${script_dir}"
}

beskid_deps_json() {
  local root
  root="$(beskid_repo_root)"
  printf '%s/repo-deps.json' "${root}"
}

beskid_tool_bins() {
  local tool="$1"
  local json="$2"
  jq -r --arg t "${tool}" '.tools[$t].bins[]' "${json}"
}

beskid_tool_bins_any() {
  local tool="$1"
  local json="$2"
  jq -r --arg t "${tool}" '.tools[$t].bins_any // false' "${json}"
}

beskid_tool_description() {
  local tool="$1"
  local json="$2"
  jq -r --arg t "${tool}" '.tools[$t].description // $t' "${json}"
}

beskid_group_tools() {
  local group="$1"
  local json="$2"
  jq -r --arg g "${group}" '.groups[$g].tools[]?' "${json}"
}

beskid_list_groups() {
  local json="$1"
  jq -r '.groups | keys[]' "${json}"
}

beskid_tool_installed() {
  local tool="$1"
  local json="$2"
  local any
  any="$(beskid_tool_bins_any "${tool}" "${json}")"
  local bin
  if [[ "${any}" == "true" ]]; then
    while IFS= read -r bin; do
      [[ -z "${bin}" ]] && continue
      if command -v "${bin}" >/dev/null 2>&1; then
        return 0
      fi
    done < <(beskid_tool_bins "${tool}" "${json}")
    return 1
  fi
  while IFS= read -r bin; do
    [[ -z "${bin}" ]] && continue
    command -v "${bin}" >/dev/null 2>&1 || return 1
  done < <(beskid_tool_bins "${tool}" "${json}")
  return 0
}

beskid_tool_version_line() {
  local tool="$1"
  local json="$2"
  local cmd=()
  while IFS= read -r part; do
    [[ -n "${part}" ]] && cmd+=("${part}")
  done < <(jq -r --arg t "${tool}" '.tools[$t].version_cmd[]?' "${json}")

  if [[ ${#cmd[@]} -eq 0 ]]; then
    local bin
    bin="$(beskid_tool_bins "${tool}" "${json}" | head -n1)"
    cmd=("${bin}" "--version")
  fi

  if command -v "${cmd[0]}" >/dev/null 2>&1; then
    "${cmd[@]}" 2>/dev/null | head -n1
  else
    echo "(not installed)"
  fi
}

beskid_install_tool() {
  local tool="$1"
  local json="$2"
  local os="${BESKID_OS}"

  local methods_count
  methods_count="$(jq -r --arg t "${tool}" --arg os "${os}" '.tools[$t].install[$os] | length' "${json}")"
  if [[ "${methods_count}" == "0" || "${methods_count}" == "null" ]]; then
    die "No install methods for ${tool} on ${os}"
  fi

  local i=0
  local method_json
  while [[ "${i}" -lt "${methods_count}" ]]; do
    method_json="$(jq -c --arg t "${tool}" --arg os "${os}" --argjson i "${i}" \
      '.tools[$t].install[$os][$i|tonumber]' "${json}")"
    local method
    method="$(jq -r '.method' <<<"${method_json}")"
    if ! beskid_method_available "${method}"; then
      note "Skip ${method} (not available on host)"
      i=$((i + 1))
      continue
    fi
    section "Install ${tool} via ${method}"
    if beskid_run_install_method "${method_json}"; then
      if beskid_tool_installed "${tool}" "${json}"; then
        ok "${tool} installed"
        return 0
      fi
      warn "${tool}: ${method} finished but binary still missing — check PATH"
      return 0
    fi
    warn "${method} failed for ${tool}"
    i=$((i + 1))
  done
  return 1
}
