#!/usr/bin/env bash
# Static guard: the stable release path never traces, dumps its environment,
# or places a GitHub credential in argv, URLs, files, or git remotes.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
scripts=(
  scripts/ci/woodpecker-release.sh
  scripts/ci/publish-release-stream.sh
  scripts/ci/publish-homebrew-formula.sh
  scripts/ci/render-compiler-release-notes.sh
  scripts/ci/woodpecker-fetch-handoffs.sh
)
fail() { echo "FAIL: $*" >&2; exit 1; }

for script in "${scripts[@]}"; do
  file="${ROOT}/${script}"
  test -f "${file}" || fail "missing release script ${script}"
  ! grep -nE '^[^#]*(set[[:space:]]+-[A-Za-z]*x|set[[:space:]]+-o[[:space:]]+xtrace|bash[[:space:]]+-[A-Za-z]*x)' "${file}" || \
    fail "${script} enables shell tracing"
  ! grep -nE '^[^#]*(\bprintenv\b|\bdeclare[[:space:]]+-p\b|\bexport[[:space:]]+-p\b|(^|[;&|[:space:]])env[[:space:]]*($|[;&|>]))' "${file}" || \
    fail "${script} dumps its environment"
  ! grep -nE '^[^#]*(echo|printf)[^#]*\$\{?(GH_TOKEN|GITHUB_TOKEN|release_token)' "${file}" || \
    fail "${script} prints a credential"
  ! grep -nE '^[^#]*(--token|x-access-token|https://[^ ]*@|gh[[:space:]]+auth[[:space:]]+login|git[[:space:]]+remote|git[[:space:]]+config|>[[:space:]]*[^ ]*\$\{?(GH_TOKEN|release_token))' "${file}" || \
    fail "${script} places a credential in argv, a URL, a file, or a git remote"
  ! grep -nE '^[^#]*curl[^#]*(token|GH_TOKEN|release_token)' "${file}" || \
    fail "${script} passes a credential to curl"
done

# Publishers remove GH_TOKEN from their exported environment and hand it only
# to gh (or to the two GitHub publisher scripts) as a process environment value.
for script in scripts/ci/woodpecker-release.sh scripts/ci/publish-release-stream.sh scripts/ci/publish-homebrew-formula.sh; do
  file="${ROOT}/${script}"
  grep -Fxq 'unset GH_TOKEN' "${file}" || fail "${script} keeps GH_TOKEN exported"
  grep -Fxq 'gh() { GH_TOKEN="$release_token" command gh "$@"; }' "${file}" || fail "${script} lacks the scoped gh wrapper"
  test "$(grep -c 'GH_TOKEN="$release_token"' "${file}")" -le 2 || fail "${script} exports the token to extra commands"
done
grep -Eq '^with_token\(\) \{ GH_TOKEN="\$release_token" "\$@"; \}$' "${ROOT}/scripts/ci/woodpecker-release.sh" || \
  fail 'woodpecker-release.sh lacks the publisher-only token helper'
test "$(grep -c '^[^#]*with_token ' "${ROOT}/scripts/ci/woodpecker-release.sh")" -eq 3 || \
  fail 'woodpecker-release.sh hands the token to an unreviewed command'
! grep -n '^[^#]*with_token[^#]*\(node\|jq\|git\|cp\|curl\)' "${ROOT}/scripts/ci/woodpecker-release.sh" || \
  fail 'woodpecker-release.sh hands the token to a non-publisher helper'

echo 'Release credential hygiene tests OK'
