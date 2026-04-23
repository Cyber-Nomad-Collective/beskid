---
title: "beskid run"
description: "JIT-compile and execute a Beskid program."
---

JIT-compiles a resolved Beskid program and runs an entrypoint function, printing the result to stdout.

## Arguments

| Argument | Description |
| --- | --- |
| `[INPUT]` | Optional `.bd` entry |
| `--project` | Project directory or `Project.proj` path |
| `--target` | Target name from the manifest |
| `--workspace-member` | Workspace member when resolving via `Workspace.proj` |
| `--frozen` | Require lockfile match; forbid updates |
| `--locked` | Require an existing lockfile |
| `--entrypoint` | Function name to run (default `main`) |

## Example

```bash
beskid run --project path/to/Project.proj --entrypoint main
```

[← Back to CLI command reference](/guides/cli/command-reference/)
