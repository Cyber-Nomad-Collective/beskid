#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
runner="${root}/scripts/ci/woodpecker-platform-images.sh"
workflow="${root}/.woodpecker/platform.yml"
tmp="$(mktemp -d)"
trap 'rm -r -- "${tmp}"' EXIT

fail() { echo "woodpecker platform images test: $*" >&2; exit 1; }
assert_contains() { grep -Fq -- "$1" "$2" || fail "$3"; }
assert_not_contains() { ! grep -Fq -- "$1" "$2" || fail "$3"; }

fixture() {
  local name="$1"
  local dir="${tmp}/${name}"
  mkdir -p "${dir}/root" "${dir}/bin"
  printf '%s\n' '#!/usr/bin/env bash' 'exit 0' >"${dir}/init-submodules.sh"
  chmod +x "${dir}/init-submodules.sh"
  cat >"${dir}/bin/git" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
path=''
if [[ "$1" == -C ]]; then path="$2"; shift 2; fi
case "$1 ${2:-}" in
  'rev-parse HEAD')
    if [[ "${path}" == */root ]]; then printf '%s\n' "${MOCK_GIT_ROOT_SHA:-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa}"; else printf '%s\n' bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb; fi ;;
  'diff --quiet'|'diff --cached') exit 0 ;;
  'ls-tree -d') printf '160000 commit bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\t%s\n' "${@: -1}" ;;
  *) exit 92 ;;
esac
EOF
  chmod +x "${dir}/bin/git"
  cat >"${dir}/bin/docker" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$*" >>"${MOCK_DOCKER_LOG}"
case "$1 ${2:-}" in
  'buildx version') exit 0 ;;
  'buildx build')
    tag=''
    previous=''
    for argument in "$@"; do
      if [[ "${previous}" == --tag ]]; then tag="${argument}"; break; fi
      previous="${argument}"
    done
    [[ -n "${tag}" ]] || exit 90
    [[ "${tag}" != *"${MOCK_DOCKER_FAIL_LANE:-never}"* ]] || exit 71
    previous=''
    for argument in "$@"; do
      if [[ "${previous}" == --metadata-file ]]; then printf '{"containerimage.digest":"sha256:%s"}\n' "$(printf '1%.0s' {1..64})" >"${argument}"; break; fi
      previous="${argument}"
    done
    ;;
  'buildx imagetools')
    reference="${@: -1}"
    state="${MOCK_DOCKER_LOG}.remote-${reference//\//_}"
    state="${state//:/_}"
    if [[ -f "${state}" ]]; then printf '%s\n' "${MOCK_REMOTE_DIGEST:-sha256:$(printf '1%.0s' {1..64})}"; else touch "${state}"; printf 'manifest unknown\n' >&2; exit 1; fi ;;
  'login '*) cat >/dev/null ;;
  'push '*) [[ "$*" != *"${MOCK_DOCKER_FAIL_PUSH_LANE:-never}"* ]] || exit 72 ;;
  'pull '*) ;;
  'image inspect') printf '%s@sha256:%064d\n' "${5%%:sha-*}" 1 ;;
  'image tag') ;;
  *) exit 91 ;;
esac
EOF
  chmod +x "${dir}/bin/docker"
  printf '%s\n' "${dir}"
}

run_fixture() {
  local dir="$1"
  shift
  MOCK_DOCKER_LOG="${dir}/docker.log" \
  PATH="${dir}/bin:${PATH}" \
  BESKID_PLATFORM_DOCKER_TRUSTED=1 \
  WOODPECKER_PLATFORM_ROOT="${dir}/root" \
  WOODPECKER_PLATFORM_SOURCE_SHA=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa \
  WOODPECKER_PLATFORM_OUTPUT="${dir}/output" \
  WOODPECKER_PLATFORM_INIT_SUBMODULES="${dir}/init-submodules.sh" \
  "$@" bash "${runner}"
}

build_only="$(fixture build-only)"
run_fixture "${build_only}" env
for lane in site learn tracker nexus pckg; do
  assert_contains "beskid/${lane}:sha-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" "${build_only}/docker.log" "${lane} must be built with its immutable tag"
