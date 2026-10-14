# docs/.agents

Agent-written knowledge about the Beskid superrepo. Agents write these files for
other agents. Humans may read them, but they are not public documentation. For
public documentation, see `site/website/` (Beskid Docs and the Book) and the
normative standard in `openspec/specs/`.

`AGENTS.md` at the repository root is the entrance. It holds only what every
agent needs on arrival and links here for everything else.

## Rules for this space

- **One topic per file.** Each file tells everything about its topic. If a
  file starts covering two things, split it. Do not repeat a fact in two files;
  link to the file that owns it.
- **Informative only.** Nothing here overrides `openspec/specs/`. When a note
  and the standard disagree, the standard wins and the note gets fixed.
- **Say where facts come from.** Mark what you inferred instead of verified,
  and mark whose rule a rule is (upstream maintainer, a contributor, or a tool).
- **Dated, not timeless.** When a fact belongs to a release program or a moment
  in time, write the date or version next to it.
- **No secrets, no emoji.** Same as the rest of the repository.

## Map

| File | Topic |
| --- | --- |
| [about-beskid.md](about-beskid.md) | What Beskid is, why it exists, how the pieces fit, and an outside view |
| **people/** | Who is involved and how to work with them |
| [people/upstream-maintainer.md](people/upstream-maintainer.md) | Upstream ownership and the maintainer's recorded working preferences |
| [people/working-with-sett.md](people/working-with-sett.md) | Sett Sarverott, an outside contributor, and how sessions with Sett run |
| **scopes/** | One area of the repository each: what it owns, its facts, its rules |
| [scopes/compiler.md](scopes/compiler.md) | Rust compiler, corelib, lowering pipeline, ABI v5, LSP |
| [scopes/openspec-standard.md](scopes/openspec-standard.md) | The normative standard, its catalog and validation |
| [scopes/sites-and-web.md](scopes/sites-and-web.md) | Websites, auth, shared `@beskid` packages, UI conventions |
| [scopes/pckg.md](scopes/pckg.md) | The package registry: service, web app, client, publishing |
| [scopes/tracker-and-nexus.md](scopes/tracker-and-nexus.md) | Tracker (delivery authority) and Nexus (graph explorer) |
| [scopes/editors.md](scopes/editors.md) | VS Code, Zed, tree-sitter, and editor publication |
| [scopes/build-release-infra.md](scopes/build-release-infra.md) | Woodpecker, releases, distribution, production deployment, secrets |
| **topics/** | Cross-cutting subjects that touch several scopes |
| [topics/git-and-submodules.md](topics/git-and-submodules.md) | Superrepo mechanics, branches, commits, merges |
| [topics/gitnexus.md](topics/gitnexus.md) | The GitNexus code-intelligence index and its required checks |
| [topics/multi-agent-work.md](topics/multi-agent-work.md) | Parallel agents, worktrees, ownership labels |
| [topics/refactoring-policy.md](topics/refactoring-policy.md) | Complete refactors, fail closed, no compatibility leftovers |
| [topics/documentation-style.md](topics/documentation-style.md) | Tone, wording, and where prose belongs |
| [topics/release-program-v0.5.md](topics/release-program-v0.5.md) | The v0.5 release program and its standing authorizations |

## Related material outside this space

- `GUIDE.md`: the command table and authority boundaries for agent work.
- `docs/glossary-wiki/`: canonical terms, one page per keyword in `keywords/`
  (the GitHub wiki, as a submodule). Use those terms here.
- `docs/research/`, `docs/superpowers/`, `docs/orchestrate/`, `docs/0.4-release/`:
  dated working notes from earlier agent sessions. They are evidence and may be
  out of date.
- `wayfinder/`: design notes on compiler atomization and CLIF blocks.
