#!/usr/bin/env bash
# Resolve Coolify project UUID by name (GET /api/v1/projects).
# Usage: resolve-coolify-project-uuid.sh [--optional]
#   --optional  exit 0 with empty stdout when not found (for import / adopt flows)
set -euo pipefail

optional=false
if [[ "${1:-}" == "--optional" ]]; then
  optional=true
fi

: "${COOLIFY_ENDPOINT:?Set COOLIFY_ENDPOINT}"
: "${COOLIFY_API_TOKEN:?Set COOLIFY_API_TOKEN}"

NAME="${COOLIFY_PROJECT_NAME:-Beskid}"
BASE="${COOLIFY_ENDPOINT%/}"

uuid="$(
  curl -fsSL "${BASE}/api/v1/projects" \
    -H "Authorization: Bearer ${COOLIFY_API_TOKEN}" \
    -H "Accept: application/json" \
    | jq -r --arg n "${NAME}" '.[] | select(.name == $n) | .uuid' \
    | head -n1
)"

if [[ -z "${uuid}" || "${uuid}" == "null" ]]; then
  if [[ "${optional}" == "true" ]]; then
    exit 0
  fi
  echo "Coolify project '${NAME}' not found at ${BASE}" >&2
  exit 1
fi

printf '%s' "${uuid}"
