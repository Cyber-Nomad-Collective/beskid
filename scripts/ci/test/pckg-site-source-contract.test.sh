#!/usr/bin/env bash
set -euo pipefail

root="$(git rev-parse --show-toplevel)"
route="beskid_sites/apps/pckg/src/routes/_public/packages/index.tsx"

if git -C "$root" check-ignore -q "$route"; then
  echo "pckg package routes are incorrectly ignored: $route" >&2
  exit 1
fi

git -C "$root" ls-files --error-unmatch beskid_sites/apps/pckg/package.json >/dev/null
git -C "$root" ls-files --error-unmatch "$route" >/dev/null
