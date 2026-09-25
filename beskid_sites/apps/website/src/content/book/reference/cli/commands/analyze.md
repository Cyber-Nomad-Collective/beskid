---
title: "beskid analyze"
description: "Run semantic analysis and print diagnostics for a Beskid program."
---

Runs built-in semantic rules over a resolved source file (or project entrypoint) and prints diagnostics to the terminal.

## Arguments

| Argument | Description |
| --- | --- |
| `[INPUT]` | Optional path to a `.bd` file |
| `--project` | Project directory or `.bproj` manifest path |
| `--target` | Target name from the manifest |
| `--workspace-member` | Workspace member when resolving via a `.bws` workspace manifest |
| `--frozen` | Require lockfile match; forbid updates |
| `--locked` | Require an existing lockfile |

## Notes

- When no diagnostics are reported, the command prints a short success message.
- Project resolution flags match other project-aware commands (`doc`, `run`, `build`, `clif`, `fetch`).

## Example

```bash
beskid analyze --project path/to/MyApp.bproj
```

[← Back to CLI command reference](/book/reference/cli/command-reference/)
