#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SCRIPT="${ROOT}/scripts/ci/publish-release-stream.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT

fail() { echo "FAIL: $*" >&2; exit 1; }

mkdir -p "${TMP}/bin" "${TMP}/assets"
cat >"${TMP}/bin/gh" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' "$*" >>"${GH_LOG}"
case "$1 $2" in
  "release view") exit 1 ;;
esac
EOF
chmod +x "${TMP}/bin/gh"
touch "${TMP}/assets/beskid-linux-amd64" \
  "${TMP}/assets/beskid-darwin-arm64" \
  "${TMP}/assets/beskid-windows-amd64.exe"

GH_LOG="${TMP}/gh.log" PATH="${TMP}/bin:${PATH}" GH_TOKEN=test-token \
  bash "${SCRIPT}" cli 1.2.3 0123456789abcdef0123456789abcdef01234567 "${TMP}/assets" immutable

grep -Fq 'release create cli-v1.2.3' "${TMP}/gh.log" || fail "immutable release was not created"
if grep -Eq '^release (create|upload) cli-(stable|unstable)' "${TMP}/gh.log"; then
  fail "immutable phase updated the rolling alias"
fi

: >"${TMP}/gh.log"
GH_LOG="${TMP}/gh.log" PATH="${TMP}/bin:${PATH}" GH_TOKEN=test-token \
  bash "${SCRIPT}" cli 1.2.3 0123456789abcdef0123456789abcdef01234567 "${TMP}/assets" rolling

grep -Eq '^release create cli-(stable|unstable)' "${TMP}/gh.log" || fail "rolling phase did not create rolling alias"
if grep -Eq '^release (create|upload) cli-v1.2.3' "${TMP}/gh.log"; then
  fail "rolling phase updated the immutable release"
fi

echo 'publish release stream tests OK'
