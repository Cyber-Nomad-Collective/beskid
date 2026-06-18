#!/usr/bin/env bash
# Set the distribution pipeline secrets on the superrepo.
#
# IMPORTANT: GitHub Actions secrets are WRITE-ONLY. There is no API or gh
# command that returns the value of an already-set secret — `gh secret list`
# shows names and timestamps only. So this script does not (and cannot) read
# existing values; it prompts you for each value and writes it under the
# correct key name via `gh secret set`.
#
# Values are read from the terminal in this process and piped straight to
# `gh secret set`. They are never echoed to the log, never written to disk,
# and not retained in shell history (read -s does not record to history in
# most shells, but to be safe, run this in a fresh terminal).
#
# Usage:
#   scripts/ci/set-distrib-secrets.sh            # interactive: prompt for all
#   scripts/ci/set-distrib-secrets.sh --only DISTRIB_GH_PAT,HOMEBREW_TAP_GIT_TOKEN
#   scripts/ci/set-distrib-secrets.sh --repo Cyber-Nomad-Collective/beskid
#
# To re-derive each value, see beskid_distrib/docs/<Platform>_Guide.md
# (or docs/distribution/SECRETS.md in the superrepo).
set -euo pipefail

REPO="Cyber-Nomad-Collective/beskid"
ONLY=""

usage() {
  sed -n '2,30p' "$0"
  exit "${1:-0}"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo) REPO="$2"; shift 2 ;;
    --only) ONLY="$2"; shift 2 ;;
    -h|--help) usage 0 ;;
    *) echo "Unknown arg: $1" >&2; usage 1 ;;
  esac
done

command -v gh >/dev/null 2>&1 || { echo "gh CLI is required (https://cli.github.com)." >&2; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "gh is not authenticated. Run: gh auth login" >&2; exit 1; }

# Secret key + a human hint pointing at the per-platform guide.
declare -a KEYS=(
  "DISTRIB_GH_PAT|Classic/fine-grained PAT, repo scope on beskid_compiler + beskid. See docs/Windows_Guide.md / Ubuntu_Guide.md."
  "HOMEBREW_TAP_GIT_TOKEN|PAT with contents:write on Cyber-Nomad-Collective/beskid_homebrew. See docs/MacOS_Guide.md."
  "AUR_SSH_PRIVATE_KEY|Full PEM of the AUR ed25519 deploy key incl. BEGIN/END lines. See docs/Arch_Guide.md."
  "AUR_USERNAME|Your AUR account name (not secret, stored as secret for editability)."
  "AUR_EMAIL|Email registered on your AUR account."
  "SNAPCRAFT_STORE_CREDENTIALS|Output of: snapcraft export-login --snaps=beskid ... See docs/Snap_Guide.md."
)

want() { [[ -z "$ONLY" ]] || [[ ",${ONLY}," == *",$1,"* ]]; }

is_multiline_secret() { [[ "$1" == "AUR_SSH_PRIVATE_KEY" ]]; }

echo "Target repo: ${REPO}"
echo "Existing secrets there:"
gh secret list --repo "$REPO" || true
echo
echo "This script will prompt for each secret value and write it via 'gh secret set'."
echo "Values are not echoed. Press Ctrl-C at any time to abort."
echo

for entry in "${KEYS[@]}"; do
  key="${entry%%|*}"; hint="${entry#*|}"
  want "$key" || continue

  echo "--------------------------------------------------------------------"
  echo "# ${key}"
  echo "# ${hint}"
  echo "--------------------------------------------------------------------"

  if is_multiline_secret "$key"; then
    # SSH keys are multiline; paste then a blank line + EOF to finish.
    echo "Paste the value (multi-line). End with a line containing only EOF:"
    value="$(sed '/^EOF$/q'; true)"
    value="${value%$'\n'EOF}"
  else
    read -r -s -p "Value (hidden): " value
    echo
  fi

  if [[ -z "${value// /}" ]]; then
    echo "Empty value for ${key} — skipping. (Re-run to set it later.)"
    echo
    continue
  fi

  printf '%s' "$value" | gh secret set "$key" --repo "$REPO"
  echo "Set ${key} on ${REPO}."
  echo
done

echo "Done. Verify with:"
echo "  gh secret list --repo ${REPO}"
