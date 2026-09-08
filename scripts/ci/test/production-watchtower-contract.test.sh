#!/usr/bin/env bash
# Production-only Compose contract for the Beskid registry + Watchtower runtime.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
compose="${ROOT}/beskid_sites/deploy/docker-compose.yml"
registry_config="${ROOT}/beskid_sites/deploy/registry/config.yml"
env_example="${ROOT}/beskid_sites/deploy/.env.example"
deploy_script="${ROOT}/beskid_sites/deploy/deploy.sh"
branding_script="${ROOT}/beskid_sites/deploy/authentik-branding.py"
sites_gitignore="${ROOT}/beskid_sites/.gitignore"

require() {
  rg -Fq "$1" "$2" || { echo "missing required value in $2: $1" >&2; exit 1; }
}

forbid() {
  if rg -qi "$1" "$2"; then
    echo "forbidden production deployment reference in $2: $1" >&2
    exit 1
  fi
}

service_block() {
  local service="$1"
  awk -v service="${service}" '
    $0 == "  " service ":" { found = 1; next }
    found && /^  [[:alnum:]_-]+:$/ { exit }
    found { print }
  ' "$compose"
}

require_public_service() {
  local service="$1"
  local upstream="$2"
  local block
  block="$(service_block "${service}")"

  [[ -n "${block}" ]] || { echo "missing ${service} service block" >&2; exit 1; }
  [[ "${block}" == *"caddy_0.reverse_proxy: \"{{upstreams ${upstream}}}\""* ]] || {
    echo "${service} must route directly through Caddy" >&2
    exit 1
  }
  [[ "${block}" != *"authentik-forward-auth"* && "${block}" != *"forward_auth"* ]] || {
    echo "${service} must remain publicly reachable without Authentik" >&2
    exit 1
  }
}

require_protected_service() {
  local service="$1"
  local block
  block="$(service_block "${service}")"

  [[ "${block}" == *"<<: *authentik-forward-auth"* ]] || {
    echo "${service} must retain the Authentik edge policy" >&2
    exit 1
  }
}

require 'watchtower:' "$compose"
require 'containrrr/watchtower:' "$compose"
require 'registry:2.8' "$compose"
require 'BESKID_EDGE_NETWORK' "$compose"
require 'external: true' "$compose"
require 'caddy_ingress_network: ${BESKID_EDGE_NETWORK:?set BESKID_EDGE_NETWORK}' "$compose"
require 'caddy_0: https://cr.beskid-lang.org' "$compose"
require 'caddy_0.reverse_proxy: "{{upstreams 5000}}"' "$compose"
require 'registry-data:' "$compose"
require 'name: beskid-registry-data' "$compose"
require 'external: true' "$compose"

forbid '^  auth:' "$compose"
forbid '^  authelia:' "$compose"
forbid '^  community:' "$compose"
require './registry/htpasswd:/auth/htpasswd:ro' "$compose"
require "grep -q '401 Unauthorized'" "$compose"
require 'htpasswd:' "$registry_config"
require 'path: /auth/htpasswd' "$registry_config"
require 'registry/htpasswd' "$deploy_script"
require 'chmod 600 ${REMOTE_DIR}/registry/htpasswd' "$deploy_script"
require 'https://cr.beskid-lang.org/v2/' "$deploy_script"
require 'authentication challenge' "$deploy_script"
require 'deploy/registry/htpasswd' "$sites_gitignore"

for service in website learn tracker nexus pckg; do
  require "  ${service}:" "$compose"
  require "com.centurylinklabs.watchtower.enable: \"true\"" "$compose"
done

require '  authentik-postgresql:' "$compose"
require '  authentik-server:' "$compose"
require '  authentik-worker:' "$compose"
require 'ghcr.io/goauthentik/server:2025.10.4' "$compose"
require 'caddy_0.redir_0: /login https://learn.beskid-lang.org/ 302' "$compose"
[[ -f "$branding_script" ]] || { echo "missing Authentik branding configuration: $branding_script" >&2; exit 1; }
require 'Beskid Żywiecki' "$branding_script"
require 'learn' "$branding_script"
require 'authentik-branding.py' "$deploy_script"
require 'b64decode' "$deploy_script"
require 'AUTHENTIK_POSTGRES_PASSWORD' "$env_example"
require 'AUTHENTIK_SECRET_KEY' "$env_example"
require 'AUTHENTIK_BOOTSTRAP_TOKEN' "$env_example"
require 'GITHUB_CLIENT_ID' "$env_example"
require 'GITHUB_CLIENT_SECRET' "$env_example"
require 'caddy_0.route.0_reverse_proxy: /outpost.goauthentik.io/* authentik-server:9000' "$compose"
require 'caddy_0.route.1_forward_auth: authentik-server:9000' "$compose"
require 'caddy_0.route.1_forward_auth.uri: /outpost.goauthentik.io/auth/caddy' "$compose"
require_public_service website 80
require_public_service learn 80
require_public_service pckg 8082
require_protected_service tracker
require_protected_service nexus
forbid 'AUTHELIA_' "$env_example"

forbid 'coolify' "$compose"
forbid 'staging' "$compose"
forbid 'platform-spec' "$compose"
forbid 'ghcr\.io/cyber-nomad-collective/beskid-' "$compose"
if [[ -e "${ROOT}/beskid_sites/deploy/Caddyfile" ]]; then
  echo 'Beskid must not own a second Caddy edge while using the shared host edge' >&2
  exit 1
fi

echo 'production Watchtower Compose contract OK'
