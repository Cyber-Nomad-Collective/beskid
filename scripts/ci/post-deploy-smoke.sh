#!/usr/bin/env bash
# Smoke URLs supplied by BESKID_SMOKE_URLS (newline- or whitespace-separated)
# with trace correlation.
set -euo pipefail

lane="${1:?lane required}"
: "${BESKID_SMOKE_URLS:?Set BESKID_SMOKE_URLS to newline-separated health URLs}"

sanitize_smoke_url() {
  local url="$1"
  url="${url//$'\r'/}"
  url="${url#\"}"
  url="${url%\"}"
  url="${url#\'}"
  url="${url%\'}"
  url="${url#"${url%%[![:space:]]*}"}"
  url="${url%"${url##*[![:space:]]}"}"
  printf '%s' "${url}"
}

while IFS= read -r raw_url || [[ -n "${raw_url}" ]]; do
  url="$(sanitize_smoke_url "${raw_url}")"
  [[ -n "${url}" ]] || continue
  [[ "${url}" == https://* ]] || {
    echo "smoke ${lane}: URL must start with https://: ${url}" >&2
    exit 1
  }
  echo "smoke ${lane}: ${url}"
  curl --fail-with-body --silent --show-error --retry 5 --retry-all-errors \
    --max-time 20 -H "traceparent: ${TRACEPARENT:-}" "${url}" >/dev/null
done < <(
  # GitHub repo/env variables are often one line (space-separated); also accept
  # newlines and tolerate CRLF from Windows-style variable entry.
  printf '%s' "${BESKID_SMOKE_URLS}" | tr -d '\r' | tr -s '[:space:]' '\n' | sed '/^[[:space:]]*$/d'
)
