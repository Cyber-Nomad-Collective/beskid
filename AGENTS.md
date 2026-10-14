# Beskid — guide for agents

The entrance for any agent (Claude Code, Codex, Cursor, Gemini CLI or other)
working in this repository. It holds what you need on arrival. Everything else
is in `docs/.agents/`, linked below.

## Summary

Beskid is an ahead-of-time compiled programming language for everyday business
software, together with its complete toolchain and platform. It moves the
structure that business code usually hides at runtime (reflection, framework
conventions, dependency-injection containers) into the compiler, where it can
be seen and checked.

## The Beskid project

This repository is the **superrepo**. One checkout ties together the root and
11 git submodules. Each submodule is its own repository that versions and
ships separately; CI in this repository ties them together.

- **Language and compiler:** a Rust compiler with CLI and language server; a
  core library written in Beskid; native output for Linux x86_64, macOS arm64
  and Windows x86_64 through Cranelift (ABI v5). AOT only, no JIT.
- **Standard:** the normative definition of the language and platform, kept in
  OpenSpec.
- **Ecosystem:** a package registry (pckg), VS Code and Zed extensions, a
  tree-sitter grammar, project templates.
- **Platform:** a documentation site with the Beskid Book, an auth hub, a
  learning app, a project tracker, a code-graph explorer (Nexus), and the
  self-hosted infrastructure that runs them.
- **Status:** opinionated and unfinished, maintained upstream by Piotr
  Mikstacki under the Cyber-Nomad-Collective organisation.

For the full picture, read [docs/.agents/about-beskid.md](docs/.agents/about-beskid.md).

## Agent documentation

Agent-written knowledge lives in [`docs/.agents/`](docs/.agents/README.md).
One topic per file; each file owns its topic completely.

- **Start here:** [about-beskid.md](docs/.agents/about-beskid.md)
- **People:** [upstream-maintainer.md](docs/.agents/people/upstream-maintainer.md),
  [working-with-sett.md](docs/.agents/people/working-with-sett.md)
- **Scopes (one area each):**
  [compiler](docs/.agents/scopes/compiler.md),
  [openspec-standard](docs/.agents/scopes/openspec-standard.md),
  [sites-and-web](docs/.agents/scopes/sites-and-web.md),
  [pckg](docs/.agents/scopes/pckg.md),
  [tracker-and-nexus](docs/.agents/scopes/tracker-and-nexus.md),
  [editors](docs/.agents/scopes/editors.md),
  [build-release-infra](docs/.agents/scopes/build-release-infra.md)
- **Topics (cross-cutting):**
  [git-and-submodules](docs/.agents/topics/git-and-submodules.md),
  [gitnexus](docs/.agents/topics/gitnexus.md),
  [multi-agent-work](docs/.agents/topics/multi-agent-work.md),
  [refactoring-policy](docs/.agents/topics/refactoring-policy.md),
  [documentation-style](docs/.agents/topics/documentation-style.md),
  [release-program-v0.5](docs/.agents/topics/release-program-v0.5.md)

`GUIDE.md` has the full command table and the authority boundaries.

## Technical details

### Specification

- The normative standard is `openspec/specs/` plus the generated
  `openspec/catalog.json`. Nothing else is normative.
- Change the standard through an OpenSpec change **before** any observable
  behaviour changes.
- Published at <https://beskid-lang.org/docs/standard/>.
- This file is listed in the catalog. After editing it, run
  `pnpm openspec:catalog`, then `pnpm openspec:validate`.

### Stack

| Area | Technology | Path |
| --- | --- | --- |
| Compiler, runtime, LSP | Rust workspace, Salsa, Cranelift ISLE | `compiler/` |
| Core library | Beskid sources | `compiler/corelib/` |
| Registry | Rust service + TanStack web app | `compiler/crates/beskid_pckg_server/`, `beskid_sites/apps/pckg/` |
| Sites | Astro + Starlight, pnpm | `site/website/`, `site/auth/`, `site/learn/` |
| Apps | Tracker (SQLite), Nexus (graph), shared TS packages | `beskid_tracker/`, `beskid_nexus/`, `beskid_web_common/` |
| CI | Woodpecker | `.woodpecker/`, `scripts/ci/` |
| Production | Compose, OpenBao, Watchtower, Grafana | `beskid_sites/deploy/`, `beskid_infra/` |

### Rules every agent follows

1. **Standard first.** No observable behaviour change without an OpenSpec change.
2. **Check impact before editing a symbol, check changes before committing.**
   See [gitnexus.md](docs/.agents/topics/gitnexus.md). A direct instruction from
   the owner overrides this.
