---
title: "beskid test"
description: "Discover and execute Beskid `test` items with filtering and skip handling."
---

Run Beskid test items declared with `test Name { ... }`.
This command is available as `beskid test`.

## Usage

```bash
beskid test [INPUT] [--project <path>] [--target <name>] [--workspace-member <name>]
```

## Options

- `--include-tag <tag>` (repeatable): run only tests containing any included tag
- `--exclude-tag <tag>` (repeatable): exclude tests containing any excluded tag
- `--group <prefix>`: run only tests whose `meta.group` starts with `<prefix>`
- `--json`: print JSON summary and per-test records
- `--plain`: disable animated progress and graph output
- `--all-targets`: run all Test targets in one process with one prepared workspace
- `--frozen` / `--locked` / `--offline`: lock and network policy (same behavior as other project-aware commands)
- `--target-timeout <seconds>`: execution budget for each target before it is reported as timed out (also `BESKID_TARGET_TIMEOUT_SECS`; the flag wins)
- `--matrix-timeout <seconds>`: execution budget for the whole `--all-targets` matrix; default 1800 (also `BESKID_MATRIX_TIMEOUT_SECS`; the flag wins)

## Behavior

- Tests are discovered from parsed source (`test` items at top-level and inline modules).
- The runner compiles the selected tests into one AOT object, links a separate native entry for each test, and runs each test in a fresh process. It needs the same ABI-v5 runtime kit as `beskid run`.
- `skip.condition = true` marks a test as skipped and bypasses execution.
- Exit code is non-zero when any test fails.

## Example

```bash
beskid test Src/Harness.bd --include-tag fast --group analysis
```
