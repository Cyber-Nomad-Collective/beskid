---
title: "The `beskid dev build test` CLI"
description: Discover, filter, and summarize Beskid test items from the command line.
tableOfContents: true
---

The CLI does not care about your feelings. It cares about **discovery**, **skip predicates**, and a non-zero exit code when something fails.

## Basic run

```bash
beskid dev build test path/to/Harness.bd
beskid dev build test --project path/to/Project.proj
```

See [beskid dev build test reference](/book/reference/cli/commands/test/) for full flags (`--target`, `--workspace-member`, lockfile modes).

## Filtering

```bash
beskid dev build test Src/Harness.bd --include-tag fast --group analysis
beskid dev build test Src/Harness.bd --exclude-tag slow
```

- **`--include-tag`** — run only tests whose `meta.tags` contain a tag (repeatable).
- **`--exclude-tag`** — drop tests with matching tags.
- **`--group`** — prefix match on `meta.group`.

## Machine-readable output

```bash
beskid dev build test Src/Harness.bd --json
```

Buckets: `passed`, `failed`, `skipped`, `filtered_out`. CI parsers should treat **skipped** separately from **failed**—unless your team uses skip as passive-aggressive deletion, in which case fix the culture, not the JSON.

## Wiring to analysis

`beskid dev build test` shares project resolution with `beskid dev build compile` and `beskid dev syntax analyze`: same graph, same lockfile story. If resolution fails, no tests run—by design.

## Normative tooling

- [Build / analyze / run contract](/platform-spec/tooling/cli/build-analyze-run-contract/)
- [Testing reference](/book/reference/testing/)

## Next

[Arrange, act, assert](/book/08-green-tests-red-production/arrange-act-assert/)
