#!/usr/bin/env bash
# Regression tests for production-only Watchtower smoke URL parsing.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SCRIPT="${ROOT}/scripts/ci/post-deploy-smoke.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT
# shellcheck source=scripts/ci/test/lib/assert.sh
source "${ROOT}/scripts/ci/test/lib/assert.sh"

MOCK_LOG="${TMP}/curl.log"
export MOCK_LOG MOCK_FAIL_URL="" MOCK_BAD_DOCUMENT="" MOCK_HTTP_STATUS="200"
mkdir -p "${TMP}/bin"
cat >"${TMP}/bin/curl" <<'SH'
#!/usr/bin/env bash
url='' header='' previous=''
for argument in "$@"; do
  [[ "${previous}" == '-D' ]] && header="${argument}"
  [[ "${argument}" == https://* ]] && url="${argument}"
  previous="${argument}"
done
[[ -n "${url}" && -n "${header}" ]] || exit 2
[[ "${url}" == "${MOCK_FAIL_URL}" ]] && exit 22
if [[ "${url}" == *'/document.txt' && "${MOCK_BAD_DOCUMENT}" == 1 ]]; then
  printf 'HTTP/2 200\ncontent-disposition: attachment\ncontent-type: application/octet-stream\n' >"${header}"
elif [[ "${url}" == *'/document.txt' ]]; then
  printf 'HTTP/2 200\ncontent-type: text/html\n' >"${header}"
else
  printf 'HTTP/2 %s\ncontent-type: application/json\n' "${MOCK_HTTP_STATUS}" >"${header}"
fi
printf '%s\n' "${url}" >>"${MOCK_LOG}"
SH
chmod +x "${TMP}/bin/curl"

production_urls='https://beskid-lang.org/ https://learn.beskid-lang.org/api/health https://tracker.beskid-lang.org/api/health https://nexus.beskid-lang.org/api/health https://pckg.beskid-lang.org/health/ready'

run_smoke() {
  : >"${MOCK_LOG}"
  PATH="${TMP}/bin:${PATH}" BESKID_SMOKE_URLS="$1" bash "${SCRIPT}"
}
read_logged_urls() {
  logged_urls=()
  while IFS= read -r url; do
    logged_urls+=("${url}")
  done <"${MOCK_LOG}"
}

run_smoke "${production_urls}"
read_logged_urls
assert_eq 5 "${#logged_urls[@]}" "canonical URLs produce one curl per endpoint"
assert_eq 'https://beskid-lang.org/' "${logged_urls[0]}" "site root is first"
assert_eq 'https://pckg.beskid-lang.org/health/ready' "${logged_urls[4]}" "pckg is last"

run_smoke "\"https://beskid-lang.org/\" ${production_urls#* }"
read_logged_urls
assert_eq 5 "${#logged_urls[@]}" "quoted URL is normalized"

if PATH="${TMP}/bin:${PATH}" bash "${SCRIPT}" staging >/dev/null 2>&1; then
  _TESTS_RUN=$((_TESTS_RUN + 1)); _TESTS_FAIL=$((_TESTS_FAIL + 1)); echo '  FAIL - staging argument is rejected'
else
  _TESTS_RUN=$((_TESTS_RUN + 1)); echo '  ok   - staging argument is rejected'
fi

if run_smoke 'http://insecure.example/health' >/dev/null 2>&1; then
  _TESTS_RUN=$((_TESTS_RUN + 1)); _TESTS_FAIL=$((_TESTS_FAIL + 1)); echo '  FAIL - non-HTTPS override is rejected'
else
  _TESTS_RUN=$((_TESTS_RUN + 1)); echo '  ok   - non-HTTPS override is rejected'
fi

MOCK_FAIL_URL='https://tracker.beskid-lang.org/api/health'
if run_smoke "${production_urls}" >/dev/null 2>&1; then
  _TESTS_RUN=$((_TESTS_RUN + 1)); _TESTS_FAIL=$((_TESTS_FAIL + 1)); echo '  FAIL - curl error fails smoke'
else
  _TESTS_RUN=$((_TESTS_RUN + 1)); echo '  ok   - curl error fails smoke'
fi
MOCK_FAIL_URL=''

MOCK_HTTP_STATUS=302
if run_smoke "${production_urls}" >/dev/null 2>&1; then
  _TESTS_RUN=$((_TESTS_RUN + 1)); _TESTS_FAIL=$((_TESTS_FAIL + 1)); echo '  FAIL - redirect response fails smoke'
else
  _TESTS_RUN=$((_TESTS_RUN + 1)); echo '  ok   - redirect response fails smoke'
fi
MOCK_HTTP_STATUS=200

finish_tests
