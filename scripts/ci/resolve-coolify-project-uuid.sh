#!/usr/bin/env bash
# Resolve Coolify project UUID by name (for staging after production creates the project).
set -euo pipefail

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
  echo "Coolify project '${NAME}' not found at ${BASE}" >&2
  exit 1
fi

printf '%s' "${uuid}"
