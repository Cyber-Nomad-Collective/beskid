#!/usr/bin/env bash
# Regression tests for post-deploy smoke URL parsing (CRLF, quotes, whitespace).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SCRIPT="${ROOT}/scripts/ci/post-deploy-smoke.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT

# shellcheck source=scripts/ci/test/lib/assert.sh
source "${ROOT}/scripts/ci/test/lib/assert.sh"

MOCK_LOG="${TMP}/curl.log"
: >"${MOCK_LOG}"
export MOCK_LOG
export MOCK_FAIL_URL=""
export MOCK_BAD_DOCUMENT=""
mkdir -p "${TMP}/bin"

cat >"${TMP}/bin/curl" <<SH
#!/usr/bin/env bash
url=''
next_is_header_file=0
header_file=''
for argument in "\$@"; do
  if [[ "\${next_is_header_file}" == 1 ]]; then
    header_file="\${argument}"
    next_is_header_file=0
    continue
  fi
  if [[ "\${argument}" == "-D" ]]; then
    next_is_header_file=1
    continue
  fi
  if [[ "\${argument}" == https://* ]]; then
    url="\${argument}"
  fi
done
[[ -n "\${url}" ]] || { echo "missing URL argument" >&2; exit 2; }
[[ -n "\${header_file}" ]] || { echo "missing header output path" >&2; exit 3; }
if [[ "\${url}" == "\${MOCK_FAIL_URL}" ]]; then
  exit 22
elif [[ "\${url}" == *"/document.txt" && "\${MOCK_BAD_DOCUMENT}" == 1 ]]; then
  cat <<EOF >"\${header_file}"
HTTP/2 200
content-disposition: attachment; filename=\"document.txt\"
content-type: application/octet-stream
EOF
elif [[ "\${url}" == *"/document.txt" ]]; then
  cat <<EOF >"\${header_file}"
HTTP/2 200
content-type: text/html; charset=utf-8
EOF
else
  cat <<EOF >"\${header_file}"
HTTP/2 200
content-type: application/json
EOF
fi
printf '%s\n' "\${url}" >>"\${MOCK_LOG}"
exit 0
SH
chmod +x "${TMP}/bin/curl"

run_smoke() {
  : >"${MOCK_LOG}"
  PATH="${TMP}/bin:${PATH}" \
    TRACEPARENT=00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01 \
    BESKID_SMOKE_URLS="$1" \
    bash "${SCRIPT}" "$2"
}

run_default_smoke() {
  : >"${MOCK_LOG}"
  PATH="${TMP}/bin:${PATH}" \
    TRACEPARENT=00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01 \
    env -u BESKID_SMOKE_URLS \
    bash "${SCRIPT}" "$1"
}

read_logged_urls() {
  local line
  logged_urls=()
  while IFS= read -r line; do
    logged_urls+=("${line}")
  done <"${MOCK_LOG}"
}

production_urls='https://beskid-lang.org/ https://beskid-lang.org/document.txt https://auth.beskid-lang.org/api/v1/health https://spec.beskid-lang.org/api/health https://learn.beskid-lang.org/api/health https://tracker.beskid-lang.org/api/health https://nexus.beskid-lang.org/api/health https://pckg.beskid-lang.org/health/ready'
staging_urls=$'https://stg.beskid-lang.org/\nhttps://stg.beskid-lang.org/document.txt\nhttps://stg-auth.beskid-lang.org/api/v1/health\nhttps://stg-spec.beskid-lang.org/api/health\nhttps://stg-learn.beskid-lang.org/api/health\nhttps://stg-tracker.beskid-lang.org/api/health\nhttps://stg-nexus.beskid-lang.org/api/health'

run_smoke "${production_urls}" production
read_logged_urls
assert_eq 8 "${#logged_urls[@]}" "canonical space-separated URLs produce one curl per endpoint"
assert_eq 'https://beskid-lang.org/' "${logged_urls[0]}" "first canonical URL"
assert_eq 'https://auth.beskid-lang.org/api/v1/health' "${logged_urls[2]}" "auth canonical URL"
assert_eq 'https://pckg.beskid-lang.org/health/ready' "${logged_urls[7]}" "pckg canonical URL"

run_smoke "${production_urls}" production
read_logged_urls
assert_eq 8 "${#logged_urls[@]}" "document route remains part of canonical smoke"
assert_eq 'https://beskid-lang.org/document.txt' "${logged_urls[1]}" "document.txt endpoint is checked in smoke"

run_smoke "${staging_urls//$'\n'/$'\r\n'}" staging
read_logged_urls
assert_eq 7 "${#logged_urls[@]}" "CRLF canonical URLs produce one curl per endpoint"
assert_eq 'https://stg.beskid-lang.org/' "${logged_urls[0]}" "first CRLF URL"
assert_eq 'https://stg-nexus.beskid-lang.org/api/health' "${logged_urls[6]}" "last CRLF URL"

run_smoke "\"https://beskid-lang.org/\" ${production_urls#* }" production
read_logged_urls
assert_eq 8 "${#logged_urls[@]}" "quoted canonical URLs produce one curl per endpoint"
assert_eq 'https://beskid-lang.org/' "${logged_urls[0]}" "quoted URL is stripped"

run_default_smoke production
read_logged_urls
assert_eq 8 "${#logged_urls[@]}" "production defaults smoke every active public service plus document route"
assert_eq 'https://beskid-lang.org/' "${logged_urls[0]}" "production default smoke starts with site root"
assert_eq 'https://beskid-lang.org/document.txt' "${logged_urls[1]}" "production default smoke covers document route"
assert_eq 'https://pckg.beskid-lang.org/health/ready' "${logged_urls[7]}" "production default smoke includes active pckg"

run_default_smoke staging
read_logged_urls
assert_eq 7 "${#logged_urls[@]}" "staging defaults omit inactive pckg"
assert_eq 'https://stg.beskid-lang.org/' "${logged_urls[0]}" "staging default smoke starts with site root"
assert_eq 'https://stg-nexus.beskid-lang.org/api/health' "${logged_urls[6]}" "staging default smoke covers nexus"

if run_smoke 'http://insecure.example/health' production >/dev/null 2>&1; then
  _TESTS_RUN=$((_TESTS_RUN + 1))
  _TESTS_FAIL=$((_TESTS_FAIL + 1))
  echo "  FAIL - non-https URL is rejected"
else
  _TESTS_RUN=$((_TESTS_RUN + 1))
  echo "  ok   - non-https URL is rejected"
fi

if run_smoke 'https://beskid-lang.org/' production >/dev/null 2>&1; then
  _TESTS_RUN=$((_TESTS_RUN + 1))
  _TESTS_FAIL=$((_TESTS_FAIL + 1))
  echo "  FAIL - incomplete explicit smoke override is rejected"
else
  _TESTS_RUN=$((_TESTS_RUN + 1))
  echo "  ok   - incomplete explicit smoke override is rejected"
fi

MOCK_FAIL_URL='https://auth.beskid-lang.org/api/v1/health'
if run_default_smoke production >/dev/null 2>&1; then
  _TESTS_RUN=$((_TESTS_RUN + 1))
  _TESTS_FAIL=$((_TESTS_FAIL + 1))
  echo "  FAIL - curl error fails canonical smoke"
else
  _TESTS_RUN=$((_TESTS_RUN + 1))
  echo "  ok   - curl error fails canonical smoke"
fi
MOCK_FAIL_URL=""

MOCK_BAD_DOCUMENT=1
if run_default_smoke production >/dev/null 2>&1; then
  _TESTS_RUN=$((_TESTS_RUN + 1))
  _TESTS_FAIL=$((_TESTS_FAIL + 1))
  echo "  FAIL - attachment header for canonical document.txt route is rejected"
else
  _TESTS_RUN=$((_TESTS_RUN + 1))
  echo "  ok   - attachment header on canonical document.txt route is rejected"
fi
MOCK_BAD_DOCUMENT=""

finish_tests
