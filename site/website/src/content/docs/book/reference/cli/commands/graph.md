---
title: "beskid dev project graph"
description: "Render the project, workspace, module, import, or host graph as Mermaid or a terminal graph."
---

`beskid dev project graph [INPUT]` resolves a project and renders one of its graphs. The root command `beskid graph` was removed in 0.6.0.

The command prints Mermaid text by default. The terminal renderer starts only when you pass `--tui`.

## Arguments

| Argument | Description |
| --- | --- |
| `[INPUT]` | Optional `.bd` path (with `--project` resolution) |
| `--project` | Project directory or `App.bproj` path |
| `--target` | Target name from the manifest |
| `--workspace-member` | Workspace member when resolving via `Workspace.bws` |
| `--frozen` | Resolve from the lock and the verified cache only |
| `--locked` | Require an existing lockfile |
| `--offline` | Forbid network requests; use verified cached dependency artifacts only |
| `--kind` | Graph kind: `project` (default), `workspace`, `module`, `imports`, or `host` |
| `--mermaid` | Print Mermaid text |
| `--tui` | Render the graph in the terminal |
| `--out` | Write the Mermaid text to this file instead of printing it |
| `--plain` | Disable animated progress |

## Example

```bash
beskid dev project graph --project path/to/App.bproj --mermaid
beskid dev project graph --project path/to/App.bproj --kind imports --out imports.mmd
```

[← Back to CLI command reference](/book/reference/cli/command-reference/)
