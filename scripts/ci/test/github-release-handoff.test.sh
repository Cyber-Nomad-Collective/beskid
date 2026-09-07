#!/usr/bin/env bash
# GitHub Release handoff contract: private staging, retry-safe recursive uploads,
# explicit publication, and bounded cleanup.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SCRIPT="${ROOT}/scripts/ci/github-release-handoff.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT
mkdir -p "${TMP}/bin" "${TMP}/assets"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

cat >"${TMP}/bin/gh" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
printf '%q ' "$@" >>"${GH_LOG}"
printf '\n' >>"${GH_LOG}"
if [[ "$1 $2" == "release view" ]]; then
  if [[ "${GH_RELEASE_EXISTS:-false}" != true ]]; then
    exit 1
  fi
  printf '%s\n' "${GH_RELEASE_TARGET:-}"
elif [[ "$1 $2" == "release list" ]]; then
  printf '%s\n' "${GH_RELEASE_LIST_JSON:-[]}"
fi
SH
chmod +x "${TMP}/bin/gh"
touch "${TMP}/assets/compiler.bin"
mkdir -p "${TMP}/assets/release-logs"
touch "${TMP}/assets/release-logs/x86_64-test-cli.log"

run_handoff() {
  GH_LOG="${TMP}/gh.log" PATH="${TMP}/bin:${PATH}" bash "${SCRIPT}" "$@"
}

: >"${TMP}/gh.log"
GH_RELEASE_EXISTS=false run_handoff init org/compiler handoff-abc abc 'Compiler handoff abc'
grep -Fq 'release create handoff-abc --repo org/compiler --target abc' "${TMP}/gh.log" || \
  fail 'init did not create a handoff at the requested target'
grep -Fq -- '--draft' "${TMP}/gh.log" || \
  fail 'init exposed the handoff before aggregation finalized it'

: >"${TMP}/gh.log"
GH_RELEASE_EXISTS=true GH_RELEASE_TARGET=abc run_handoff init org/compiler handoff-abc abc 'Compiler handoff abc'
if grep -Fq 'release create' "${TMP}/gh.log"; then
  fail 'retry attempted to recreate an existing handoff release'
fi

if GH_RELEASE_EXISTS=true GH_RELEASE_TARGET=def run_handoff init org/compiler handoff-abc abc 'Compiler handoff abc' 2>"${TMP}/target-error"; then
  fail 'init accepted an existing handoff release at the wrong target'
fi
grep -Fq 'targets def, expected abc' "${TMP}/target-error" || \
  fail 'wrong-target failure did not explain the immutable identity mismatch'

: >"${TMP}/gh.log"
run_handoff upload org/compiler handoff-abc "${TMP}/assets"
grep -Fq 'release upload handoff-abc --repo org/compiler --clobber' "${TMP}/gh.log" || \
  fail 'upload is not retry-safe'
grep -Fq 'assets/release-logs/x86_64-test-cli.log' "${TMP}/gh.log" || \
  fail 'upload discarded nested diagnostic logs'

: >"${TMP}/gh.log"
run_handoff finalize org/compiler handoff-abc
grep -Fq 'release edit handoff-abc --repo org/compiler --draft=false --prerelease --latest=false' "${TMP}/gh.log" || \
  fail 'finalize did not publish the aggregated handoff as a non-latest prerelease'

: >"${TMP}/gh.log"
run_handoff download org/compiler handoff-abc "${TMP}/download"
grep -Fq 'release download handoff-abc --repo org/compiler --dir' "${TMP}/gh.log" || \
  fail 'download did not use the requested release and destination'

: >"${TMP}/gh.log"
GH_RELEASE_LIST_JSON='[
  {"tagName":"compiler-handoff-old","createdAt":"2025-12-01T00:00:00Z","isDraft":true,"isPrerelease":false},
  {"tagName":"compiler-handoff-recent","createdAt":"2025-12-30T00:00:00Z","isDraft":false,"isPrerelease":true},
  {"tagName":"cli-v0.4.1","createdAt":"2025-01-01T00:00:00Z","isDraft":false,"isPrerelease":false}
]' HANDOFF_NOW_EPOCH=1767225600 run_handoff cleanup org/compiler 7
grep -Fq 'release list --repo org/compiler --limit 1000 --order asc' "${TMP}/gh.log" || \
  fail 'cleanup did not page from the oldest releases in the requested repository'
grep -Fq 'release delete compiler-handoff-old --repo org/compiler --cleanup-tag --yes' "${TMP}/gh.log" || \
  fail 'cleanup did not remove an expired handoff and its tag'
if grep -Fq 'release delete compiler-handoff-recent' "${TMP}/gh.log"; then
  fail 'cleanup removed a handoff inside the retention window'
fi
if grep -Fq 'release delete cli-v0.4.1' "${TMP}/gh.log"; then
  fail 'cleanup removed a public distribution release'
fi

echo 'GitHub Release handoff tests OK'
