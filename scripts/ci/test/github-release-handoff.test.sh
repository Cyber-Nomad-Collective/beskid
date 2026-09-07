#!/usr/bin/env bash
# GitHub Release handoff contract: retry-safe uploads with immutable target identity.
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
fi
SH
chmod +x "${TMP}/bin/gh"
touch "${TMP}/assets/compiler.bin"

run_handoff() {
  GH_LOG="${TMP}/gh.log" PATH="${TMP}/bin:${PATH}" bash "${SCRIPT}" "$@"
}

: >"${TMP}/gh.log"
GH_RELEASE_EXISTS=false run_handoff init org/compiler handoff-abc abc 'Compiler handoff abc'
grep -Fq 'release create handoff-abc --repo org/compiler --target abc --prerelease --latest=false --title Compiler\ handoff\ abc' "${TMP}/gh.log" || \
  fail 'init did not create a published prerelease handoff at the requested target'

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
run_handoff upload org/compiler handoff-abc "${TMP}/assets/compiler.bin"
grep -Fq 'release upload handoff-abc --repo org/compiler --clobber' "${TMP}/gh.log" || \
  fail 'upload is not retry-safe'

: >"${TMP}/gh.log"
run_handoff download org/compiler handoff-abc "${TMP}/download"
grep -Fq 'release download handoff-abc --repo org/compiler --dir' "${TMP}/gh.log" || \
  fail 'download did not use the requested release and destination'

echo 'GitHub Release handoff tests OK'
