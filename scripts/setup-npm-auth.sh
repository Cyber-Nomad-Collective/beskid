#!/usr/bin/env bash
# Configure GitHub Packages auth for bun/npm using the gh CLI token.
#
# Writes ~/.npmrc (user scope) and root .env (gitignored, for tools that read it).
# Project .npmrc keeps ${NODE_AUTH_TOKEN} for CI; local installs use ~/.npmrc.
#
# Usage:
#   ./scripts/setup-npm-auth.sh
#   source ./scripts/setup-npm-auth.sh   # exports NODE_AUTH_TOKEN for this shell
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${ROOT}"

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI is required. Install: https://cli.github.com/" >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Not logged in to GitHub. Run: gh auth login" >&2
  exit 1
fi

if ! gh auth status 2>&1 | grep -qE 'read:packages|write:packages'; then
  echo "Refreshing gh token with read:packages scope..."
  gh auth refresh -s read:packages -h github.com
fi

TOKEN="$(gh auth token)"

PROJECT_NPMRC="${ROOT}/.npmrc"
if [[ ! -f "${PROJECT_NPMRC}" ]]; then
  cat >"${PROJECT_NPMRC}" <<'EOF'
@cyber-nomad-collective:registry=https://npm.pkg.github.com
@beskid:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
EOF
  echo "Created ${PROJECT_NPMRC}"
fi

USER_NPMRC="${HOME}/.npmrc"
TMP="$(mktemp)"
if [[ -f "${USER_NPMRC}" ]]; then
  grep -v '^@cyber-nomad-collective:registry=' "${USER_NPMRC}" \
    | grep -v '^@beskid:registry=' \
    | grep -v '^//npm\.pkg\.github\.com/:_authToken=' \
    >"${TMP}" || true
else
  : >"${TMP}"
fi
{
  cat "${TMP}"
  printf '%s\n' \
    '@cyber-nomad-collective:registry=https://npm.pkg.github.com' \
    '@beskid:registry=https://npm.pkg.github.com' \
    "//npm.pkg.github.com/:_authToken=${TOKEN}"
} >"${USER_NPMRC}"
rm -f "${TMP}"

ENV_FILE="${ROOT}/.env"
touch "${ENV_FILE}"
if grep -q '^NODE_AUTH_TOKEN=' "${ENV_FILE}" 2>/dev/null; then
  if [[ "$(uname)" == Darwin ]]; then
    sed -i '' "s|^NODE_AUTH_TOKEN=.*|NODE_AUTH_TOKEN=${TOKEN}|" "${ENV_FILE}"
  else
    sed -i "s|^NODE_AUTH_TOKEN=.*|NODE_AUTH_TOKEN=${TOKEN}|" "${ENV_FILE}"
  fi
else
  printf 'NODE_AUTH_TOKEN=%s\n' "${TOKEN}" >>"${ENV_FILE}"
fi

export NODE_AUTH_TOKEN="${TOKEN}"

echo "GitHub Packages auth configured via gh CLI."
echo "  user:   ${USER_NPMRC}"
echo "  project: ${PROJECT_NPMRC} (uses \${NODE_AUTH_TOKEN} for CI)"
echo "  env:    ${ENV_FILE} (gitignored)"
echo ""
echo "Run: bun install"
