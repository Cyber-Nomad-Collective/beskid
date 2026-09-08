---
title: "beskid parse"
description: "Root parse command; run as `beskid parse`."
---

Parse one `.bd` file and print a debug representation of the parsed program.
This is the `beskid parse` root command. A grouped discovery alias is listed on the [`beskid dev`](/book/reference/cli/commands/dev/) page.

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

For the first source checks, use [Your first program](/docs/getting-started/first-program/).

[← Back to CLI command reference](/book/reference/cli/command-reference/)
