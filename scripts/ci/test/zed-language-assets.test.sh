#!/usr/bin/env bash
# Verifies registry-owned Beskid assets against the exact manifest-pinned grammar.
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
extension_root="${root}/editors/zed"
language_root="${extension_root}/languages/beskid"
bsol_language_root="${extension_root}/languages/bsol"
tree_sitter_cli='npx --yes tree-sitter-cli@0.25.10'
scratch_dir="$(mktemp -d "${TMPDIR:-/tmp}/beskid-zed-language-assets.XXXXXX")"
parser_directory="${scratch_dir}/parsers"
grammar_checkout="${parser_directory}/tree-sitter-beskid"
bsol_checkout="${scratch_dir}/beskid-bsol"
bsol_grammar_checkout="${bsol_checkout}/grammars/tree-sitter-bsol"
tree_sitter_config="${scratch_dir}/tree-sitter-config.json"
grammar_worktree_added=false
bsol_worktree_added=false

cleanup() {
  if [[ "${grammar_worktree_added}" == true ]]; then
    git --git-dir="${grammar_git_dir}" worktree remove --force "${grammar_checkout}" >/dev/null 2>&1 || true
  fi
  if [[ "${bsol_worktree_added}" == true ]]; then
    git --git-dir="${bsol_git_dir}" worktree remove --force "${bsol_checkout}" >/dev/null 2>&1 || true
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
  local scope="$1"
  local source="$2"
  local output
  output="$(${tree_sitter_cli} parse --config-path "${tree_sitter_config}" --scope "${scope}" "$source")" || fail "could not parse ${source#"${root}/"}"
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
  "${extension_root}/tests/fixtures/runnables.bd" \
  "${bsol_language_root}/config.toml" \
  "${bsol_language_root}/highlights.scm" \
  "${extension_root}/tests/fixtures/bsol.bsol"; do
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

bsol_grammar_commit="$(node - "${extension_root}/extension.toml" <<'NODE'
const fs = require('node:fs');
const manifest = fs.readFileSync(process.argv[2], 'utf8');
const lines = manifest.split(/\r?\n/);
const start = lines.findIndex(line => line === '[grammars.bsol]');
const end = lines.findIndex((line, index) => index > start && /^\[/.test(line));
const section = lines.slice(start + 1, end === -1 ? undefined : end).join('\n');
const repository = section.match(/^repository\s*=\s*"([^"]+)"$/m)?.[1];
const commit = section.match(/^commit\s*=\s*"([0-9a-f]{40})"$/m)?.[1];
const path = section.match(/^path\s*=\s*"([^"]+)"$/m)?.[1];
if (repository !== 'https://github.com/Cyber-Nomad-Collective/beskid_bsol' ||
    path !== 'grammars/tree-sitter-bsol' || !commit) process.exit(1);
process.stdout.write(commit);
NODE
)" || fail 'extension.toml has no canonical immutable standalone BSOL grammar declaration'
bsol_git_dir="$(git -C "${root}/beskid_bsol" rev-parse --git-common-dir)"
git --git-dir="${bsol_git_dir}" cat-file -e "${bsol_grammar_commit}^{commit}" || \
  fail "manifest-pinned BSOL grammar commit ${bsol_grammar_commit} is unavailable"
git --git-dir="${bsol_git_dir}" worktree add --detach "${bsol_checkout}" "${bsol_grammar_commit}" >/dev/null
bsol_worktree_added=true
node - "${bsol_grammar_checkout}/tree-sitter.json" <<'NODE'
const fs = require('node:fs');
fs.writeFileSync(process.argv[2], `${JSON.stringify({
  grammars: [{
    name: 'bsol',
    camelcase: 'Bsol',
    scope: 'source.bsol',
    path: '.',
    'file-types': ['bsol'],
    highlights: 'queries/highlights.scm',
    'injection-regex': 'bsol',
  }],
  metadata: {
    version: '0.0.0-test',
    license: 'unlicensed',
    description: 'Temporary test metadata for the pinned BSOL grammar',
  },
}, null, 2)}\n`);
NODE
(cd "${bsol_grammar_checkout}" && ${tree_sitter_cli} generate) || \
  fail "could not generate parser for ${bsol_grammar_commit}"
printf '{"parser-directories":["%s","%s"]}\n' "${parser_directory}" "${bsol_checkout}/grammars" >"${tree_sitter_config}"

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
require_text "${bsol_language_root}/config.toml" 'grammar = "bsol"'
require_text "${bsol_language_root}/highlights.scm" '(block (block_kind) @keyword)'
require_text "${bsol_language_root}/highlights.scm" '(assignment (identifier) @property)'
require_text "${bsol_language_root}/highlights.scm" '(comment) @comment'

parse_without_errors source.beskid "${extension_root}/tests/fixtures/runnables.bd"
for snippet in "${scratch_dir}"/snippet-*.bd; do
  parse_without_errors source.beskid "$snippet"
done
parse_without_errors source.bsol "${extension_root}/tests/fixtures/bsol.bsol"

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

bsol_matches="${scratch_dir}/bsol-highlights.matches"
${tree_sitter_cli} query --config-path "${tree_sitter_config}" --scope source.bsol \
  "${bsol_language_root}/highlights.scm" "${extension_root}/tests/fixtures/bsol.bsol" >"${bsol_matches}" || \
  fail "BSOL highlights.scm does not compile against ${bsol_grammar_commit}"
[[ -s "${bsol_matches}" ]] || fail 'BSOL highlights.scm did not match the BSOL fixture'
[[ "$(grep -Fc 'keyword' "${bsol_matches}")" -ge 2 ]] || \
  fail 'BSOL highlights.scm did not capture block kinds as keywords'
[[ "$(grep -Fc 'property' "${bsol_matches}")" -ge 2 ]] || \
  fail 'BSOL highlights.scm did not capture assignment keys as properties'
[[ "$(grep -Fc 'comment' "${bsol_matches}")" -eq 1 ]] || \
  fail 'BSOL highlights.scm did not capture the fixture comment'

printf 'Zed language asset tests OK\n'