done
assert_not_contains 'login ' "${build_only}/docker.log" 'build-only runs must not log in'
assert_not_contains 'push ' "${build_only}/docker.log" 'build-only runs must not publish'
assert_not_contains ':production' "${build_only}/docker.log" 'build-only runs must not promote'
node -e 'const j=require(process.argv[1]); if (j.status !== "build-only" || j.source.gitlinks.length !== 7) throw new Error("build journal must retain exact initialized source gitlinks")' "${build_only}/output/platform-images.json"

source_mismatch="$(fixture source-mismatch)"
if run_fixture "${source_mismatch}" env MOCK_GIT_ROOT_SHA=cccccccccccccccccccccccccccccccccccccccc; then
  fail 'source mismatch unexpectedly passed'
fi
test ! -e "${source_mismatch}/docker.log" || fail 'source mismatch must fail before Docker access'

failed="$(fixture failed-build)"
if run_fixture "${failed}" env MOCK_DOCKER_FAIL_LANE=tracker; then
  fail 'failed build lane unexpectedly passed'
fi
assert_not_contains 'login ' "${failed}/docker.log" 'a failed lane must not authenticate'
assert_not_contains 'push ' "${failed}/docker.log" 'a failed lane must not publish'
assert_not_contains ':production' "${failed}/docker.log" 'a failed lane must not promote'

published="$(fixture published)"
secret='platform-secret-must-not-appear'
run_fixture "${published}" env \
  CI_PIPELINE_EVENT=manual CI_COMMIT_BRANCH=main BESKID_PLATFORM_PUBLISH=1 \
  REGISTRY_USERNAME=publisher REGISTRY_PASSWORD="${secret}"
for lane in site learn tracker nexus pckg; do
  assert_contains "push cr.beskid-lang.org/beskid/${lane}:sha-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" "${published}/docker.log" "${lane} immutable image must be pushed"
  assert_contains "push cr.beskid-lang.org/beskid/${lane}:production" "${published}/docker.log" "${lane} production tag must be pushed"
done
assert_not_contains "${secret}" "${published}/docker.log" 'password must never be passed as Docker argument'
first_production="$(grep -n ':production' "${published}/docker.log" | head -n1 | cut -d: -f1)"
last_immutable="$(grep -n 'push .*:sha-' "${published}/docker.log" | tail -n1 | cut -d: -f1)"
[[ "${last_immutable}" -lt "${first_production}" ]] || fail 'all immutable images must publish before promotion'
test -s "${published}/output/platform-images.json" || fail 'publication must write image evidence'

remote_mismatch="$(fixture remote-mismatch)"
if run_fixture "${remote_mismatch}" env CI_PIPELINE_EVENT=manual CI_COMMIT_BRANCH=main BESKID_PLATFORM_PUBLISH=1 REGISTRY_USERNAME=publisher REGISTRY_PASSWORD=x MOCK_REMOTE_DIGEST=sha256:$(printf '2%.0s' {1..64}); then
  fail 'remote digest mismatch unexpectedly passed'
fi
assert_not_contains ':production' "${remote_mismatch}/docker.log" 'remote mismatch must not promote'

push_failure="$(fixture push-failure)"
if run_fixture "${push_failure}" env CI_PIPELINE_EVENT=manual CI_COMMIT_BRANCH=main BESKID_PLATFORM_PUBLISH=1 REGISTRY_USERNAME=publisher REGISTRY_PASSWORD=x MOCK_DOCKER_FAIL_PUSH_LANE=tracker; then
  fail 'immutable push failure unexpectedly passed'
fi
node -e 'const j=require(process.argv[1]); if (j.status !== "failed" || j.phase !== "publish-immutable") throw new Error("failed push requires a durable publish journal")' "${push_failure}/output/platform-images.json"

override="$(fixture real-ci-override)"
if CI_PIPELINE_NUMBER=7 CI_COMMIT_SHA=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa \
  WOODPECKER_PLATFORM_ROOT="${override}/root" bash "${runner}" >"${override}/out" 2>"${override}/err"; then
  fail 'real CI accepted test-only overrides'
fi
assert_contains 'WOODPECKER_PLATFORM_ROOT is test-only' "${override}/err" 'real CI must reject test seams'

assert_contains 'BESKID_TASK == "platform"' "${workflow}" 'manual workflow must require explicit platform selector'
assert_contains 'event: push' "${workflow}" 'workflow must allow main pushes'
assert_not_contains 'event: pull_request' "${workflow}" 'workflow must not run pull requests'

echo 'woodpecker platform images tests OK'
