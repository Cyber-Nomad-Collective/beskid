---
title: "The beskid test CLI"
description: Discover, filter, and summarize Beskid test items from the command line.
tableOfContents: true
---

The CLI does not care about your feelings. It cares about **discovery**, **skip predicates**, and a non-zero exit code when something fails.

## Basic run

```bash
beskid test path/to/Harness.bd
beskid test --project path/to/Project.bproj --target Tests
```

Tests run **in-process**, through the JIT engine, one of only two places the JIT survives in the toolchain (`beskid repl` is the other). `beskid run` and `beskid build` are AOT and have nothing to do with how `beskid test` executes; do not expect JIT-only bugs to show up there, or AOT-only bugs to show up here.

See [beskid test reference](/book/reference/cli/commands/test/) for full flags (`--target`, `--workspace-member`, lockfile modes).

## Filtering

```bash
beskid test Src/Harness.bd --include-tag fast --group analysis
beskid test Src/Harness.bd --exclude-tag slow
```

- **`--include-tag`**: run only tests whose `meta.tags` contain a tag (repeatable).
- **`--exclude-tag`**: drop tests with matching tags.
- **`--group`**: prefix match on `meta.group`.

## Machine-readable output

```bash
beskid test Src/Harness.bd --json
```

Buckets: `passed`, `failed`, `skipped`, `filtered_out`. CI parsers should treat **skipped** separately from **failed**. Unless your team uses skip as passive-aggressive deletion, in which case fix the culture, not the JSON.

## Wiring to analysis

`beskid test` shares project resolution with `build` and `analyze`: same graph, same lockfile story. If resolution fails, no tests run, by design. See the [build / analyze / run contract](/platform-spec/tooling/cli/build-analyze-run-contract/) for the shared resolution rules.
