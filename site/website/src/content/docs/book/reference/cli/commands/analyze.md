---
title: "beskid dev syntax analyze"
description: "Developer command to run semantic analysis and print diagnostics."
---

Runs built-in semantic rules over a resolved source file (or project entrypoint) and prints diagnostics to the terminal.
This command is available as `beskid dev syntax analyze`.

## Arguments

| Argument | Description |
| --- | --- |
| `[INPUT]` | Optional path to a `.bd` file |
| `--project` | Project directory or `Project.proj` path |
| `--target` | Target name from the manifest |
| `--workspace-member` | Workspace member when resolving via `Workspace.proj` |
| `--frozen` | Require lockfile match; forbid updates |
| `--locked` | Require an existing lockfile |

## Notes

- When no diagnostics are reported, the command prints a short success message.
- Project resolution flags match other project-aware commands (`beskid dev syntax doc`, `run`, `beskid dev build compile`, `beskid dev syntax clif`, `beskid dev project fetch`).

## Example

```bash
beskid dev syntax analyze --project path/to/Project.proj
```

[← Back to CLI command reference](/book/reference/cli/command-reference/)
