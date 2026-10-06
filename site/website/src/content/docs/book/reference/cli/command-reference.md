---
title: "CLI command reference"
description: "Index of beskid subcommands: links to per-command documentation."
---

Arguments can be expanded from response files using the `@file` convention (via the `argfile` crate), consistent with other Rust CLI tools.

Unless noted, failures print a diagnostic report (miette) and exit non-zero.

## Global behavior

- On launch, the CLI ensures the **bundled corelib** tree is available (and may print a short message when it materializes or updates a copy). Override the source location with `BESKID_CORELIB_SOURCE` when developing against a different corelib checkout.
- Subcommands that need a single resolved `.bd` entrypoint accept optional `--project`, `--target`, and `--workspace-member` together with `--frozen` / `--locked` where project resolution applies (see [check](/book/reference/cli/commands/analyze/), [doc](/book/reference/cli/commands/doc/), [run](/book/reference/cli/commands/run/), [build](/book/reference/cli/commands/build/), [clif](/book/reference/cli/commands/clif/)).

## Commands

| Command | Summary |
| --- | --- |
| [`new`](/book/reference/cli/commands/new/) | Create a project with the bundled offline template; manage templates under `package template` |
| [`check`](/book/reference/cli/commands/analyze/) | Check semantics and manifest validity without linking (was `analyze`) |
| [`build`](/book/reference/cli/commands/build/) | AOT compile and link |
| [`run`](/book/reference/cli/commands/run/) | AOT-compile, link, and execute in a subprocess |
| [`test`](/book/reference/cli/commands/test/) | Discover, filter, and run `test` items |
| [`fmt`](/book/reference/cli/commands/format/) | Format sources in place, check them, or write one output file (was `format`) |
| [`doc`](/book/reference/cli/commands/doc/) | Emit `api.json` and `index.md` for API docs |
| `add`, `remove` | Change a project dependency and resolve its lock |
| [`update`](/book/reference/cli/commands/update/) | Update one dependency or `--all`; no `--plain` option |
| [`package`](/book/reference/cli/commands/pckg/) | Search, pack, publish, log in, log out, and manage templates (was `pckg`) |
| [`toolchain`](/book/reference/cli/commands/up/) | Inspect or update the installed toolchain (was `up`) |
| `doctor` | Diagnose the installation without changing it |
| [`dev`](/book/reference/cli/commands/dev/) | Inspection, plumbing, and maintenance commands |

## Removed root commands

| Removed command | Replacement |
| --- | --- |
| [`lock`](/book/reference/cli/commands/lock/) | `beskid dev project lock` |
| [`fetch`](/book/reference/cli/commands/fetch/) | `beskid dev project fetch` |
| [`graph`](/book/reference/cli/commands/graph/) | `beskid dev project graph` |
| [`analyze`](/book/reference/cli/commands/analyze/) | `beskid check` |
| [`repl`](/book/reference/cli/commands/repl/) | `beskid dev repl` |
| [`validate-bsol`](/book/reference/cli/commands/validate-bsol/) | `beskid dev bsol validate <manifest>.bproj` |
| [`migrate-bsol`](/book/reference/cli/commands/migrate-bsol/) | `beskid dev bsol migrate` |
| [`parse`](/book/reference/cli/commands/parse/), [`tree`](/book/reference/cli/commands/tree/), [`clif`](/book/reference/cli/commands/clif/) | `beskid dev syntax parse`, `tree`, `clif` |
| [`mod`](/book/reference/cli/commands/mod/), [`import`](/book/reference/cli/commands/import/), [`lsp`](/book/reference/cli/commands/lsp/), [`corelib`](/book/reference/cli/commands/corelib/), [`runtime-kit`](/book/reference/cli/commands/runtime-kit/) | `beskid dev mod`, `import`, `lsp`, `corelib`, `runtime-kit` |
| [`up`](/book/reference/cli/commands/up/) | `beskid toolchain` |

The `dev` commands are documented on the [`beskid dev`](/book/reference/cli/commands/dev/) page.

The pinned compiler revision contains retired manifest names in some command comments. Its resolver implementation requires `.bproj` and `.bws`. This reference uses the implemented file contract. The compiler owner must correct the stale comments in a compiler-owned change.
