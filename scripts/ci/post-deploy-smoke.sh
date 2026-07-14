#!/usr/bin/env bash
# Smoke URLs supplied by BESKID_SMOKE_URLS (newline-separated) with trace correlation.
set -euo pipefail

lane="${1:?lane required}"
: "${BESKID_SMOKE_URLS:?Set BESKID_SMOKE_URLS to newline-separated health URLs}"

while IFS= read -r url; do
  [[ -n "${url}" ]] || continue
  echo "smoke ${lane}: ${url}"
  curl --fail-with-body --silent --show-error --retry 5 --retry-all-errors \
    --max-time 20 -H "traceparent: ${TRACEPARENT:-}" "${url}" >/dev/null
done <<<"${BESKID_SMOKE_URLS}"

