---
title: "CLI command reference"
description: "Index of beskid subcommands: links to per-command documentation."
---

Arguments can be expanded from response files using the `@file` convention (via the `argfile` crate), consistent with other Rust CLI tools.

Unless noted, failures print a diagnostic report (miette) and exit non-zero.

## Global behavior

- On launch, the CLI ensures the **bundled corelib** tree is available (and may print a short message when it materializes or updates a copy). Override the source location with `BESKID_CORELIB_SOURCE` when developing against a different corelib checkout.
- Subcommands that need a single resolved `.bd` entrypoint accept optional `--project`, `--target`, and `--workspace-member` together with `--frozen` / `--locked` where project resolution applies (see `run`, and developer areas under [syntax](/book/reference/cli/commands/parse/), [build](/book/reference/cli/commands/build/), [doc](/book/reference/cli/commands/doc/), [core](/book/reference/cli/commands/fetch/)).

## Primary commands

| Command | Summary |
| --- | --- |
| [`run`](/book/reference/cli/commands/run/) | JIT-compile and execute |
| [`publish`](/book/reference/cli/commands/publish/) | Release build with registry-ready defaults |
| [`new`](/book/reference/cli/commands/new/) | List, install, and instantiate project/workspace/item templates |
| [`get`](/book/reference/cli/commands/pckg/) | Show package metadata and version history |
| [`search`](/book/reference/cli/commands/pckg/) | Search packages in the registry |
| [`install`](/book/reference/cli/commands/pckg/) | Install one package artifact |
| [`rm`](/book/reference/cli/commands/pckg/) (`remove`) | Remove cached artifacts |

## Developer surface (hidden under `dev`)

The remaining CLI tools are stable and supported, but they are intentionally grouped under `beskid dev`:

- `beskid dev syntax` -> `parse`, `tree`, `analyze`, `format`, `doc`, `clif`
- `beskid dev build` -> `compile`, `test`, `corelib`, `mod`, `repl`
- `beskid dev project` -> `fetch`, `lock`, `update`, `import`, `graph`
- `beskid dev package` -> `registry` (legacy registry maintenance commands)
- `beskid dev runtime-kit` -> runtime-kit build workflow
- `beskid dev tooling` -> LSP, token, and environment maintenance commands

Use `beskid dev <subcommand> --help` for details of each area.
