---
title: "Beskid CLI"
description: "Command-line interface for parsing, analysis, formatting, compilation, and package workflows."
---

The `beskid` binary is the primary interface for local development, CI, and editor integrations. It provisions the embedded **corelib** template on startup when needed, then dispatches to a subcommand.

## Where to go next

- [Command reference](/book/reference/cli/command-reference/) — index of all subcommands; each command has its own page under [`/book/reference/cli/commands/`](/book/reference/cli/commands/parse/).
- [Formatter internals](/book/reference/cli/formatter-development/) — how `Emit` / `EmitCtx` work for contributors extending the pretty-printer.
- [LSP guide](/book/reference/lsp/) — document formatting uses the same engine as `beskid dev syntax format`.
- [Package client CLI](/book/18-packages-without-npm-trauma/pckg-cli/) — registry-oriented workflows and package docs.
- [beskid new](/book/reference/cli/commands/new/) — template list, install, and instantiate.
- [Legacy pckg workflows](/book/reference/cli/commands/pckg/) — now invoked via `beskid dev package registry ...`.

## Quick examples

```bash
beskid run main.bd
beskid publish main.bd
beskid install corelib@0.1.2
beskid search template
beskid get my-library
beskid rm legacy-lib@0.2.0
beskid new console

beskid dev syntax parse path/to/file.bd
beskid dev build compile --project path/to/Project.proj
beskid dev build test path/to/file.bd
beskid dev project graph path/to/Project.proj
```

Install prebuilt binaries from [Downloads](/downloads/) or build from the compiler repository.
