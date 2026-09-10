#!/usr/bin/env bash
# Offline supply-chain policy for AppVeyor publication and Watchtower delivery.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "${ROOT}"

authoritative_scripts=(
  scripts/ci/appveyor-install.sh
  scripts/ci/appveyor-entrypoint.sh
  scripts/ci/appveyor-entrypoint.ps1
  scripts/ci/appveyor-package-publish.sh
  scripts/ci/appveyor-platform-publish.sh
  scripts/ci/appveyor-platform-promote.sh
  scripts/ci/appveyor-image-manifest.sh
  scripts/ci/lib/appveyor-event-policy.sh
)

[[ -f appveyor.yml ]] || { echo "missing authoritative AppVeyor configuration" >&2; exit 1; }
for script in "${authoritative_scripts[@]}"; do
  [[ -f "${script}" ]] || { echo "missing authoritative CI script: ${script}" >&2; exit 1; }
done

# Project delivery is orchestrated only from the superrepo. Inspect its tracked
# paths rather than the working tree: initialized submodules are gitlinks here,
# and their upstream workflow metadata is not an authoritative Beskid lane.
nested_workflows="$(git ls-files -- \
  site beskid_tracker beskid_nexus pckg compiler/corelib beskid_bsol \
  | rg '/\.github/workflows/' \
  | rg -v '^compiler/vendor/' || true)"
if [[ -n "${nested_workflows}" ]]; then
  printf 'nested project workflows bypass the authoritative pipeline:\n%s\n' "${nested_workflows}" >&2
  exit 1
fi

if rg -n -i 'coolify|compose[[:space:]_-]*(up|apply)|watchtower[[:space:]_-]*(restart|update|control)' \
  appveyor.yml "${authoritative_scripts[@]}"; then
  echo "AppVeyor must not retain deployment-control behavior" >&2
  exit 1
fi

if rg -n 'ghcr\.io|docker\.io' \
  scripts/ci/appveyor-platform-publish.sh \
  scripts/ci/appveyor-platform-promote.sh \
  scripts/ci/appveyor-image-manifest.sh \
  appveyor.yml; then
  echo "platform images must use only cr.beskid-lang.org" >&2
  exit 1
fi

if ! rg -Fq 'cr.beskid-lang.org' scripts/ci/appveyor-platform-publish.sh ||
   ! rg -Fq 'cr.beskid-lang.org' scripts/ci/appveyor-platform-promote.sh; then
  echo "platform publisher must target the Beskid registry" >&2
  exit 1
fi

if rg -n '^[[:space:]]*REGISTRY_(USERNAME|PASSWORD)[[:space:]]*[:=][[:space:]]*[^$[:space:]]' \
  appveyor.yml "${authoritative_scripts[@]}"; then
  echo "registry credential values must never be committed" >&2
  exit 1
fi

if rg -n '^[[:space:]]*BESKID_PCKG_API_KEY[[:space:]]*[:=][[:space:]]*[^$[:space:]]' \
  appveyor.yml "${authoritative_scripts[@]}"; then
  echo "package publisher credential values must never be committed" >&2
  exit 1
fi

if ruby -e 'require "yaml"; abort unless YAML.safe_load(File.read(ARGV.fetch(0)), aliases: true)["deploy"] == false' appveyor.yml; then
  :
else
  echo "AppVeyor deployment must remain disabled" >&2
  exit 1
fi

for script in scripts/ci/*.sh scripts/ci/test/*.sh; do
  bash -n "${script}"
done

echo "CI security policy OK"
