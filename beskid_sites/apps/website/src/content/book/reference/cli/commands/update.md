---
title: "beskid update"
description: "Update dependency resolution and the materialized workspace."
---

Refreshes dependency resolution and updates the materialized workspace (resolver run with “update” semantics).

## Arguments

| Argument | Description |
| --- | --- |
| `--project` | Project directory or `.bproj` manifest path |
| `--target` | Target name from the manifest |
| `--workspace-member` | Workspace member when resolving via a `.bws` workspace manifest |

## Example

```bash
beskid update --project path/to/MyApp.bproj
```

[← Back to CLI command reference](/book/reference/cli/command-reference/)
