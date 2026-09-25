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
| [`parse`](/book/reference/cli/commands/parse/) | Parse a `.bd` file and print a debug AST view |
| [`tree`](/book/reference/cli/commands/tree/) | Print a textual AST tree |
| [`analyze`](/book/reference/cli/commands/analyze/) | Run semantic analysis and print diagnostics |
| [`format` / `fmt`](/book/reference/cli/commands/format/) | Pretty-print sources (file or recursive directory) |
| [`doc`](/book/reference/cli/commands/doc/) | Emit `api.json` and `index.md` for API docs |
| [`clif`](/book/reference/cli/commands/clif/) | Lower to CLIF and print IR |
| [`run`](/book/reference/cli/commands/run/) | AOT-compile and execute a Beskid file in a subprocess |
| [`test`](/book/reference/cli/commands/test/) | Discover, filter, and run `test` items (in-process JIT) |
| `repl` | Evaluate expression/statement snippets in an interactive JIT REPL |
| [`build`](/book/reference/cli/commands/build/) | AOT compile and link |
| `mod` | Manage compiler Mod AOT artifacts |
| `import` | Import foreign libraries (`lib <name>`) into the `.bproj` manifest's `link` metadata |
| [`fetch`](/book/reference/cli/commands/fetch/) | Resolve and materialize dependencies |
| [`lock`](/book/reference/cli/commands/lock/) | Synchronize `Project.lock` |
| [`update`](/book/reference/cli/commands/update/) | Update resolution and materialized workspace |
| [`corelib`](/book/reference/cli/commands/corelib/) | Materialize embedded corelib template |
| `runtime-kit` | Build and install target/profile-specific ABI-v5 native runtime kits |
| [`new`](/book/reference/cli/commands/new/) | List, install, and instantiate project/workspace/item templates |
| [`pckg`](/book/reference/cli/commands/pckg/) | **pckg** registry client: `pack` (`.bpk`), `upload` (registry-assigned version), search, download, yank, … |
| `graph` | Visualize project/workspace/module/import/host graphs (`--kind`, `--mermaid`) |
| `hi` | Open the pluggable Beskid dashboard shell (workspace/project/user scoped) |
| `lsp` | Run the Beskid language server on stdio, or install a release binary (`beskid lsp install`) |
| `up` | Check and manage direct-download Beskid toolchain versions |
| `validate-bsol` | Validate a BSOL document against a schema profile |
| `migrate-bsol` | Migrate a BSOL document to a newer schema profile version |
| `dev` | Developer-oriented command groups; concise root commands above remain available as shortcuts |
