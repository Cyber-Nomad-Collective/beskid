---
title: "Beskid CLI"
description: "Command-line interface for parsing, analysis, formatting, compilation, and package workflows."
---

The `beskid` binary is the primary interface for local development, CI, and editor integrations. It provisions the embedded **corelib** template on startup when needed, then dispatches to a subcommand.

## Where to go next

- [Command reference](/guides/cli/command-reference/) — index of all subcommands; each command has its own page under [`/guides/cli/commands/`](/guides/cli/commands/parse/).
- [Formatter internals](/guides/cli/formatter-development/) — how `Emit` / `EmitCtx` work for contributors extending the pretty-printer.
- [LSP guide](/guides/lsp/) — document formatting uses the same engine as `beskid format`.
- [Package client CLI](/packages/client-cli/) — implemented `beskid pckg` vs planned `beskid pkg`.
- [beskid pckg](/guides/cli/commands/pckg/) — pack, upload, and registry subcommands.

## Quick examples

```bash
beskid analyze path/to/file.bd
beskid test path/to/file.bd
beskid format path/to/file.bd --write
beskid fmt path/to/src --write
beskid format path/to/tree --check
beskid build --project path/to/Project.proj
```

Install prebuilt binaries from [Downloads](/downloads/) or build from the compiler repository.
