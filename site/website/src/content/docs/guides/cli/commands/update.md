---
title: "beskid update"
description: "Update dependency resolution and the materialized workspace."
---

Refreshes dependency resolution and updates the materialized workspace (resolver run with “update” semantics).

## Arguments

| Argument | Description |
| --- | --- |
| `--project` | Project directory or `Project.proj` path |
| `--target` | Target name from the manifest |
| `--workspace-member` | Workspace member when resolving via `Workspace.proj` |

## Example

```bash
beskid update --project path/to/Project.proj
```

[← Back to CLI command reference](/guides/cli/command-reference/)
