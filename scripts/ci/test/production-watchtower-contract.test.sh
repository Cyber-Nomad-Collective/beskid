#!/usr/bin/env bash
# Production-only Compose contract for the Beskid registry + Watchtower runtime.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
compose="${ROOT}/beskid_sites/deploy/docker-compose.yml"
registry_config="${ROOT}/beskid_sites/deploy/registry/config.yml"
env_example="${ROOT}/beskid_sites/deploy/.env.example"
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
require 'BESKID_EDGE_NETWORK' "$compose"
require 'external: true' "$compose"
require 'caddy_ingress_network: ${BESKID_EDGE_NETWORK:?set BESKID_EDGE_NETWORK}' "$compose"
require 'caddy_0: https://cr.beskid-lang.org' "$compose"
require 'caddy_0.reverse_proxy: "{{upstreams 5000}}"' "$compose"
require 'registry-data:' "$compose"
require 'name: beskid-registry-data' "$compose"
require 'external: true' "$compose"

forbid '^  auth:' "$compose"
forbid '^  community:' "$compose"
require '  authelia:' "$compose"
require 'authelia/authelia:4.39.20' "$compose"
require 'AUTHELIA_SESSION_SECRET' "$env_example"
require 'AUTHELIA_STORAGE_ENCRYPTION_KEY' "$env_example"

for service in website learn tracker nexus pckg; do
  require "  ${service}:" "$compose"
  require "com.centurylinklabs.watchtower.enable: \"true\"" "$compose"
done

require 'caddy_0.forward_auth: authelia:9091' "$compose"
require 'caddy_0.forward_auth.uri: /api/authz/forward-auth' "$compose"

forbid 'coolify' "$compose"
forbid 'staging' "$compose"
forbid 'platform-spec' "$compose"
forbid 'ghcr\.io/cyber-nomad-collective/beskid-' "$compose"
if [[ -e "${ROOT}/beskid_sites/deploy/Caddyfile" ]]; then
  echo 'Beskid must not own a second Caddy edge while using the shared host edge' >&2
  exit 1
fi

echo 'production Watchtower Compose contract OK'
