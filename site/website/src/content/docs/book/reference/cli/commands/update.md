---
title: "beskid update"
description: "Update dependency resolution and the materialized workspace."
---

Refreshes dependency resolution and updates the materialized workspace (resolver run with “update” semantics).
This command is available as `beskid update`.

## Arguments

| Argument | Description |
| --- | --- |
| `--project` | Project directory or `App.bproj` path |
| `--target` | Target name from the manifest |
| `--workspace-member` | Workspace member when resolving via `Workspace.bws` |
| `--plain` | Disable animated resolve progress |

## Example

```bash
beskid update --project path/to/App.bproj
```

For lockfile behavior and recovery, use [Dependencies and locks](/docs/projects/dependencies-and-locks/).

[← Back to CLI command reference](/book/reference/cli/command-reference/)
