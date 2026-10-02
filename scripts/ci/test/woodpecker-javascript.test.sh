#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
RUNNER="${ROOT}/scripts/ci/woodpecker-javascript.sh"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

fixture="${tmp}/fixture"
bin="${tmp}/bin"
mkdir -p "${fixture}/beskid_web_common" "${fixture}/beskid_treesitter" "${bin}"
printf '{}\n' >"${fixture}/beskid_web_common/package.json"
printf 'lockfileVersion: 9\n' >"${fixture}/beskid_web_common/pnpm-lock.yaml"
printf '{}\n' >"${fixture}/beskid_treesitter/package.json"
printf '{}\n' >"${fixture}/beskid_treesitter/bun.lock"

cat >"${bin}/pnpm" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
if [[ "${1:-}" == --version ]]; then
  printf '%s\n' "${FAKE_PNPM_VERSION:-10.17.1}"
  exit 0
fi
printf 'pnpm %s\n' "$*" >>"${COMMAND_LOG}"
[[ "${FAKE_FAIL:-}" != pnpm-install || "$*" != *' install '* ]] || exit 41
[[ "${FAKE_FAIL:-}" != pnpm-build || "$*" != *' run build' ]] || exit 42
EOF

cat >"${bin}/bun" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
if [[ "${1:-}" == --version ]]; then
  printf '%s\n' "${FAKE_BUN_VERSION:-1.3.0}"
  exit 0
fi
printf 'bun[%s jobs=%s make=%s node_gyp=%s] %s\n' \
  "$(basename "$PWD")" "${npm_config_jobs:-}" "${MAKEFLAGS:-}" \
  "$(basename "${npm_config_node_gyp:-missing}")" "$*" >>"${COMMAND_LOG}"
[[ "${FAKE_FAIL:-}" != bun-install ]] || exit 43
EOF

cat >"${bin}/bunx" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
printf 'bunx[%s] %s\n' "$(basename "$PWD")" "$*" >>"${COMMAND_LOG}"
[[ "${FAKE_FAIL:-}" != tree-generate || "$*" != 'tree-sitter generate' ]] || exit 44
[[ "${FAKE_FAIL:-}" != tree-test || "$*" != 'tree-sitter test' ]] || exit 45
EOF

cat >"${bin}/git" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
printf 'git %s\n' "$*" >>"${COMMAND_LOG}"
[[ "${FAKE_GIT_DRIFT:-0}" != 1 ]] || exit 1
EOF

cat >"${bin}/node-gyp" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
if [[ "${1:-}" == --version ]]; then
  printf '%s\n' "${FAKE_NODE_GYP_VERSION:-v12.1.0}"
  exit 0
fi
exit 72
EOF
chmod +x "${bin}/pnpm" "${bin}/bun" "${bin}/bunx" "${bin}/node-gyp" "${bin}/git"

run_lane() {
  local lane="$1"
  shift
  env -u NODE_AUTH_TOKEN -u NPM_TOKEN -u GITHUB_TOKEN -u GH_TOKEN \
    PATH="${bin}:/usr/bin:/bin" COMMAND_LOG="${tmp}/commands.log" \
    BESKID_JAVASCRIPT_ROOT="${fixture}" "$@" bash "${RUNNER}" "${lane}"
}

expect_failure() {
  local marker="$1"
  shift
  if "$@" >"${tmp}/failure.out" 2>"${tmp}/failure.err"; then
    printf 'Expected command to fail: %s\n' "$marker" >&2
    exit 1
  fi
  grep -Fq "$marker" "${tmp}/failure.err"
}

: >"${tmp}/commands.log"
run_lane shared
diff -u - "${tmp}/commands.log" <<'EOF'
pnpm --dir beskid_web_common install --frozen-lockfile
pnpm --dir beskid_web_common run typecheck
pnpm --dir beskid_web_common run test
pnpm --dir beskid_web_common run build
EOF

: >"${tmp}/commands.log"
run_lane treesitter
diff -u - "${tmp}/commands.log" <<'EOF'
bun[beskid_treesitter jobs=2 make=-j2 node_gyp=node-gyp] install --frozen-lockfile
bunx[beskid_treesitter] tree-sitter generate
bunx[beskid_treesitter] tree-sitter test
git -C beskid_treesitter diff --exit-code -- grammar.js grammar.template.js src
EOF

expect_failure 'pnpm 10.17.1 is required' run_lane shared env FAKE_PNPM_VERSION=10.18.0
expect_failure 'Bun 1.3.0 is required' run_lane treesitter env FAKE_BUN_VERSION=1.3.1
expect_failure 'node-gyp 12.1.0 is required' run_lane treesitter env FAKE_NODE_GYP_VERSION=v12.0.0

mv "${fixture}/beskid_web_common/pnpm-lock.yaml" "${fixture}/beskid_web_common/pnpm-lock.missing"
expect_failure 'pnpm-lock.yaml is required' run_lane shared
mv "${fixture}/beskid_web_common/pnpm-lock.missing" "${fixture}/beskid_web_common/pnpm-lock.yaml"

mv "${fixture}/beskid_treesitter/bun.lock" "${fixture}/beskid_treesitter/bun.lock.missing"
expect_failure 'bun.lock is required' run_lane treesitter
mv "${fixture}/beskid_treesitter/bun.lock.missing" "${fixture}/beskid_treesitter/bun.lock"

expect_failure 'shared package install failed' run_lane shared env FAKE_FAIL=pnpm-install
expect_failure 'shared package build failed' run_lane shared env FAKE_FAIL=pnpm-build
expect_failure 'Tree-sitter install failed' run_lane treesitter env FAKE_FAIL=bun-install
expect_failure 'Tree-sitter generator failed' run_lane treesitter env FAKE_FAIL=tree-generate
expect_failure 'Tree-sitter corpus tests failed' run_lane treesitter env FAKE_FAIL=tree-test
expect_failure 'Tree-sitter generated outputs changed' run_lane treesitter env FAKE_GIT_DRIFT=1

expect_failure 'validation must not receive publisher credentials' \
  env PATH="${bin}:/usr/bin:/bin" COMMAND_LOG="${tmp}/commands.log" \
    BESKID_JAVASCRIPT_ROOT="${fixture}" NODE_AUTH_TOKEN=fixture-secret \
    bash "${RUNNER}" shared

expect_failure 'usage: woodpecker-javascript.sh shared|treesitter' run_lane unknown

printf 'Woodpecker JavaScript validation fixtures OK\n'
