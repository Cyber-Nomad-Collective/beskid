---
title: "beskid analyze"
description: "Developer command to run semantic analysis and print diagnostics."
---

Runs built-in semantic rules over a resolved source file (or project entrypoint) and prints diagnostics to the terminal.
This command is available as `beskid analyze`.

## Arguments

| Argument | Description |
| --- | --- |
| `[INPUT]` | Optional path to a `.bd` file |
| `--project` | Project directory or `App.bproj` path |
| `--target` | Target name from the manifest |
| `--workspace-member` | Workspace member when resolving via `Workspace.bws` |
| `--frozen` | Require lockfile match; forbid updates |
| `--locked` | Require an existing lockfile |

## Notes

- When no diagnostics are reported, the command prints a short success message.
- Project resolution flags match other project-aware commands (`beskid doc`, `run`, `beskid build`, `beskid clif`, `beskid fetch`).

## Example

```bash
beskid analyze --project path/to/App.bproj
```

For the executable check sequence and recovery steps, use [Build, run, and test](/docs/tooling/build-run-test/).

[← Back to CLI command reference](/book/reference/cli/command-reference/)
