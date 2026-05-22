---
title: "Testing Framework"
description: "How to author, tag, skip, filter, and run Beskid tests."
---

This guide describes the practical workflow for Beskid test harness usage.

Language-level syntax is normative in `/platform-spec/language-meta/contracts-and-effects/testing/`.

## Authoring tests

```beskid
test ParseFast {
    meta {
        tags = "fast,parser";
        group = "analysis.parser";
    }
    skip {
        condition = false;
        reason = "set true to disable temporarily";
    }
    return;
}
```

Recommended conventions:
- use stable, descriptive names (`ParseFast`, `ResolverDuplicateNames`)
- keep `tags` focused on execution intent (`fast`, `slow`, `integration`)
- use `group` for hierarchical ownership (`analysis.parser`, `cli.test`)
- always provide a `skip.reason` when a test is intentionally disabled

## Running tests

Use the CLI test command:

```bash
beskid test path/to/file.bd
```

Filtering:

```bash
beskid test path/to/file.bd --include-tag fast --group analysis
beskid test path/to/file.bd --exclude-tag slow
```

Machine-readable output:

```bash
beskid test path/to/file.bd --json
```

## Result buckets

The test command reports:
- `passed`
- `failed`
- `skipped`
- `filtered_out`

`skip.condition = true` produces `skipped` before execution.

## Assertions and helpers

Corelib assertion primitives live in `docs/corelib/Testing/`.
