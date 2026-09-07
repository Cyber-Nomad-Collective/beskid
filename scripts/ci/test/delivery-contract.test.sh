#!/usr/bin/env bash
# Repository-controlled contracts for production Watchtower delivery.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
compose="${ROOT}/beskid_sites/deploy/docker-compose.yml"
workflow="${ROOT}/.github/workflows/platform-delivery.yml"

for repository in site auth learn tracker nexus pckg; do
  rg -Fq "cr.beskid-lang.org/beskid/${repository}:" "${compose}"
  rg -Fq "repository: cr.beskid-lang.org/beskid/${repository}" "${workflow}"
done

for service in website auth learn tracker nexus pckg; do
  service_block="$(sed -n "/^  ${service}:/,/^  [a-z].*:/p" "${compose}")"
  [[ "${service_block}" == *'com.centurylinklabs.watchtower.enable: "true"'* ]] || {
    echo "${service} is not Watchtower-managed" >&2
    exit 1
  }
done

rg -Fq 'PCKG_DATABASE_URL' "${ROOT}/pckg/README.md"

echo "delivery contracts OK"
