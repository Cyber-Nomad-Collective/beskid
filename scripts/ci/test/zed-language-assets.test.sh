#!/usr/bin/env bash
# Verifies registry-owned Beskid assets against the exact manifest-pinned grammar.
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
extension_root="${root}/editors/zed"
language_root="${extension_root}/languages/beskid"
tree_sitter_cli='npx --yes tree-sitter-cli@0.25.10'
scratch_dir="$(mktemp -d "${TMPDIR:-/tmp}/beskid-zed-language-assets.XXXXXX")"
parser_directory="${scratch_dir}/parsers"
grammar_checkout="${parser_directory}/tree-sitter-beskid"
tree_sitter_config="${scratch_dir}/tree-sitter-config.json"
grammar_worktree_added=false

cleanup() {
  if [[ "${grammar_worktree_added}" == true ]]; then
    git --git-dir="${grammar_git_dir}" worktree remove --force "${grammar_checkout}" >/dev/null 2>&1 || true
  fi
  rm -rf "${scratch_dir}"
}
trap cleanup EXIT

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

parse_without_errors() {
  local source="$1"
  local output
  output="$(${tree_sitter_cli} parse --config-path "${tree_sitter_config}" --scope source.beskid "$source")" || fail "could not parse ${source#"${root}/"}"
  [[ "$output" != *ERROR* ]] || fail "grammar reported an error for ${source#"${root}/"}"
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

grammar_commit="$(node - "${extension_root}/extension.toml" <<'NODE'
const fs = require('node:fs');
const manifest = fs.readFileSync(process.argv[2], 'utf8');
const lines = manifest.split(/\r?\n/);
const start = lines.findIndex(line => line === '[grammars.beskid]');
const end = lines.findIndex((line, index) => index > start && /^\[/.test(line));
const section = lines.slice(start + 1, end === -1 ? undefined : end).join('\n');
const commit = section.match(/^commit\s*=\s*"([0-9a-f]{40})"$/m)?.[1];
if (!commit) process.exit(1);
process.stdout.write(commit);
NODE
)" || fail 'extension.toml has no immutable Beskid grammar commit'
grammar_git_dir="$(git -C "${root}/beskid_treesitter" rev-parse --git-common-dir)"
git --git-dir="${grammar_git_dir}" cat-file -e "${grammar_commit}^{commit}" || \
  fail "manifest-pinned grammar commit ${grammar_commit} is unavailable"
mkdir -p "${parser_directory}"
git --git-dir="${grammar_git_dir}" worktree add --detach "${grammar_checkout}" "${grammar_commit}" >/dev/null
grammar_worktree_added=true
printf '{"parser-directories":["%s"]}\n' "${parser_directory}" >"${tree_sitter_config}"

node - "${extension_root}/extension.toml" "${language_root}/tasks.json" \
  "${language_root}/semantic_token_rules.json" "${extension_root}/snippets/beskid.json" \
  "${scratch_dir}" <<'NODE'
const fs = require('node:fs');
const path = require('node:path');
const [manifestPath, tasksPath, semanticRulesPath, snippetsPath, scratchDir] = process.argv.slice(2);
const fail = message => { console.error(`FAIL: ${message}`); process.exit(1); };
const manifest = fs.readFileSync(manifestPath, 'utf8');
if (!manifest.includes('snippets = ["./snippets/beskid.json"]')) fail('extension.toml does not register Beskid snippets');
if (/^command\s*=\s*"beskid_lsp"\s*$/m.test(manifest)) fail('extension.toml duplicates Rust adapter command authority');

const tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
if (!Array.isArray(tasks)) fail('language tasks.json must be an array');
const expectedTasks = new Map([
  ['beskid-test', ['test', '$ZED_FILE']],
  ['beskid-entry', ['run', '$ZED_FILE', '--entrypoint', '$ZED_CUSTOM_entrypoint']],
  ['beskid-build', ['build', '$ZED_FILE']],
  ['beskid-analyze', ['analyze', '$ZED_FILE']],
  ['beskid-fetch', ['fetch']],
  ['beskid-lock', ['lock']],
]);
for (const [tag, args] of expectedTasks) {
  const task = tasks.find(candidate => Array.isArray(candidate.tags) && candidate.tags.length === 1 && candidate.tags[0] === tag);
  if (!task) fail(`language tasks.json has no exclusive ${tag} binding`);
  if (task.command !== 'beskid') fail(`${tag} must invoke beskid directly`);
  if (JSON.stringify(task.args) !== JSON.stringify(args)) fail(`${tag} arguments do not match the pinned Beskid CLI`);
  if (task.cwd !== '$ZED_WORKTREE_ROOT' || task.use_new_terminal !== true || task.reveal !== 'always') {
    fail(`${tag} does not preserve the required Zed task execution schema`);
  }
  const sourceTask = ['beskid-test', 'beskid-entry', 'beskid-build', 'beskid-analyze'].includes(tag);
  if (sourceTask && task.save !== 'current') fail(`${tag} must save the active source buffer`);
  if (!sourceTask && Object.hasOwn(task, 'save')) fail(`${tag} must not imply an active source buffer`);
}

const semanticRules = JSON.parse(fs.readFileSync(semanticRulesPath, 'utf8'));
if (!Array.isArray(semanticRules) || semanticRules.length !== 0) fail('semantic token rules must not override Beskid LSP standard token types');

const snippets = JSON.parse(fs.readFileSync(snippetsPath, 'utf8'));
const declarations = ['Module declaration', 'Function declaration', 'Type declaration', 'Contract declaration', 'Enum declaration', 'Test declaration'];
const expand = body => body.join('\n')
  .replace(/\$\{\d+:([^}]+)\}/g, '$1')
  .replace(/\$\{\d+\}|\$\d+/g, '');
for (const [index, declaration] of declarations.entries()) {
  const snippet = snippets[declaration];
  if (!snippet || !Array.isArray(snippet.body)) fail(`missing ${declaration} snippet`);
  fs.writeFileSync(path.join(scratchDir, `snippet-${index}.bd`), `${expand(snippet.body)}\n`);
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

parse_without_errors "${extension_root}/tests/fixtures/runnables.bd"
for snippet in "${scratch_dir}"/snippet-*.bd; do
  parse_without_errors "$snippet"
done

for query in outline indents brackets runnables; do
  query_output="${scratch_dir}/${query}.matches"
  ${tree_sitter_cli} query --config-path "${tree_sitter_config}" --scope source.beskid \
    "${language_root}/${query}.scm" "${extension_root}/tests/fixtures/runnables.bd" >"${query_output}" || \
    fail "${query}.scm does not compile against ${grammar_commit}"
  [[ -s "${query_output}" ]] || fail "${query}.scm did not match the runnable fixture"
done

[[ "$(grep -Fc 'capture: run' "${scratch_dir}/runnables.matches")" -eq 2 ]] || \
  fail 'runnables.scm must expose exactly one test and one entry runnable'
[[ "$(grep -Fc 'capture: 0 - test' "${scratch_dir}/runnables.matches")" -eq 1 ]] || \
  fail 'runnables.scm did not capture exactly one test name'
[[ "$(grep -Fc 'entrypoint' "${scratch_dir}/runnables.matches")" -eq 1 ]] || \
  fail 'runnables.scm did not capture exactly one entry point name'

printf 'Zed language asset tests OK\n'
