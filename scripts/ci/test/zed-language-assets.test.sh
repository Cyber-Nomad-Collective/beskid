#!/usr/bin/env bash
# Verifies language assets that the registry package, rather than .zed/, owns.
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
extension_root="${root}/editors/zed"
language_root="${extension_root}/languages/beskid"

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  exit 1
}

require_nonempty() {
  [[ -s "$1" ]] || fail "missing or empty ${1#"${root}/"}"
}

require_text() {
  local file="$1"
  local text="$2"
  grep -Fq "$text" "$file" || fail "${file#"${root}/"} is missing ${text}"
}

for asset in \
  "${language_root}/outline.scm" \
  "${language_root}/indents.scm" \
  "${language_root}/brackets.scm" \
  "${language_root}/runnables.scm" \
  "${language_root}/tasks.json" \
  "${language_root}/semantic_token_rules.json" \
  "${extension_root}/snippets/beskid.json" \
  "${extension_root}/tests/fixtures/runnables.bd"; do
  require_nonempty "$asset"
done

node - "${extension_root}/extension.toml" "${language_root}/tasks.json" \
  "${language_root}/semantic_token_rules.json" "${extension_root}/snippets/beskid.json" <<'NODE'
const fs = require('node:fs');
const [manifestPath, tasksPath, semanticRulesPath, snippetsPath] = process.argv.slice(2);
const fail = message => { console.error(`FAIL: ${message}`); process.exit(1); };
const manifest = fs.readFileSync(manifestPath, 'utf8');
if (!manifest.includes('snippets = ["./snippets/beskid.json"]')) {
  fail('extension.toml does not register Beskid snippets');
}
if (/^command\s*=\s*"beskid_lsp"\s*$/m.test(manifest)) {
  fail('extension.toml duplicates Rust adapter command authority');
}

const tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
if (!Array.isArray(tasks)) fail('language tasks.json must be an array');
const expectedTasks = new Map([
  ['beskid-test', ['dev', 'build', 'test', '$ZED_FILE']],
  ['beskid-entry', ['run', '$ZED_FILE', '--entrypoint', '$ZED_CUSTOM_entrypoint']],
  ['beskid-build', ['dev', 'build', 'compile', '$ZED_FILE']],
  ['beskid-analyze', ['dev', 'syntax', 'analyze', '$ZED_FILE']],
  ['beskid-fetch', ['dev', 'project', 'fetch']],
  ['beskid-lock', ['dev', 'project', 'lock']],
]);
for (const [tag, args] of expectedTasks) {
  const task = tasks.find(candidate => Array.isArray(candidate.tags) && candidate.tags.includes(tag));
  if (!task) fail(`language tasks.json has no ${tag} binding`);
  if (task.command !== 'beskid') fail(`${tag} must invoke beskid directly`);
  if (JSON.stringify(task.args) !== JSON.stringify(args)) {
    fail(`${tag} arguments do not match the current Beskid CLI hierarchy`);
  }
}

const semanticRules = JSON.parse(fs.readFileSync(semanticRulesPath, 'utf8'));
if (!Array.isArray(semanticRules) || semanticRules.length !== 0) {
  fail('semantic token rules must not override Beskid LSP standard token types');
}

const snippets = JSON.parse(fs.readFileSync(snippetsPath, 'utf8'));
for (const declaration of ['Module declaration', 'Function declaration', 'Type declaration', 'Contract declaration', 'Enum declaration', 'Test declaration']) {
  if (!snippets[declaration]) fail(`missing ${declaration} snippet`);
}
NODE

for node in function_definition test_definition type_definition enum_definition contract_definition host_definition module_declaration; do
  require_text "${language_root}/outline.scm" "(${node}"
done
require_text "${language_root}/outline.scm" '@name) @item'
require_text "${language_root}/indents.scm" '(block) @indent'
require_text "${language_root}/brackets.scm" '"{" @open "}" @close'
require_text "${language_root}/brackets.scm" '"[" @open "]" @close'
require_text "${language_root}/brackets.scm" '"(" @open ")" @close'
require_text "${language_root}/runnables.scm" '(test_definition'
require_text "${language_root}/runnables.scm" '(function_definition'
require_text "${language_root}/runnables.scm" '@run'
require_text "${language_root}/runnables.scm" '(#set! tag beskid-test)'
require_text "${language_root}/runnables.scm" '@entrypoint'
require_text "${language_root}/runnables.scm" '(#set! tag beskid-entry)'
require_text "${extension_root}/tests/fixtures/runnables.bd" 'test Runnable_test'
require_text "${extension_root}/tests/fixtures/runnables.bd" 'i32 Main()'

printf 'Zed language asset tests OK\n'
