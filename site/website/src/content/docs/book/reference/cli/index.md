---
title: "Beskid CLI"
description: "Command-line interface for parsing, analysis, formatting, compilation, and package workflows."
---

The `beskid` binary is the primary interface for local development, CI, and editor integrations. It provisions the embedded **corelib** template on startup when needed, then dispatches to a subcommand.

The global `--log-cranelift` flag enables Cranelift JIT and codegen backend logs. It is also available through `BESKID_LOG_CRANELIFT=1`.

## Where to go next

- [Command reference](/book/reference/cli/command-reference/) — index of all subcommands; each command has its own page under [`/book/reference/cli/commands/`](/book/reference/cli/commands/parse/).
- [Formatter internals](/book/reference/cli/formatter-development/) — how `Emit` / `EmitCtx` work for contributors extending the pretty-printer.
- [LSP guide](/book/reference/lsp/) — document formatting uses the same engine as `beskid format`.
- [Package client CLI](/book/18-packages-without-npm-trauma/pckg-cli/) — registry-oriented workflows and package docs.
- [beskid new](/book/reference/cli/commands/new/) — template list, install, and instantiate.
- [Package command reference](/book/reference/cli/commands/pckg/) — registry operations through `beskid pckg`.
- [Task-oriented tooling guidance](/docs/tooling/) — build, run, test, and CI procedures.

## Quick examples

```bash
beskid run Main.bd
beskid new console --name MyApp --output ./MyApp
beskid analyze --project path/to/App.bproj --plain
beskid build --project path/to/App.bproj --release --plain
beskid test --project path/to/App.bproj --plain
beskid graph --project path/to/App.bproj --mermaid
```

`beskid new` instantiation requires exactly one template selector and an output path. Use a short name such as `console`, or use one of `--package`, `--path`, and `--git`. See the [new command](/book/reference/cli/commands/new/) for `--tui` and registry authentication flags.

Install prebuilt binaries from [Downloads](/downloads/) or build from the compiler repository.
