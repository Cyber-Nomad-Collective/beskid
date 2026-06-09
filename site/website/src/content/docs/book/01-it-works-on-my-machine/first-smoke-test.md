---
title: "First smoke test"
description: Minimal commands to prove the CLI parses and analyzes Beskid source.
tableOfContents: true
---

Before you create a `Project.proj` cathedral, prove the toolchain can read a `.bd` file on disk.

## Version check

```bash
beskid --version
```

Record the output when filing bugs. Rolling builds move; "latest" is not a version string.

## Parse a snippet

Create `hello.bd` anywhere (no project required for parse):

```beskid
unit Main() {
    // smoke
}
```

```bash
beskid parse hello.bd
```

You should get a debug AST view, not a stack trace about missing manifests. If parse fails on syntax you copied from this book, the book is wrong—file an issue.

## Analyze (semantic pass)

```bash
beskid analyze hello.bd
```

Analysis needs more context as programs grow; for a one-off file, flags may differ from project-scoped workflows. Once you have `Project.proj`, prefer:

```bash
beskid analyze --project path/to/Project.proj
```

See [analyze command](/book/reference/cli/commands/analyze/).

## Optional: format and tree

```bash
beskid format hello.bd
beskid tree hello.bd
```

Formatting is the fastest way to settle bike-shed wars. `tree` is the ASCII tourist map of the AST—useful when you suspect the parser saw your file differently than you did.

```mermaid
flowchart LR
  parse[parse] --> tree[tree]
  parse --> analyze[analyze]
  analyze --> format[format]
```

## What success looks like

- Exit code zero (unless you intentionally broke the file).
- Diagnostics printed in a readable report (miette-style) when you break types on purpose later.
- No mystery about which binary ran (`which beskid`).

## Next

[Troubleshooting install](/book/01-it-works-on-my-machine/troubleshooting-install/)