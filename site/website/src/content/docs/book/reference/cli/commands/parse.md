---
title: "beskid dev syntax parse"
description: "Root parse command; run as `beskid dev syntax parse`."
---

Parse one `.bd` file and print a debug representation of the parsed program.
The command is `beskid dev syntax parse`. The root command `beskid parse` was removed in 0.6.0. See the [`beskid dev`](/book/reference/cli/commands/dev/) page.

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
beskid dev syntax parse src/Main.bd
```

For the first source checks, use [Your first program](/docs/getting-started/first-program/).

[← Back to CLI command reference](/book/reference/cli/command-reference/)
