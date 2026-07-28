#!/usr/bin/env bash
# Canonical public HTTPS smoke routes derived from domains.json, with optional
# exact-match overrides and trace correlation.
set -euo pipefail

lane="${1:?lane required}"
case "${lane}" in staging|production) ;; *) echo "lane must be staging or production" >&2; exit 2 ;; esac
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
      echo "smoke ${lane}: URL must start with https://: ${url}" >&2
      return 1
    }
    printf '%s\n' "${url}"
  done < <(
    printf '%s' "$1" | tr -d '\r' | tr -s '[:space:]' '\n' | sed '/^[[:space:]]*$/d'
  )
}

canonical_smoke_urls() {
  local domains_config
  domains_config="$(cd "$(dirname "$0")/../../beskid_infra/config" && pwd)/domains.json"
  jq -er --arg lane "${lane}" '
    .[$lane].services as $services
    | (["site", "auth", "platform-spec", "learn", "tracker", "nexus"]
      + (if $lane == "production" then ["pckg"] else [] end)) as $names
    | if $services | type == "object" and all($names[];
        ($services[.] | type == "object")
        and ($services[.].host | type == "string" and test("^[A-Za-z0-9.-]+$") and length > 0)
        and ($services[.].port | type == "number" and floor == . and . >= 1 and . <= 65535)
      ) then . else error("canonical smoke services are missing or invalid for " + $lane) end
    | def endpoint($name; $path):
        "https://" + $services[$name].host + $path;
      [
        endpoint("site"; "/"),
        endpoint("site"; "/document.txt"),
        endpoint("auth"; "/api/v1/health"),
        endpoint("platform-spec"; "/api/health"),
        endpoint("learn"; "/api/health"),
        endpoint("tracker"; "/api/health"),
        endpoint("nexus"; "/api/health")
      ] + (if $lane == "production" then [endpoint("pckg"; "/health/ready")] else [] end)
    | .[]
  ' "${domains_config}"
}

canonical_urls="$(canonical_smoke_urls)" || {
  echo "smoke ${lane}: could not derive canonical endpoints" >&2
  exit 1
}
if [[ -n "${BESKID_SMOKE_URLS:-}" ]]; then
  configured_urls="$(normalize_smoke_urls "${BESKID_SMOKE_URLS}")" || exit 1
  if [[ "${configured_urls}" != "${canonical_urls}" ]]; then
    echo "smoke ${lane}: BESKID_SMOKE_URLS must exactly match canonical lane endpoints" >&2
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

while IFS= read -r url || [[ -n "${url}" ]]; do
  echo "smoke ${lane}: ${url}"
  probe_url "${url}"
done <<<"${canonical_urls}"
