---
title: "beskid format"
description: "Pretty-print Beskid sources with the canonical formatter (alias: fmt)."
---

Pretty-print Beskid sources using the **canonical formatter** (`beskid_analysis::format::format_program`). This is the same layout engine as the LSP **document formatting** request.

The subcommand is also available as **`beskid fmt`** (alias).

`<INPUT>` may be a single `.bd` file or a **directory**. Directories are walked recursively for `*.bd` files (case-insensitive extension). Common bulky trees are skipped: `.git`, `target`, `node_modules`, `dist`, `.venv`, `vendor`, `__pycache__`, and similar.

## Arguments

| Argument | Description |
| --- | --- |
| `<INPUT>` | Path to a `.bd` file or a directory to scan |
| `-w`, `--write` | Overwrite each discovered file with formatted output |
| `-o`, `--output <PATH>` | Valid only for a **single** input file: write there instead of stdout |
| `--check` | Verify each file is already formatted; exit with error on the first mismatch (CI) |

`--write`, `--output`, and `--check` are mutually exclusive.

## Behavior

- **Single file, no flags:** formatted text goes to **stdout**; a one-line summary (timing) goes to **stderr**.
- **Directory:** requires `--write` or `--check`. When finished, **stderr** reports how many `.bd` files were formatted or checked and elapsed time (units scale automatically: ns, µs, ms, or s). For `--check`, each file on disk is compared to the formatter output for that file (so golden **`.expected.bd`** trees are appropriate for CI; raw **`.input.bd`** corpora are not).
- **Parse errors** propagate as errors (no partial output).
- The formatter does **not** preserve ordinary comments or non-semantic trivia; only structured `///` leading docs carried on the AST are emitted.

For implementation details, see [Formatter internals](/guides/cli/formatter-development/).

## Examples

```bash
# Print formatted source to stdout (one file only)
beskid format src/Main.bd

# Rewrite in place
beskid format src/Main.bd --write

# Same as format; format every .bd under src/
beskid fmt src --write

# CI: verify already-canonical sources (e.g. golden *.expected.bd)
find tests/fixtures/format -name '*.expected.bd' -print0 | xargs -0 -I{} beskid format {} --check
```

[← Back to CLI command reference](/guides/cli/command-reference/)
