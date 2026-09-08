---
title: Tooling
description: Use the Beskid command line tools for analysis, formatting, builds, and language-service support.
audience:
  - developer
authority:
  status: informative
  sourceLabel: Beskid CLI reference
  sourceHref: /book/reference/cli/
  limits: This page groups verified tool tasks. It does not define command semantics.
verified:
  revision: 252aa528ac7ee01a64e49e9b88b32393206fbd71
  date: 2026-09-08
---

The `beskid` command is the main tool interface. Run `beskid --help` before you guess a command or an option.

## Check source code

Use semantic analysis to parse source, resolve names, and check types.

```bash
beskid dev syntax analyze --project path/to/Project.proj
```

The input can be a source file or a project entry point. Read the [analysis reference](/book/reference/cli/commands/analyze/) for all options.

## Format source code

Use the canonical formatter for one file or a directory.

```bash
beskid dev syntax format src --check
```

Use `--write` to change files. Use `--check` in CI to report formatting drift without changing files.

## Build source code

Use ahead-of-time compilation to create an object file, a library, or an executable.

```bash
beskid dev build compile --project path/to/Project.proj --release
```

The command needs a valid resolved project and the matching runtime kit for executable or library output.

## Use the language server

`beskid_lsp` provides diagnostics and completion data to editor clients. Install it with the toolchain. The Beskid Learn editor and supported development tools use the same compiler-backed language service.

Read the [language-service reference](/book/reference/lsp/) for architecture and troubleshooting information.
