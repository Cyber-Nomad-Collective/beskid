#!/usr/bin/env bash
# Beskid platform — SSH deploy to root@bdziam.dev.
#
# Ships the production Caddy, registry, and Watchtower stack to the deploy
# host, populates .env from OpenBao, and applies the single Compose source.
#
# Usage:
#   ./deploy.sh                       # interactive: prompt for missing secrets
#   ./deploy.sh --from-openbao        # populate .env from OpenBao
#   ./deploy.sh --no-deploy           # render + ship only, do not start
#   ./deploy.sh --smoke-only          # run smoke checks against running stack
#
# Prerequisites (human admin — fail closed):
#   - SSH key for root@bdziam.dev.
#   - DNS for all *.beskid-lang.org subdomains pointing at the host (or
#     ready to flip per-domain during cutover).
#   - OpenBao token (OPENBAO_TOKEN) if using --from-openbao.
#   - deploy/.env populated (or --from-openbao).
#
# This script does NOT invent registry accounts or secret values. Missing
# required secrets fail closed with an exact human admin step.

set -euo pipefail

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
DEPLOY_HOST="${DEPLOY_HOST:-root@bdziam.dev}"
REMOTE_DIR="${REMOTE_DIR:-/opt/beskid}"
OPENBAO_ADDR="${OPENBAO_ADDR:-https://secrets.bdziam.dev}"
OPENBAO_PREFIX="secret/beskid/production"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env"

FROM_OPENBAO=0
NO_DEPLOY=0
SMOKE_ONLY=0

for arg in "$@"; do
  case "$arg" in
    --from-openbao) FROM_OPENBAO=1 ;;
    --no-deploy) NO_DEPLOY=1 ;;
    --smoke-only) SMOKE_ONLY=1 ;;
    *) echo "unknown arg: $arg" >&2; exit 2 ;;
  esac
done

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
log() { printf '\033[1;34m[deploy]\033[0m %s\n' "$*"; }
err() { printf '\033[1;31m[deploy:ERROR]\033[0m %s\n' "$*" >&2; }
need() { [ -n "${!1:-}" ] || { err "missing required var: $1 — $2"; exit 1; }; }

remote() {
  if [[ -n "${SSH_OPTS:-}" ]]; then
    # SSH_OPTS is operator-controlled whitespace-separated SSH options.
    # shellcheck disable=SC2086
    ssh ${SSH_OPTS} "${DEPLOY_HOST}" "$@"
  else
    ssh "${DEPLOY_HOST}" "$@"
  fi
}

# ---------------------------------------------------------------------------
# Smoke checks (mirror scripts/ci/post-deploy-smoke.sh shape, no :port)
# ---------------------------------------------------------------------------
smoke() {
  log "smoke checks against https://*.beskid-lang.org"
  local failures=0
  local endpoints=(
    "https://beskid-lang.org/|beskid-lang.org homepage"
    "https://tracker.beskid-lang.org/api/health|tracker health"
    "https://nexus.beskid-lang.org/api/health|nexus health"
    "https://pckg.beskid-lang.org/health/ready|pckg health"
    "https://learn.beskid-lang.org/api/health|learn health"
    "https://cr.beskid-lang.org/v2/|registry v2"
  )
  for entry in "${endpoints[@]}"; do
    local url="${entry%%|*}"
    local name="${entry##*|}"
    local code
    code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$url" || echo "000")"
    if [ "$url" = "https://cr.beskid-lang.org/v2/" ] && [ "$code" -eq 401 ]; then
      log "  OK   $name ($url) → $code (authentication challenge)"
    elif [ "$code" -ge 200 ] && [ "$code" -lt 400 ]; then
      log "  OK   $name ($url) → $code"
    else
      log "  FAIL $name ($url) → $code"
      failures=$((failures + 1))
    fi
  done
  if [ "$failures" -gt 0 ]; then
    err "$failures smoke check(s) failed — see above. Roll back via README."
    return 1
  fi
  log "all smoke checks passed"
}

