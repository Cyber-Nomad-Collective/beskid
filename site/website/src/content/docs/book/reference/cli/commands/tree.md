---
title: "beskid tree"
description: "Print a textual AST tree for a Beskid source file."
---

Parse one `.bd` file and print a hierarchical visualization of the AST.
This is the `beskid tree` root command. A grouped discovery alias is listed on the [`beskid dev`](/book/reference/cli/commands/dev/) page.

## Arguments

| Argument | Description |
| --- | --- |
| `<INPUT>` | Required path to a `.bd` file |

## Example

```bash
beskid tree src/Main.bd
```

For the first source checks, use [Your first program](/docs/getting-started/first-program/).

[← Back to CLI command reference](/book/reference/cli/command-reference/)
