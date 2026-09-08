#!/usr/bin/env bash
# Canonical production HTTPS smoke routes for the Watchtower release, with
# optional exact-match overrides and trace correlation.
set -euo pipefail

[[ $# -eq 0 || ( $# -eq 1 && "$1" == production ) ]] || {
  echo "usage: $0 [production]" >&2
  exit 2
}
smoke_retries="${BESKID_SMOKE_RETRIES:-15}"
[[ "${smoke_retries}" =~ ^[1-9][0-9]*$ ]] || {
  echo "BESKID_SMOKE_RETRIES must be a positive integer" >&2
  exit 2
}

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

normalize_smoke_urls() {
  local raw_url url
  while IFS= read -r raw_url || [[ -n "${raw_url}" ]]; do
    url="$(sanitize_smoke_url "${raw_url}")"
    [[ -n "${url}" ]] || continue
    [[ "${url}" == https://* ]] || {
      echo "smoke production: URL must start with https://: ${url}" >&2
      return 1
    }
    printf '%s\n' "${url}"
  done < <(
    printf '%s' "$1" | tr -d '\r' | tr -s '[:space:]' '\n' | sed '/^[[:space:]]*$/d'
  )
}

canonical_urls=$'https://beskid-lang.org/\nhttps://learn.beskid-lang.org/api/health\nhttps://tracker.beskid-lang.org/api/health\nhttps://nexus.beskid-lang.org/api/health\nhttps://pckg.beskid-lang.org/health/ready'
if [[ -n "${BESKID_SMOKE_URLS:-}" ]]; then
  configured_urls="$(normalize_smoke_urls "${BESKID_SMOKE_URLS}")" || exit 1
  if [[ "${configured_urls}" != "${canonical_urls}" ]]; then
    echo "smoke production: BESKID_SMOKE_URLS must exactly match canonical endpoints" >&2
    exit 1
  fi
fi

probe_url() {
  local url="$1"
  local headers
  local code
  headers="$(mktemp)"
  code=$(curl --fail-with-body --silent --show-error --retry "${smoke_retries}" --retry-delay 2 --retry-all-errors \
    --max-time 20 -D "${headers}" -o /dev/null -H "traceparent: ${TRACEPARENT:-}" \
    "${url}" 2>/dev/null; echo $?)
  if [[ "${code}" != "0" ]]; then
    echo "smoke production: failed ${url}" >&2
    cat "${headers}" >&2
    rm -f "${headers}"
    return 1
  fi

  rm -f "${headers}"
  return 0
}

while IFS= read -r url || [[ -n "${url}" ]]; do
  echo "smoke production: ${url}"
  probe_url "${url}"
done <<<"${canonical_urls}"