3. **Submodules are separate repositories.** Check `git submodule status` and
   the submodule's own status before editing inside one.
4. **No `Co-authored-by` trailers** in commits.
5. **Ask before** pushes, merges, publishing, destructive operations,
   credential changes and external services. Never commit secrets; never
   invent identifiers or tokens. Fail closed.
6. **Complete refactors.** No legacy leftovers or fallbacks.
7. **Naming:** PascalCase types, functions and methods; camelCase locals and
   parameters; crates `beskid_<domain>`. The project is spelled `beskid`.
8. **Docs:** no emoji; Beskid Book tone.
9. **Follow the stricter rule** when the person you work for has one (for
   example, "never commit").

## Getting started

### Set up a checkout

```bash
git clone --recurse-submodules https://github.com/Cyber-Nomad-Collective/beskid.git
cd beskid
./scripts/setup-environment.sh   # submodules + root pnpm install
just deps-check                  # toolchain check from repo-deps.json
```

`just setup` runs the interactive wizard instead. A plain clone leaves every
submodule empty; run `git submodule update --init --recursive`.

### First commands

| Task | Command |
| --- | --- |
| List root recipes | `just --list` |
| Fast local gates | `just gate` |
| Build the compiler | `cargo build` in `compiler/` |
| Install `beskid` and `beskid_lsp` | `just replace` |
| Run the docs site | `pnpm website` |
| Validate the standard | `pnpm openspec:validate` |

### Guides for beginners

- The Beskid Book: <https://beskid-lang.org/book/>. Chapters 01 to 03 cover
  installing, the CLI and projects. Source: `site/website/src/content/docs/book/`.
- Beskid Docs, getting started: <https://beskid-lang.org/docs/getting-started/>
- Downloads: <https://beskid-lang.org/downloads/>
- Terms: [GLOSSARY.md](GLOSSARY.md)

### Tutorials

- First program and smoke test: Book chapter 01, `first-smoke-test`.
- First package: Book chapter 18, `publish-first-package`.
- Interactive lessons: `site/learn/` (`just learn-deps`, then `just learn`).
- Contributor path through the compiler: Book chapter 22.

## Subprojects and related projects

| Path | Role | Kind |
| --- | --- | --- |
| `compiler/` | Compiler, CLI, LSP, runtime; `corelib/` nested | submodule |
| `pckg/` | Registry local stack | submodule |
| `beskid_vscode/` | VS Code extension | submodule |
| `editors/zed/` | Zed extension | in repo |
| `beskid_treesitter/` | Tree-sitter grammar | submodule |
| `beskid_templates/` | Project templates | submodule |
| `beskid_bsol/` | BSOL project format | submodule |
| `beskid_tracker/` | Roadmap and delivery tracker | submodule |
| `beskid_nexus/` | Graph explorer, GitNexus fork | submodule |
| `beskid_web_common/` | Shared `@beskid/*` TypeScript packages | submodule |
| `beskid_infra/` | Secrets and monitoring support | submodule |
| `beskid_distrib/` | Distribution packaging | submodule |
| `site/` | Website, auth, learn | in repo |
| `openspec/` | The standard | in repo |

Upstream tools Beskid builds on: Rust, Cranelift, Salsa, Pest, Astro and
Starlight, TanStack, GitNexus, OpenSpec, Woodpecker.

## Contributing

- Contributor guide: [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md)
- Code of conduct: [.github/CODE_OF_CONDUCT.md](.github/CODE_OF_CONDUCT.md)
- Security reports: [.github/SECURITY.md](.github/SECURITY.md)
- Where to ask: [.github/SUPPORT.md](.github/SUPPORT.md)
- Code owners: [.github/CODEOWNERS](.github/CODEOWNERS)
- Licensing: [LICENSING.md](LICENSING.md)
- Change log: [CHANGELOG.md](CHANGELOG.md)

## Reference links

| What | Where |
| --- | --- |
| Home and Docs | <https://beskid-lang.org> |
| The Book | <https://beskid-lang.org/book/> |
| The Standard | <https://beskid-lang.org/docs/standard/> |
| Package registry | <https://pckg.beskid-lang.org> |
| Tracker | <https://tracker.beskid-lang.org> |
| Auth hub | <https://auth.beskid-lang.org> |
| Monitoring | <https://monitor.beskid-lang.org> |
| Source | <https://github.com/Cyber-Nomad-Collective/beskid> |
| Compiler releases | <https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases> |
| VS Code extension | <https://open-vsx.org/extension/beskid/beskid-vscode> |
