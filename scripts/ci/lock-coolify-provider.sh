#!/usr/bin/env bash
# Record arcusis/coolify 1.1.18-beskid checksums in .terraform.lock.hcl (filesystem mirror).
# Run after install-coolify-provider.sh and whenever vendor/provider sources change.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
install="${repo_root}/scripts/ci/install-coolify-provider.sh"
lock_platforms="${LOCK_PLATFORMS:-linux_amd64 darwin_arm64}"

chmod +x "${install}"
"${install}"

export TF_CLI_CONFIG_FILE="${repo_root}/beskid_infra/terraform.tofurc.generated"
mirror="${HOME}/.terraform.d/plugins"

for env_dir in "${repo_root}/beskid_infra/environments/production" "${repo_root}/beskid_infra/environments/staging"; do
  echo "Updating Coolify lock in ${env_dir}..."
  (
    cd "${env_dir}"
    args=()
    for p in ${lock_platforms}; do
      args+=("-platform=${p}")
    done
    tofu providers lock "${args[@]}" \
      -fs-mirror="${mirror}" \
      registry.terraform.io/arcusis/coolify
  )
done

echo "Done. Commit beskid_infra/environments/*/.terraform.lock.hcl if hashes changed."
