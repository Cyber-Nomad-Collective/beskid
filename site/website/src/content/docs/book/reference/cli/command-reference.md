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
| [`run`](/book/reference/cli/commands/run/) | JIT-compile and execute |
| [`test`](/book/reference/cli/commands/test/) | Discover, filter, and run `test` items |
| [`build`](/book/reference/cli/commands/build/) | AOT compile and link |
| [`fetch`](/book/reference/cli/commands/fetch/) | Resolve and materialize dependencies |
| [`lock`](/book/reference/cli/commands/lock/) | Synchronize `Project.lock` |
| [`update`](/book/reference/cli/commands/update/) | Update resolution and materialized workspace |
| [`corelib`](/book/reference/cli/commands/corelib/) | Materialize embedded corelib template |
| [`new`](/book/reference/cli/commands/new/) | List, install, and instantiate project/workspace/item templates |
| [`pckg`](/book/reference/cli/commands/pckg/) | **pckg** registry client: `pack` (`.bpk`), `upload` (registry-assigned version), search, download, yank, … |
