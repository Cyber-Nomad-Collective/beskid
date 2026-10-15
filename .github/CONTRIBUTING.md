# Contributing to Beskid

Thank you for looking. Beskid is an opinionated project with a written
process. The process exists so that a change to the language never arrives as a
surprise in a drive-by pull request. Follow it and your work lands faster.

The long version, with the reasoning, is
[Book chapter 22, "So you want to contribute, huh?"](https://beskid-lang.org/book/22-so-you-want-to-contribute/)
and the [Contributing guide](https://beskid-lang.org/docs/contributing/) in
Beskid Docs.

## Before you start

- Read the [Code of Conduct](CODE_OF_CONDUCT.md).
- Decide where the change belongs. Most products are git submodules with their
  own repositories (see the table in [README.md](../README.md)). A change to the
  compiler goes to `beskid_compiler`, a change to the VS Code extension goes to
  `beskid_vscode`, and so on. This repository takes changes to the standard,
  the docs site, scripts, CI and submodule pointers.
- Bugs go to GitHub Issues. Features and roadmap items go to the
  [Tracker](https://tracker.beskid-lang.org), which decides what ships when.

## Set up

```bash
git clone --recurse-submodules https://github.com/Cyber-Nomad-Collective/beskid.git
cd beskid
./scripts/setup-environment.sh
just deps-check
```

`just deps-install` installs missing tools listed in `repo-deps.json`. Some
`@beskid/*` packages are private and need `NODE_AUTH_TOKEN`; without it the
local gates report a skip.

## The workflow

1. **Standard first.** If your change alters behaviour that a user can observe,
   write an OpenSpec change in `openspec/changes/` first. The normative
   standard lives only in `openspec/specs/`.
2. **Implement** in the repository that owns the code.
3. **Test** with the focused tests of that repository.
4. **Run the local gates** until they pass:

   | Check | Command |
   | --- | --- |
   | Fast host gates | `just gate` |
   | Standard and provenance | `pnpm openspec:validate` |
   | Web and docs | `./validate-ci-local.sh` |
   | Licenses | `pnpm licenses:check` |

   Compiler work also needs the compiler's own gate; `just gate` does not run
   it.
5. **Write it down.** Add an entry to `CHANGELOG.md`. Update the glossary wiki
   (`docs/glossary-wiki/keywords/`) if a canonical term changes. If you edited a root document listed in
   `openspec/catalog.json` (such as `AGENTS.md` or `GUIDE.md`), run
   `pnpm openspec:catalog`.
6. **Open a pull request** using the template.

## Conventions

- **Naming:** PascalCase for types, functions and methods; camelCase for locals
  and parameters; Rust crates `beskid_<domain>`.
- **Commits:** clear messages, no `Co-authored-by` trailers.
- **Refactors are complete.** Replace the old path, migrate every consumer,
  delete the old path. No compatibility fallbacks.
- **Docs:** no emoji. Follow the tone of the Beskid Book. The Book explains;
  the standard defines.
- **Secrets:** never commit them, never guess them.

## Agents

If you work through an AI agent, point it at [AGENTS.md](../AGENTS.md). The
same rules apply to agent-written changes as to human ones, and you remain
responsible for what you submit.

## Licensing

By contributing you agree that your contribution is licensed under the terms
that apply to the path you change, as described in
[LICENSING.md](../LICENSING.md): Apache-2.0 for most code, AGPL-3.0-only for
network services, CC-BY-4.0 for documentation prose.
