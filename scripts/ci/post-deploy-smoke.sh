#!/usr/bin/env bash
# Smoke URLs supplied by BESKID_SMOKE_URLS (newline- or whitespace-separated)
# with trace correlation.
set -euo pipefail

lane="${1:?lane required}"
: "${BESKID_SMOKE_URLS:?Set BESKID_SMOKE_URLS to newline-separated health URLs}"
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

probe_url() {
  local url="$1"
  local headers
  local code
  headers="$(mktemp)"
  code=$(curl --fail-with-body --silent --show-error --retry "${smoke_retries}" --retry-all-errors \
    --max-time 20 -D "${headers}" -o /dev/null -H "traceparent: ${TRACEPARENT:-}" \
    "${url}" 2>/dev/null; echo $?)
  if [[ "${code}" != "0" ]]; then
    echo "smoke ${lane}: failed ${url}" >&2
    cat "${headers}" >&2
    rm -f "${headers}"
    return 1
  fi

  if [[ "${url}" == *"/document.txt" ]]; then
    if ! rg -qi '^content-type: text/html' "${headers}"; then
      echo "smoke ${lane}: unexpected content-type for ${url} (expected HTML)" >&2
      cat "${headers}" >&2
      rm -f "${headers}"
      return 1
    fi
    if rg -qi '^content-disposition: attachment' "${headers}"; then
      echo "smoke ${lane}: attachment header found for ${url}" >&2
      cat "${headers}" >&2
      rm -f "${headers}"
      return 1
    fi
  fi

  rm -f "${headers}"
  return 0
}

while IFS= read -r raw_url || [[ -n "${raw_url}" ]]; do
  url="$(sanitize_smoke_url "${raw_url}")"
  [[ -n "${url}" ]] || continue
  [[ "${url}" == https://* ]] || {
    echo "smoke ${lane}: URL must start with https://: ${url}" >&2
    exit 1
  }
  echo "smoke ${lane}: ${url}"
  probe_url "${url}"
done < <(
  # GitHub repo/env variables are often one line (space-separated); also accept
  # newlines and tolerate CRLF from Windows-style variable entry.
  printf '%s' "${BESKID_SMOKE_URLS}" | tr -d '\r' | tr -s '[:space:]' '\n' | sed '/^[[:space:]]*$/d'
)
