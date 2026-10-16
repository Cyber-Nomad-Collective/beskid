---
title: "The `beskid test` CLI"
description: Discover, filter, and summarize Beskid test items from the command line.
tableOfContents: true
---

The CLI does not care about your feelings. It cares about **discovery**, **skip predicates**, and a non-zero exit code when something fails.

## Basic run

```bash
beskid test path/to/Harness.bd
beskid test --project path/to/App.bproj
```

See [beskid test reference](/book/reference/cli/commands/test/) for full flags (`--target`, `--workspace-member`, lockfile modes).

## Execution model

`beskid test` compiles the project once into a single AOT object, then runs each selected test in a fresh native process. Tests do not share state, and a crashing test fails alone. The JIT engine is not involved; only `beskid dev repl` still uses it.

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

Buckets: `passed`, `failed`, `skipped`, `filtered_out`. CI parsers should treat **skipped** separately from **failed**, unless your team uses skip as passive-aggressive deletion, in which case fix the culture, not the JSON.

## Wiring to analysis

`beskid test` shares project resolution with `beskid build` and `beskid check`: same graph, same lockfile story. If resolution fails, no tests run, by design.

## Normative tooling

- [Build / analyze / run contract](/docs/standard/capabilities/tooling--cli--build-analyze-run-contract/)
- [Testing reference](/book/reference/testing/)

## Next

[Arrange, act, assert](/book/08-green-tests-red-production/arrange-act-assert/)
