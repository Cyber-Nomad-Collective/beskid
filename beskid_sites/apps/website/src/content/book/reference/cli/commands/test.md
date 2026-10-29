---
title: "beskid test"
description: "Discover and execute Beskid `test` items with filtering and skip handling."
---

Run Beskid test items declared with `test Name { ... }`.

## Usage

```bash
beskid test [input] [--project <path>] [--target <name>] [--workspace-member <name>]
```

## Options

- `--include-tag <tag>` (repeatable): run only tests containing any included tag
- `--exclude-tag <tag>` (repeatable): exclude tests containing any excluded tag
- `--group <prefix>`: run only tests whose `meta.group` starts with `<prefix>`
- `--json`: print JSON summary and per-test records
- `--frozen` / `--locked`: project resolution lockfile controls (same behavior as other project-aware commands)

## Behavior

- Tests are discovered from parsed source (`test` items at top-level and inline modules).
- Without `--target`, `beskid test` runs every `kind = Test` target in manifest order, then prints a `Total:` line for all targets. With `--json` it writes one `result` record with a `targets` list. When the project has no Test target, it runs the Lib target. A project with only an App target has no tests.
- `skip.condition = true` marks a test as skipped and bypasses execution.
- Exit code is non-zero when any test or any target fails.

## Example

```bash
beskid test Src/Harness.bd --include-tag fast --group analysis
```
