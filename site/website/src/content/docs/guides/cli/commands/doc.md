---
title: "beskid doc"
description: "Emit API documentation (api.json + index.md) for a resolved source file."
---

Resolves a Beskid entrypoint (optional file path plus project flags), parses the program, and writes API documentation artifacts to disk.

## Arguments

| Argument | Description |
| --- | --- |
| `[INPUT]` | Optional `.bd` path (with `--project` resolution) |
| `--project` | Project directory or `Project.proj` path |
| `--target` | Target name from the manifest |
| `--workspace-member` | Workspace member when resolving via `Workspace.proj` |
| `--frozen` | Require lockfile match; forbid updates |
| `--locked` | Require an existing lockfile |
| `--out` | Output directory (default `doc-out`); receives `api.json` and `index.md` |

## Output

- `api.json` — structured API snapshot for tooling.
- `index.md` — human-oriented index page generated alongside.

## Example

```bash
beskid doc --project path/to/Project.proj --out doc-out
```

`beskid pckg pack` invokes this generation flow automatically and stores output in `<source>/.beskid/docs`.

[← Back to CLI command reference](/guides/cli/command-reference/)
