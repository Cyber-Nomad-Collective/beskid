---
title: "CLI command reference"
description: "Index of beskid subcommands: links to per-command documentation."
---

Arguments can be expanded from response files using the `@file` convention (via the `argfile` crate), consistent with other Rust CLI tools.

Unless noted, failures print a diagnostic report (miette) and exit non-zero.

## Global behavior

- On launch, the CLI ensures the **bundled corelib** tree is available (and may print a short message when it materializes or updates a copy). Override the source location with `BESKID_CORELIB_SOURCE` when developing against a different corelib checkout.
- Subcommands that need a single resolved `.bd` entrypoint accept optional `--project`, `--target`, and `--workspace-member` together with `--frozen` / `--locked` where project resolution applies (see [analyze](/guides/cli/commands/analyze/), [doc](/guides/cli/commands/doc/), [run](/guides/cli/commands/run/), [build](/guides/cli/commands/build/), [clif](/guides/cli/commands/clif/), [fetch](/guides/cli/commands/fetch/)).

## Commands

| Command | Summary |
| --- | --- |
| [`parse`](/guides/cli/commands/parse/) | Parse a `.bd` file and print a debug AST view |
| [`tree`](/guides/cli/commands/tree/) | Print a textual AST tree |
| [`analyze`](/guides/cli/commands/analyze/) | Run semantic analysis and print diagnostics |
| [`format` / `fmt`](/guides/cli/commands/format/) | Pretty-print sources (file or recursive directory) |
| [`doc`](/guides/cli/commands/doc/) | Emit `api.json` and `index.md` for API docs |
| [`clif`](/guides/cli/commands/clif/) | Lower to CLIF and print IR |
| [`run`](/guides/cli/commands/run/) | JIT-compile and execute |
| [`test`](/guides/cli/commands/test/) | Discover, filter, and run `test` items |
| [`build`](/guides/cli/commands/build/) | AOT compile and link |
| [`fetch`](/guides/cli/commands/fetch/) | Resolve and materialize dependencies |
| [`lock`](/guides/cli/commands/lock/) | Synchronize `Project.lock` |
| [`update`](/guides/cli/commands/update/) | Update resolution and materialized workspace |
| [`corelib`](/guides/cli/commands/corelib/) | Materialize embedded corelib template |
| [`pckg`](/guides/cli/commands/pckg/) | **pckg** registry client: `pack` (`.bpk`), `upload` (registry-assigned version), search, download, yank, … |
