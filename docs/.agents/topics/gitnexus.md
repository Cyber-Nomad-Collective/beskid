# GitNexus

GitNexus is a code-intelligence index over the repository: symbols,
relationships and execution flows, served through MCP tools. Beskid's own Nexus
app (`beskid_nexus/`) is a fork of it. This file moved out of the root
`AGENTS.md` on 2026-10-14.

## Tool-managed text

`gitnexus analyze` writes a block between `<!-- gitnexus:start -->` and
`<!-- gitnexus:end -->` into `AGENTS.md`. When the block is missing, the tool
probably adds it again (inferred from the markers, not verified). If it
reappears in `AGENTS.md`, move it here again or decide to leave it there.

## Index

- Indexed as **beskid**. When last recorded: 121,068 symbols, 223,747
  relationships, 300 execution flows.
- Refresh: `node .gitnexus/run.cjs analyze` from the project root (it picks an
  available runner). Without `.gitnexus/run.cjs`: `npx gitnexus analyze`. If
  npm 11 crashes, install globally with `npm i -g gitnexus` (GitNexus issue
  #1939).
- An index built from a checkout with uninitialized submodules does not see
  the code inside them. Check index freshness before trusting results.

## Required checks

- **Before editing a function, class or method,** run
  `impact({target: "symbolName", direction: "upstream"})` and report the blast
  radius: direct callers, affected processes and risk level.
- **Warn the user** when impact analysis returns HIGH or CRITICAL risk, before
  editing.
- **Before committing,** run `detect_changes()` to confirm the changes affect
  only the expected symbols and flows. For regression review against the
  default branch, use `detect_changes({scope: "compare", base_ref: "main"})`.
- **Never rename by find-and-replace.** Use `rename`, which follows the call
  graph.

## Exploring

- `query({query: "concept"})` finds execution flows ranked by relevance. Prefer
  it to grep for unfamiliar code.
- `context({name: "symbolName"})` shows callers, callees and the flows a symbol
  takes part in.

## Resources

| Resource | Use |
| --- | --- |
| `gitnexus://repo/beskid/context` | Overview and index freshness |
| `gitnexus://repo/beskid/clusters` | Functional areas |
| `gitnexus://repo/beskid/processes` | Execution flows |
| `gitnexus://repo/beskid/process/{name}` | Step-by-step trace of one flow |

## Skill files

| Task | Skill |
| --- | --- |
| Architecture, "how does X work" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius, "what breaks if I change X" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Bug tracing | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename, extract, split, refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

These paths are relative to a checkout that has the skills installed. They may
also be installed as user-level skills instead.

## Exceptions

During part of the v0.5 release program the maintainer told agents not to use
GitNexus (recorded in a since-removed `CLAUDE.md`). The checks above are the
default; a direct instruction from the owner overrides them.
