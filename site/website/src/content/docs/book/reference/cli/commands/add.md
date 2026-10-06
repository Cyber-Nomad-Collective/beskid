---
title: "beskid add"
description: "Add a project dependency and resolve its lock."
---

`beskid add <PACKAGE>` adds one dependency to the selected project and resolves its lock in one transaction. The manifest and the lock change together or not at all.

`<PACKAGE>` is a package name. Append `@<version>` for an exact version. Without a version, the command records the greatest stable, non-yanked semantic version that the registry offers. Ranges and Git dependencies are not supported.

## Arguments

| Argument | Description |
| --- | --- |
| `<PACKAGE>` | Package name, optionally followed by `@<version>`. Required |
| `--path` | Local project dependency path, relative to the selected project directory |
| `--project` | Project directory or `App.bproj` path |
| `--frozen` | Resolve from the lock and the verified cache only. Combines `--locked` and `--offline` |
| `--locked` | Require an existing lock that matches the resolution |
| `--offline` | Forbid network requests and use verified cached artifacts only |

## Example

```bash
beskid add Acme.Math --project path/to/App.bproj
beskid add Acme.Math@1.2.0
beskid add Acme.Shared --path ../Shared
```

For lockfile behavior and recovery, use [Dependencies and locks](/docs/projects/dependencies-and-locks/).

[← Back to CLI command reference](/book/reference/cli/command-reference/)
