---
title: "beskid dev build test"
description: "Discover and execute Beskid `test` items with filtering and skip handling."
---

Run Beskid test items declared with `test Name { ... }`.
This command is available as `beskid dev build test`.

## Usage

```bash
beskid dev build test [input] [--project <path>] [--target <name>] [--workspace-member <name>]
```

## Options

- `--include-tag <tag>` (repeatable): run only tests containing any included tag
- `--exclude-tag <tag>` (repeatable): exclude tests containing any excluded tag
- `--group <prefix>`: run only tests whose `meta.group` starts with `<prefix>`
- `--json`: print JSON summary and per-test records
- `--frozen` / `--locked`: project resolution lockfile controls (same behavior as other project-aware commands)

## Behavior

- Tests are discovered from parsed source (`test` items at top-level and inline modules).
- `skip.condition = true` marks a test as skipped and bypasses execution.
- Exit code is non-zero when any test fails.

## Example

```bash
beskid dev build test Src/Harness.bd --include-tag fast --group analysis
```
