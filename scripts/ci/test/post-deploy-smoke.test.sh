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
mkdir -p "${TMP}/bin"

cat >"${TMP}/bin/curl" <<SH
#!/usr/bin/env bash
url=''
for argument in "\$@"; do
  if [[ "\${argument}" == https://* ]]; then
    url="\${argument}"
  fi
done
[[ -n "\${url}" ]] || { echo "missing URL argument" >&2; exit 2; }
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

read_logged_urls() {
  local line
  logged_urls=()
  while IFS= read -r line; do
    logged_urls+=("${line}")
  done <"${MOCK_LOG}"
}

run_smoke \
  'https://beskid-lang.org/ https://auth.beskid-lang.org/api/v1/health https://spec.beskid-lang.org/api/health' \
  production
read_logged_urls
assert_eq 3 "${#logged_urls[@]}" "space-separated URLs produce one curl per endpoint"
assert_eq 'https://beskid-lang.org/' "${logged_urls[0]}" "first space-separated URL"
assert_eq 'https://auth.beskid-lang.org/api/v1/health' "${logged_urls[1]}" "second space-separated URL"
assert_eq 'https://spec.beskid-lang.org/api/health' "${logged_urls[2]}" "third space-separated URL"

run_smoke $'https://one.example/health\r\nhttps://two.example/health\r\n' production
read_logged_urls
assert_eq 2 "${#logged_urls[@]}" "CRLF-separated URLs produce one curl per endpoint"
assert_eq 'https://one.example/health' "${logged_urls[0]}" "first CRLF URL"
assert_eq 'https://two.example/health' "${logged_urls[1]}" "second CRLF URL"

run_smoke $'"https://quoted.example/health"\nhttps://plain.example/health' production
read_logged_urls
assert_eq 2 "${#logged_urls[@]}" "quoted URLs produce one curl per endpoint"
assert_eq 'https://quoted.example/health' "${logged_urls[0]}" "quoted URL is stripped"
assert_eq 'https://plain.example/health' "${logged_urls[1]}" "plain URL unchanged"

if run_smoke 'http://insecure.example/health' production >/dev/null 2>&1; then
  _TESTS_RUN=$((_TESTS_RUN + 1))
  _TESTS_FAIL=$((_TESTS_FAIL + 1))
  echo "  FAIL - non-https URL is rejected"
else
  _TESTS_RUN=$((_TESTS_RUN + 1))
  echo "  ok   - non-https URL is rejected"
fi

finish_tests
