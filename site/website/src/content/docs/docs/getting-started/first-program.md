---
title: Write and check a program
description: Create a small Beskid program and use semantic analysis to check it.
---

# Write and check a program

Create `Main.bd` with one entry function.

```beskid
i32 Main() {
  return 0;
}
```

`Main` is the entry function for this program. `i32` is its return type. The return value `0` is the normal success exit code.

## Check the source

Run the analysis command from the directory that contains `Main.bd`.

```bash
beskid dev syntax analyze Main.bd
```

Fix every diagnostic before you build or run the program. Analysis checks the source but does not link an executable.

## Format the source

Print the canonical format for one file.

```bash
beskid dev syntax format Main.bd
```

Write the canonical format back to the file when you want to update it.

```bash
beskid dev syntax format Main.bd --write
```

Use `--check` in automation when you only want to detect formatting drift.

```bash
beskid dev syntax format Main.bd --check
```

## Build an artifact

Use the build command when the source passes analysis.

```bash
beskid dev build compile Main.bd --kind exe
```

The compiler uses ahead-of-time compilation. It links the matching installed runtime kit for executable and library outputs.

## Document annotation

**Status:** informative.

**Command source:** [analyze](/book/reference/cli/commands/analyze/), [format](/book/reference/cli/commands/format/), and [compile](/book/reference/cli/commands/build/) are the command references. The standard remains the authority for language behavior.
