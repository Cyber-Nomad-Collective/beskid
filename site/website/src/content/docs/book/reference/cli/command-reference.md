---
title: "CLI command reference"
description: "Index of beskid subcommands: links to per-command documentation."
---

Arguments can be expanded from response files using the `@file` convention (via the `argfile` crate), consistent with other Rust CLI tools.

Unless noted, failures print a diagnostic report (miette) and exit non-zero.

## Global behavior

- On launch, the CLI ensures the **bundled corelib** tree is available (and may print a short message when it materializes or updates a copy). Override the source location with `BESKID_CORELIB_SOURCE` when developing against a different corelib checkout.
- Subcommands that need a single resolved `.bd` entrypoint accept optional `--project`, `--target`, and `--workspace-member` together with `--frozen` / `--locked` where project resolution applies (see [analyze](/book/reference/cli/commands/analyze/), [doc](/book/reference/cli/commands/doc/), [run](/book/reference/cli/commands/run/), [build](/book/reference/cli/commands/build/), [clif](/book/reference/cli/commands/clif/), [fetch](/book/reference/cli/commands/fetch/)).

## Commands

| Command | Summary |
| --- | --- |
| [`dev`](/book/reference/cli/commands/dev/) | Group the supported developer aliases |
| [`parse`](/book/reference/cli/commands/parse/) | Parse a `.bd` file and print a debug AST view |
| [`tree`](/book/reference/cli/commands/tree/) | Print a textual AST tree |
| [`analyze`](/book/reference/cli/commands/analyze/) | Run semantic analysis and print diagnostics |
| [`format` / `fmt`](/book/reference/cli/commands/format/) | Pretty-print sources (file or recursive directory) |
| [`doc`](/book/reference/cli/commands/doc/) | Emit `api.json` and `index.md` for API docs |
| [`clif`](/book/reference/cli/commands/clif/) | Lower to CLIF and print IR |
| [`run`](/book/reference/cli/commands/run/) | AOT-compile, link, and execute in a subprocess |
| [`test`](/book/reference/cli/commands/test/) | Discover, filter, and run `test` items with the current JIT test engine |
| [`repl`](/book/reference/cli/commands/repl/) | Evaluate snippets in an interactive JIT session |
| [`build`](/book/reference/cli/commands/build/) | AOT compile and link |
| [`mod`](/book/reference/cli/commands/mod/) | Build and clean compiler Mod AOT artifacts |
| [`import`](/book/reference/cli/commands/import/) | Resolve a supported foreign library into link metadata |
| [`fetch`](/book/reference/cli/commands/fetch/) | Resolve and materialize dependencies |
| [`lock`](/book/reference/cli/commands/lock/) | Synchronize `Project.lock` |
| [`update`](/book/reference/cli/commands/update/) | Update resolution and materialized workspace |
| [`corelib`](/book/reference/cli/commands/corelib/) | Materialize embedded corelib template |
| [`runtime-kit`](/book/reference/cli/commands/runtime-kit/) | Build exact ABI-v5 native runtime kits |
| [`new`](/book/reference/cli/commands/new/) | List, install, and instantiate project/workspace/item templates |
| [`pckg`](/book/reference/cli/commands/pckg/) | **pckg** registry client: `pack` (`.bpk` with exact semver), `upload` (artifact-bound version), search, download, yank, … |
| [`graph`](/book/reference/cli/commands/graph/) | Render project and workspace graphs |
| [`hi`](/book/reference/cli/commands/hi/) | Open the project-aware terminal dashboard |
| [`lsp`](/book/reference/cli/commands/lsp/) | Run or install the language server |
| [`up`](/book/reference/cli/commands/up/) | Inspect and select direct-install versions |
| [`validate-bsol`](/book/reference/cli/commands/validate-bsol/) | Validate a BSOL document against a profile |
| [`migrate-bsol`](/book/reference/cli/commands/migrate-bsol/) | Migrate a BSOL document to a selected profile |

The grouped aliases are documented once on the [`beskid dev`](/book/reference/cli/commands/dev/) page. `fmt` is the visible alias for `beskid format`. Use the concise root command in procedures and automation.

The pinned compiler revision contains retired manifest names in some command comments. Its resolver implementation requires `.bproj` and `.bws`. This reference uses the implemented file contract. The compiler owner must correct the stale comments in a compiler-owned change.
