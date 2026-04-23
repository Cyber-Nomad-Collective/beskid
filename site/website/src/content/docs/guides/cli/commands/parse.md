---
title: "beskid parse"
description: "Parse a Beskid file and print a debug view of the AST."
---

Parse one `.bd` file and print a debug representation of the parsed program.

## Arguments

| Argument | Description |
| --- | --- |
| `<INPUT>` | Required path to a `.bd` file |
| `--format debug` | Output style (only `debug` is supported today) |

## Notes

- Uses the same parser pipeline as other analysis commands.
- On failure, diagnostics use the normal CLI error reporting (miette).

## Example

```bash
beskid parse src/Main.bd
```

[← Back to CLI command reference](/guides/cli/command-reference/)
