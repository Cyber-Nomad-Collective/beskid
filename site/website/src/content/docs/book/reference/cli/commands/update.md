---
title: "beskid update"
description: "Update selected project dependencies."
---

`beskid update <PACKAGE>` updates one dependency. `beskid update --all` updates every dependency. The command requires one of these two forms.

## Arguments

| Argument | Description |
| --- | --- |
| `<PACKAGE>` | Package to update. Required unless you pass `--all` |
| `--all` | Update all dependencies. Conflicts with `<PACKAGE>` and `--version` |
| `--version` | Exact version for the named package. Requires `<PACKAGE>` |
| `--dry-run` | Plan the update without writing files |
| `--project` | Project directory or `App.bproj` path |
| `--frozen`, `--locked`, `--offline` | Lock and network policy |

## Example

```bash
beskid update Acme.Math --project path/to/App.bproj
beskid update --all --dry-run
```

For lockfile behavior and recovery, use [Dependencies and locks](/docs/projects/dependencies-and-locks/).

[← Back to CLI command reference](/book/reference/cli/command-reference/)
