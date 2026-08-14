#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SCRIPT="${ROOT}/scripts/ci/build-release-platform.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT
mkdir -p "${TMP}/bin"

cat >"${TMP}/builder.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
asset="$4"
if [[ " ${FAIL_ASSETS:-} " == *" ${asset} "* ]]; then exit 17; fi
printf 'binary' >"${FAKE_ARTIFACT_ROOT}/${asset}"
EOF
chmod +x "${TMP}/builder.sh"

run_platform() {
  local channel="$1" failures="$2" output="$3"
  mkdir -p "${output}"
  (
    cd "${output}"
    BUILD_RELEASE_ARTIFACT_SCRIPT="${TMP}/builder.sh" RELEASE_ARTIFACT_ROOT="${TMP}/artifact-root" \
      FAKE_ARTIFACT_ROOT="${TMP}/artifact-root" FAIL_ASSETS="${failures}" \
      "${SCRIPT}" x86_64-test beskid-test beskid_lsp-test 0.4.1 "${channel}" .
  )
}

mkdir -p "${TMP}/artifact-root"

run_platform stable '' "${TMP}/stable"
jq -e '.builds.cli.status == "success" and .builds.lsp.status == "success"' \
  "${TMP}/stable/platform-result-x86_64-test.json" >/dev/null

if run_platform stable 'beskid_lsp-test' "${TMP}/stable-failed"; then
  echo 'stable platform unexpectedly accepted an LSP failure' >&2
  exit 1
fi

run_platform unstable 'beskid_lsp-test' "${TMP}/unstable-partial"
jq -e '.builds.cli.status == "success" and .builds.lsp.status == "failed"' \
  "${TMP}/unstable-partial/platform-result-x86_64-test.json" >/dev/null
jq -e '.stage == "native-release-build" and
  (.builds.lsp.command | contains("beskid_lsp")) and
  .builds.lsp.log_path == "release-logs/x86_64-test-lsp.log" and
  (.builds.lsp.reason | length) > 0' \
  "${TMP}/unstable-partial/platform-result-x86_64-test.json" >/dev/null
test -f "${TMP}/unstable-partial/release-logs/x86_64-test-lsp.log"

run_platform unstable 'beskid-test beskid_lsp-test' "${TMP}/unstable-failed"
jq -e '.builds.cli.status == "failed" and .builds.lsp.status == "failed"' \
  "${TMP}/unstable-failed/platform-result-x86_64-test.json" >/dev/null

echo 'build release platform tests OK'
