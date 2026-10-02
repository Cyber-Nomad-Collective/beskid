#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/../../.." && pwd)"
guard="${root}/scripts/ci/woodpecker-release-tag-guard.sh"
marker="$(mktemp)"
trap 'rm -f "${marker}"' EXIT

run_guard() {
  : >"${marker}"
  set +e
  bash "${guard}" "$1" bash -c 'printf reached >"$1"; exit 73' bash "${marker}" >/dev/null
  status=$?
  set -e
  echo "${status}"
}

for tag in editor-v0.5.1 v0.5.1-rc.1 malformed 0.5.1; do
  test "$(run_guard "${tag}")" -eq 0
  test ! -s "${marker}"
done

test "$(run_guard v0.5.1)" -eq 73
test "$(cat "${marker}")" = reached

for file in linux macos windows; do
  grep -Fq 'woodpecker-release-tag-guard.sh "$${CI_COMMIT_TAG}"' "${root}/.woodpecker/${file}.yml"
done

echo 'Woodpecker release tag guard behavior tests OK'