if [ "$SMOKE_ONLY" -eq 1 ]; then
  smoke
  exit $?
fi

# ---------------------------------------------------------------------------
# 1. Validate local prerequisites
# ---------------------------------------------------------------------------
log "validating local prerequisites"
[ -f "${SCRIPT_DIR}/docker-compose.yml" ] || { err "missing docker-compose.yml"; exit 1; }
[ -f "${SCRIPT_DIR}/registry/config.yml" ] || { err "missing registry/config.yml"; exit 1; }
[ -s "${SCRIPT_DIR}/registry/htpasswd" ] || { err "missing registry/htpasswd — generate it with htpasswd -Bbn <user> <password> > registry/htpasswd"; exit 1; }
[ -f "${SCRIPT_DIR}/authentik-branding.py" ] || { err "missing authentik-branding.py"; exit 1; }

# ---------------------------------------------------------------------------
# 2. Populate .env
# ---------------------------------------------------------------------------
if [ "$FROM_OPENBAO" -eq 1 ]; then
  log "populating .env from OpenBao (${OPENBAO_ADDR})"
  need OPENBAO_TOKEN "set OPENBAO_TOKEN (from secret/beskid/openbao/token)"
  need BESKID_EDGE_NETWORK "set the existing shared host edge network name"
  command -v bao >/dev/null || command -v vault >/dev/null || {
    err "openbao/vault CLI not found — install it to use --from-openbao"; exit 1; }
  BAO_BIN="$(command -v bao || command -v vault)"

  # Start from the example (non-secret defaults), then overlay OpenBao.
  cp "${SCRIPT_DIR}/.env.example" "${ENV_FILE}"
  printf 'BESKID_EDGE_NETWORK=%s\n' "${BESKID_EDGE_NETWORK}" >> "${ENV_FILE}"

  read_secrets() {
    local path="$1"; shift
    "$BAO_BIN" read -address="${OPENBAO_ADDR}" -format=json "${OPENBAO_PREFIX}/${path}" \
      | jq -r '.data.data | to_entries[] | "\(.key)=\(.value)"' 2>/dev/null || true
  }

  # Per-service OpenBao paths (mirror beskid_infra/docs/openbao-layout.md).
  for svc in postgres tracker nexus pckg learn authentik; do
    read_secrets "$svc" >> "${ENV_FILE}" || true
  done
  read_secrets registry >> "${ENV_FILE}" || true
  log "  .env populated from OpenBao (review before deploy)"
else
  if [ ! -f "${ENV_FILE}" ]; then
    err ".env missing. Either: ./deploy.sh --from-openbao, or cp .env.example .env and fill in secrets."
    exit 1
  fi
  log "using existing .env"
fi

# Fail closed on required secrets.
# shellcheck disable=SC1090
set -a; . "${ENV_FILE}"; set +a
need BESKID_EDGE_NETWORK "shared host edge network name"
[[ "${BESKID_EDGE_NETWORK}" =~ ^[A-Za-z0-9_.-]+$ ]] && [[ "${BESKID_EDGE_NETWORK}" != replace-* ]] || {
  err "BESKID_EDGE_NETWORK must name an existing shared host edge network"
  exit 1
}
need REGISTRY_USERNAME "registry account used by AppVeyor and Watchtower"
need REGISTRY_PASSWORD "registry password used by AppVeyor and Watchtower"
need POSTGRES_PASSWORD "shared Postgres password"
need SITE_IMAGE_TAG "website image tag (production)"
need TRACKER_IMAGE_TAG "tracker image tag (production)"
need NEXUS_IMAGE_TAG "nexus image tag (production)"
need PCKG_IMAGE_TAG "pckg image tag (production)"
need LEARN_IMAGE_TAG "learn image tag (production)"
need AUTHENTIK_POSTGRES_PASSWORD "Authentik database password"
need AUTHENTIK_SECRET_KEY "Authentik secret key"
need AUTHENTIK_BOOTSTRAP_TOKEN "Authentik bootstrap API token"
need GITHUB_CLIENT_ID "GitHub OAuth client ID for Authentik"
need GITHUB_CLIENT_SECRET "GitHub OAuth client secret for Authentik"
for image_tag in "$SITE_IMAGE_TAG" "$TRACKER_IMAGE_TAG" "$NEXUS_IMAGE_TAG" "$PCKG_IMAGE_TAG" "$LEARN_IMAGE_TAG"; do
  [[ "${image_tag}" == production ]] || { err "all application image tags must be production for Watchtower"; exit 1; }
