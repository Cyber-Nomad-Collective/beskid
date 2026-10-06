---
title: "beskid fmt"
description: "Pretty-print Beskid sources with the canonical formatter ."
---

Pretty-print Beskid sources using the **canonical formatter** (`beskid_analysis::format::format_program`).
The root command is `beskid fmt`. The root command `beskid format` was removed in 0.6.0.

`<INPUT>` may be a single `.bd` file or a **directory**. Directories are walked recursively for `*.bd` files (case-insensitive extension). Common bulky trees are skipped: `.git`, `target`, `node_modules`, `dist`, `.venv`, `vendor`, `__pycache__`, and similar.

## Arguments

| Argument | Description |
| --- | --- |
| `<INPUT>` | Path to a `.bd` file or a directory to scan. The default is `.` |
| `-o`, `--output <PATH>` | Valid only for a **single** input file: write there instead of changing the input |
| `--check` | Verify each file is already formatted; exit with error on the first mismatch (CI) |

`--output` and `--check` conflict. The 0.6.0 command has no `--write` option and no `-w` option.

## Behavior

- **Default:** the command formats each discovered file in place.
- **Directory:** the command formats every `.bd` file under the directory. When finished, **stderr** reports how many files were formatted or checked and elapsed time. For `--check`, each file on disk is compared to the formatter output for that file (so golden **`.expected.bd`** trees are appropriate for CI; raw **`.input.bd`** corpora are not).
- **Parse errors** propagate as errors (no partial output).
- The formatter does **not** preserve ordinary comments or non-semantic trivia; only structured `///` leading docs carried on the AST are emitted.

For implementation details, see [Formatter internals](/book/reference/cli/formatter-development/).

## Examples

```bash
# Format one file in place
beskid fmt src/Main.bd

# Format every .bd under src/
beskid fmt src

# Write the formatted text of one file to another path
beskid fmt src/Main.bd --output out/Main.bd

# CI: verify already-canonical sources (e.g. golden *.expected.bd)
find compiler/crates/beskid_tests_surface/fixtures/format -name '*.expected.bd' -print0 | xargs -0 -I{} beskid fmt {} --check
```

For CI use, use the [CI procedure](/docs/tooling/ci/).

[← Back to CLI command reference](/book/reference/cli/command-reference/)
