---
title: "beskid doc"
description: "Emit API documentation (api.json v2 + index.md) for a resolved Beskid program."
---

Resolves a Beskid entrypoint (optional file path plus project flags), parses and resolves the program, and writes API documentation artifacts to disk.

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

### `api.json` (schema version 2)

The root object includes:

- **`schemaVersion`**: integer `2` (bump when adding breaking JSON shape changes; consumers must gate on this field).
- **`generator`**, **`source`**, **`items`**: stable metadata and a flat list of documented symbols.

Each item includes location, visibility, `kind`, names, and documentation in two shapes:

- **`docMarkdown`** (optional): rendered Markdown for hovers and human-facing docs (same template the LSP uses for rich text).
- **`doc`** (optional, object): structured fields for registry and tooling: `summaryMarkdown`, `returnsMarkdown`, `arguments` (callable parameters), `enumVariants` (from `@variant` on enums), and `typeParameters` (from `@par` on types, enums, or functions with generics). These are derived from the same doc parse tree as `docMarkdown`, so they do not drift.

Older consumers that only understand schema version `1` should treat unknown `schemaVersion` values as unsupported and fall back to Markdown-only fields when present.

### `index.md`

Human-oriented index page generated alongside `api.json` for browsing in repositories or static doc hosts.

## Layout in projects

When run as part of packaging, artifacts are written under **`<sourceRoot>/.beskid/docs/`** (for example `.beskid/docs/api.json`). The `beskid pckg pack` command copies those paths into the archive and records a `documentation` pointer in the embedded `package.json` so registries can open `api.json` without path heuristics.

## Example

```bash
beskid doc --project path/to/Project.proj --out doc-out
```

[← Back to CLI command reference](/guides/cli/command-reference/)