done

# ---------------------------------------------------------------------------
# 3. Ship files to the deploy host
# ---------------------------------------------------------------------------
WATCHTOWER_CONFIG="$(mktemp)"
trap 'rm -f "${WATCHTOWER_CONFIG}"' EXIT
REGISTRY_AUTH="$(printf '%s:%s' "${REGISTRY_USERNAME}" "${REGISTRY_PASSWORD}" | base64 | tr -d '\n')"
jq -n --arg auth "${REGISTRY_AUTH}" \
  '{auths: {"cr.beskid-lang.org": {auth: $auth}}}' > "${WATCHTOWER_CONFIG}"
chmod 600 "${WATCHTOWER_CONFIG}"

log "shipping files to ${DEPLOY_HOST}:${REMOTE_DIR}"
remote "docker network inspect ${BESKID_EDGE_NETWORK} >/dev/null" || {
  err "BESKID_EDGE_NETWORK does not exist on ${DEPLOY_HOST}: ${BESKID_EDGE_NETWORK}"
  exit 1
}
remote "mkdir -p ${REMOTE_DIR}/registry ${REMOTE_DIR}/watchtower"

scp -q "${SCRIPT_DIR}/docker-compose.yml" "${DEPLOY_HOST}:${REMOTE_DIR}/docker-compose.yml"
scp -q "${SCRIPT_DIR}/registry/config.yml" "${DEPLOY_HOST}:${REMOTE_DIR}/registry/config.yml"
scp -q "${SCRIPT_DIR}/registry/htpasswd" "${DEPLOY_HOST}:${REMOTE_DIR}/registry/htpasswd"
remote "chmod 600 ${REMOTE_DIR}/registry/htpasswd"
scp -q "${WATCHTOWER_CONFIG}" "${DEPLOY_HOST}:${REMOTE_DIR}/watchtower/config.json"
remote "chmod 600 ${REMOTE_DIR}/watchtower/config.json"
# Ship .env with restricted perms.
scp -q "${ENV_FILE}" "${DEPLOY_HOST}:${REMOTE_DIR}/.env"
remote "chmod 600 ${REMOTE_DIR}/.env"

# ---------------------------------------------------------------------------
# 4. Apply (or render-only)
# ---------------------------------------------------------------------------
if [ "$NO_DEPLOY" -eq 1 ]; then
  log "--no-deploy: files shipped, not starting. Run without the flag to apply."
  exit 0
fi

log "running: docker compose up -d --wait"
remote "cd ${REMOTE_DIR} && docker compose up -d --wait"

log "applying the declarative Authentik brand and application aliases"
AUTHENTIK_BRANDING_B64="$(base64 < "${SCRIPT_DIR}/authentik-branding.py" | tr -d '\n')"
remote "cd ${REMOTE_DIR} && docker compose exec -T authentik-server ak shell -c \"exec(__import__('base64').b64decode('${AUTHENTIK_BRANDING_B64}'))\""

# ---------------------------------------------------------------------------
# 6. Verify health
# ---------------------------------------------------------------------------
log "verifying container health"
remote "cd ${REMOTE_DIR} && docker compose ps --format 'table {{.Name}}\t{{.Status}}' && docker compose ps --status running watchtower | grep -q watchtower"

# ---------------------------------------------------------------------------
# 7. Smoke checks
# ---------------------------------------------------------------------------
log "waiting 10s for Caddy to obtain TLS certs before smoke checks"
sleep 10
smoke

log "production Watchtower runtime is active. Roll back an application by moving its production registry tag to a retained sha-<commit> image."
