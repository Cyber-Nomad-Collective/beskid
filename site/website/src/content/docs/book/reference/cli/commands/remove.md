---
title: "beskid remove"
description: "Remove a project dependency."
---

`beskid remove <PACKAGE>` removes one dependency from the selected project and updates its lock in one transaction. The manifest and the lock change together or not at all.

## Arguments

| Argument | Description |
| --- | --- |
| `<PACKAGE>` | Package to remove. Required |
| `--project` | Project directory or `App.bproj` path |
| `--frozen` | Resolve from the lock and the verified cache only. Combines `--locked` and `--offline` |
| `--locked` | Require an existing lock that matches the resolution |
| `--offline` | Forbid network requests and use verified cached artifacts only |

## Example

```bash
beskid remove Acme.Math --project path/to/App.bproj
```

For lockfile behavior and recovery, use [Dependencies and locks](/docs/projects/dependencies-and-locks/).

[← Back to CLI command reference](/book/reference/cli/command-reference/)
