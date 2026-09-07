#!/usr/bin/env bash
# Production-only Compose contract for the Beskid registry + Watchtower runtime.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
compose="${ROOT}/beskid_sites/deploy/docker-compose.yml"
registry_config="${ROOT}/beskid_sites/deploy/registry/config.yml"
env_example="${ROOT}/beskid_sites/deploy/.env.example"
authelia_config="${ROOT}/beskid_sites/deploy/authelia/configuration.yml"
deploy_script="${ROOT}/beskid_sites/deploy/deploy.sh"

require() {
  rg -Fq "$1" "$2" || { echo "missing required value in $2: $1" >&2; exit 1; }
}

forbid() {
  if rg -qi "$1" "$2"; then
    echo "forbidden production deployment reference in $2: $1" >&2
    exit 1
  fi
}

require 'watchtower:' "$compose"
require 'containrrr/watchtower:' "$compose"
require 'registry:2.8' "$compose"
require 'REGISTRY_AUTH: htpasswd' "$compose"
require 'REGISTRY_AUTH_HTPASSWD_REALM: Beskid registry' "$compose"
require 'auth:' "$registry_config"
require 'htpasswd:' "$registry_config"
require 'BESKID_EDGE_NETWORK' "$compose"
require 'external: true' "$compose"
require 'caddy_ingress_network: ${BESKID_EDGE_NETWORK:?set BESKID_EDGE_NETWORK}' "$compose"
require 'caddy_0: https://cr.beskid-lang.org' "$compose"
require 'caddy_0.reverse_proxy: "{{upstreams 5000}}"' "$compose"
require 'encryption_key: ${AUTHELIA_STORAGE_ENCRYPTION_KEY}' "$authelia_config"
require 'need AUTHELIA_POSTGRES_DB ' "$deploy_script"

# The committed template must enumerate every required runtime secret. This
# keeps the deploy script and the operator-facing configuration in lockstep.
for variable in \
  AUTHELIA_POSTGRES_DB \
  AUTHELIA_SESSION_SECRET \
  AUTHELIA_STORAGE_ENCRYPTION_KEY \
  AUTHELIA_OIDC_HMAC_SECRET \
  AUTHELIA_OIDC_JWKS_SECRET \
  WEBSITE_OIDC_CLIENT_SECRET \
  TRACKER_OIDC_CLIENT_SECRET \
  NEXUS_OIDC_CLIENT_SECRET \
  PCKG_OIDC_CLIENT_SECRET; do
  require "${variable}=" "$env_example"
done
require 'LEARN_OIDC_CLIENT_SECRET=' "$env_example"
require 'COMMUNITY_OIDC_CLIENT_SECRET=' "$env_example"
forbid 'platform-spec' "$authelia_config"

for service in website auth learn tracker nexus pckg; do
  require "  ${service}:" "$compose"
  require "com.centurylinklabs.watchtower.enable: \"true\"" "$compose"
done

forbid 'coolify' "$compose"
forbid 'staging' "$compose"
forbid 'platform-spec' "$compose"
forbid 'ghcr\.io/cyber-nomad-collective/beskid-' "$compose"
if [[ -e "${ROOT}/beskid_sites/deploy/Caddyfile" ]]; then
  echo 'Beskid must not own a second Caddy edge while using the shared host edge' >&2
  exit 1
fi

echo 'production Watchtower Compose contract OK'
