---
title: "beskid lock"
description: "Synchronize Project.lock for a project."
---

Runs the resolver to synchronize **`Project.lock`** for the selected project. Unlike `update`, messaging focuses on lockfile synchronization rather than a broader workspace refresh narrative.

## Arguments

| Argument | Description |
| --- | --- |
| `--project` | Project directory or `.bproj` manifest path |
| `--target` | Target name from the manifest |
| `--workspace-member` | Workspace member when resolving via a `.bws` workspace manifest |

## Example

```bash
beskid lock --project path/to/MyApp.bproj
```

[← Back to CLI command reference](/book/reference/cli/command-reference/)
