---
title: "beskid lock"
description: "Synchronize Project.lock for a project."
---

Runs the resolver to synchronize **`Project.lock`** for the selected project. Unlike `update`, messaging focuses on lockfile synchronization rather than a broader workspace refresh narrative.

## Arguments

| Argument | Description |
| --- | --- |
| `--project` | Project directory or `Project.proj` path |
| `--target` | Target name from the manifest |
| `--workspace-member` | Workspace member when resolving via `Workspace.proj` |

## Example

```bash
beskid lock --project path/to/Project.proj
```

[← Back to CLI command reference](/guides/cli/command-reference/)
