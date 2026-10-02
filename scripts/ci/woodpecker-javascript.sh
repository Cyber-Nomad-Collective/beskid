#!/usr/bin/env bash
# Validate first-party JavaScript packages without publication credentials.
set -euo pipefail

lane="${1:-}"
root="${BESKID_JAVASCRIPT_ROOT:-$(cd "$(dirname "$0")/../.." && pwd)}"

Fail() {
  printf '%s\n' "$1" >&2
  exit 1
}

Run() {
  local failure="$1"
  shift
  if ! "$@"; then
    printf '%s\n' "${failure}" >&2
    return 1
  fi
}

for credential in NODE_AUTH_TOKEN NPM_TOKEN GITHUB_TOKEN GH_TOKEN; do
  [[ -z "${!credential:-}" ]] || Fail 'validation must not receive publisher credentials'
done

[[ -d "${root}" ]] || Fail 'JavaScript validation root is unavailable'
cd "${root}"

case "${lane}" in
  shared)
    [[ -f beskid_web_common/package.json ]] || Fail 'shared package manifest is required'
    [[ -f beskid_web_common/pnpm-lock.yaml ]] || Fail 'pnpm-lock.yaml is required'
    command -v pnpm >/dev/null 2>&1 || Fail 'pnpm is required'
    [[ "$(pnpm --version)" == 10.17.1 ]] || Fail 'pnpm 10.17.1 is required'
    Run 'shared package install failed' \
      pnpm --dir beskid_web_common install --frozen-lockfile
    Run 'shared package typecheck failed' \
      pnpm --dir beskid_web_common run typecheck
    Run 'shared package tests failed' \
      pnpm --dir beskid_web_common run test
    Run 'shared package build failed' \
      pnpm --dir beskid_web_common run build
    ;;
  treesitter)
    [[ -f beskid_treesitter/package.json ]] || Fail 'Tree-sitter package manifest is required'
    [[ -f beskid_treesitter/bun.lock ]] || Fail 'bun.lock is required'
    command -v bun >/dev/null 2>&1 || Fail 'Bun is required'
    command -v bunx >/dev/null 2>&1 || Fail 'bunx is required'
    command -v node >/dev/null 2>&1 || Fail 'Node.js is required'
    [[ "$(bun --version)" == 1.3.0 ]] || Fail 'Bun 1.3.0 is required'
    [[ "$(node --version)" == v22.16.0 ]] || Fail 'Node.js 22.16.0 is required'
    (
      cd beskid_treesitter
      Run 'Tree-sitter install failed' bun install --frozen-lockfile --ignore-scripts
      tree_sitter_cli_dir="${PWD}/node_modules/tree-sitter-cli"
      [[ -f "${tree_sitter_cli_dir}/install.js" ]] || Fail 'locked Tree-sitter CLI installer is required'
      (
        cd "${tree_sitter_cli_dir}"
        Run 'Tree-sitter CLI install failed' node install.js
      )
      node_gyp="${PWD}/node_modules/.bin/node-gyp"
      [[ -x "${node_gyp}" ]] || Fail 'locked node-gyp is required'
      [[ "$("${node_gyp}" --version)" == v12.1.0 ]] || Fail 'node-gyp 12.1.0 is required'
      Run 'Tree-sitter native build failed' \
        env npm_config_jobs=2 MAKEFLAGS=-j2 npm_config_node_gyp="${node_gyp}" \
          bun run install
      Run 'Tree-sitter generator failed' bunx tree-sitter generate
      Run 'Tree-sitter corpus tests failed' bunx tree-sitter test
    )
    Run 'Tree-sitter generated outputs changed' \
      git -C beskid_treesitter diff --exit-code -- grammar.js grammar.template.js src
    ;;
  *)
    Fail 'usage: woodpecker-javascript.sh shared|treesitter'
    ;;
esac
