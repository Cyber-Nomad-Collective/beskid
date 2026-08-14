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
previous=''
for argument in "$@"; do
  if [[ "${previous}" == --notes-file ]]; then cp "${argument}" "${GH_NOTES}"; fi
  previous="${argument}"
done
case "$1 $2" in
  "release view") exit 1 ;;
esac
EOF
chmod +x "${TMP}/bin/gh"
touch "${TMP}/assets/beskid-linux-amd64" \
  "${TMP}/assets/beskid-darwin-arm64" \
  "${TMP}/assets/beskid-windows-amd64.exe"
cat >"${TMP}/release-state.json" <<'EOF'
{"schema_version":1,"channel":"unstable","version":"1.2.3-unstable","publishable":true,"provenance":{"compiler_commit":"0123456789abcdef0123456789abcdef01234567","superrepo_commit":"abcdef0123456789abcdef0123456789abcdef01"},"tests":{"successful":[],"failed":["compiler-rust-gate"]},"available_artifacts":["beskid-linux-amd64"],"missing_artifacts":["beskid-darwin-arm64"],"failed_platform_builds":["macos:cli"]}
EOF

GH_LOG="${TMP}/gh.log" GH_NOTES="${TMP}/notes.md" PATH="${TMP}/bin:${PATH}" GH_TOKEN=test-token \
  bash "${SCRIPT}" cli 1.2.3-unstable 0123456789abcdef0123456789abcdef01234567 "${TMP}/assets" immutable unstable "${TMP}/release-state.json"

grep -Fq 'release create cli-v1.2.3-unstable' "${TMP}/gh.log" || fail "immutable release was not created"
grep -Fq 'release-state.json' "${TMP}/gh.log" || fail "release state was not uploaded"
for heading in '## Channel' '## Available artifacts' '## Missing artifacts' '## Successful tests' '## Failed tests' '## Commit provenance'; do
  grep -Fq "${heading}" "${TMP}/notes.md" || fail "release notes missing ${heading}"
done
if grep -Eq '^release (create|upload) cli-(stable|unstable)' "${TMP}/gh.log"; then
  fail "immutable phase updated the rolling alias"
fi

: >"${TMP}/gh.log"
cp "${TMP}/release-state.json" "${TMP}/assets/release-state.json"
GH_LOG="${TMP}/gh.log" GH_NOTES="${TMP}/notes.md" PATH="${TMP}/bin:${PATH}" GH_TOKEN=test-token \
  bash "${SCRIPT}" cli 1.2.3-unstable 0123456789abcdef0123456789abcdef01234567 "${TMP}/assets" rolling unstable "${TMP}/assets/release-state.json"

grep -Eq '^release create cli-(stable|unstable)' "${TMP}/gh.log" || fail "rolling phase did not create rolling alias"
if grep -Eq '^release (create|upload) cli-v1.2.3-unstable' "${TMP}/gh.log"; then
  fail "rolling phase updated the immutable release"
fi

echo 'publish release stream tests OK'
