---
title: "beskid lock"
description: "Synchronize Project.lock for a project."
---

Runs the resolver to synchronize **`Project.lock`** for the selected project.
This command is available as `beskid lock`.

## Arguments

| Argument | Description |
| --- | --- |
| `--project` | Project directory or `App.bproj` path |
| `--target` | Target name from the manifest |
| `--workspace-member` | Workspace member when resolving via `Workspace.bws` |
| `--plain` | Disable animated resolve progress |

## Example

```bash
beskid lock --project path/to/App.bproj
```

For lockfile behavior and recovery, use [Dependencies and locks](/docs/projects/dependencies-and-locks/).

[← Back to CLI command reference](/book/reference/cli/command-reference/)
