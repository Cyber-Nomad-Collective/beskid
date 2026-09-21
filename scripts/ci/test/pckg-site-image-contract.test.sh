#!/usr/bin/env bash
set -euo pipefail
root="$(git rev-parse --show-toplevel)"
dockerfile="$root/pckg/Dockerfile"
compose="$root/beskid_sites/deploy/docker-compose.yml"

grep -q 'beskid_sites/apps/pckg' "$dockerfile"
grep -q 'beskid_pckg_server' "$dockerfile"
grep -q 'PCKG_REGISTRY_ORIGIN=http://127.0.0.1:8083' "$dockerfile"
if grep -q 'pckg/web' "$dockerfile"; then
	 echo 'retired pckg/web client is still in the production image' >&2
	 exit 1
fi
grep -q 'com.centurylinklabs.watchtower.enable: "true"' "$compose"
grep -q 'http://localhost:8082/api/health' "$compose"
echo 'pckg image and Watchtower contract passed'
