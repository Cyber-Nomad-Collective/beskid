#!/usr/bin/env bash
# Adopt an existing Coolify project into OpenTofu state (avoids duplicate POST on re-apply).
# Run after `tofu init` in the target environment. Requires COOLIFY_* and a configured backend.
set -euo pipefail

env_name="${1:-production}"
resource_addr='coolify_project.beskid[0]'

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
env_dir="${repo_root}/beskid_infra/environments/${env_name}"

if [[ ! -d "${env_dir}" ]]; then
  echo "Unknown environment directory: ${env_dir}" >&2
  exit 1
fi

resolve="${repo_root}/scripts/ci/resolve-coolify-project-uuid.sh"
chmod +x "${resolve}"

uuid="$("${resolve}" --optional)"
if [[ -z "${uuid}" ]]; then
  echo "No Coolify project named '${COOLIFY_PROJECT_NAME:-Beskid}'; OpenTofu will create ${resource_addr}."
  exit 0
fi

cd "${env_dir}"

if tofu state show "${resource_addr}" >/dev/null 2>&1; then
  echo "${resource_addr} already in state."
  exit 0
fi

echo "Importing Coolify project ${uuid} -> ${resource_addr}"
tofu import -input=false "${resource_addr}" "${uuid}"
