#!/usr/bin/env bash
# Create Cyber-Nomad-Collective/beskid_vscode on GitHub (if missing) and push main.
# Requires: gh auth login, or GH_TOKEN with repo scope.
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"
EXT="${ROOT}/beskid_vscode"
ORG_REPO="Cyber-Nomad-Collective/beskid_vscode"

if ! command -v gh >/dev/null 2>&1; then
  echo "error: install GitHub CLI (e.g. brew install gh)" >&2
  exit 1
fi
if ! gh auth status >/dev/null 2>&1; then
  echo "error: run \`gh auth login\` or set GH_TOKEN, then retry." >&2
  exit 1
fi

cd "${EXT}"
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "error: not a git checkout: ${EXT}" >&2
  exit 1
fi

if gh repo view "${ORG_REPO}" >/dev/null 2>&1; then
  echo "repo ${ORG_REPO} already exists"
else
  echo "creating ${ORG_REPO}..."
  gh repo create "${ORG_REPO}" --public --description "Beskid VS Code extension (sources for superrepo submodule)"
fi

if git remote get-url github >/dev/null 2>&1; then
  :
else
  git remote add github "https://github.com/${ORG_REPO}.git"
fi

echo "pushing main -> github..."
git push -u github main
