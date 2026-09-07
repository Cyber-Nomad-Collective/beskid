---
title: "beskid doc"
description: "Emit API documentation (api.json v4 + index.md) for a resolved Beskid program."
---

Resolves a Beskid entrypoint (optional file path plus project flags), parses and resolves the program (including multi-file assembly when `--project` is used), and writes API documentation artifacts to disk.

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

### `api.json` (schema version 4)

The root object includes:

- **`schemaVersion`**: integer `4` (consumers must gate on this field; `3` remains supported without v4-only fields).
- **`navigationModel`**: `"graph-v1"` when resolution succeeded — build navigation from **`parentId`** / **`memberIds`** only, not from splitting `qualifiedName`.
- **`generator`**, **`source`**, **`items`**: metadata and a flat list of **all resolved API symbols** (documented or not).

Each item includes location, visibility, `kind`, names, graph ids, and compiler-derived **`signature`**, **`typeAnnotation`** fields (`fieldType`, `returnType`, `parameters`), plus optional documentation:

- **`docMarkdown`** (optional): rendered Markdown for hovers and human-facing docs (same template the LSP uses for rich text).
- **`doc`** (optional, object): structured fields: `summaryMarkdown`, `returnsMarkdown`, `arguments`, `enumVariants`, `typeParameters`. Derived from the same parse tree as `docMarkdown`.

See the [api.json contract](/platform-spec/tooling/cli/api-json-contract/design-model/) in the platform specification for normative field definitions.

Older consumers that only understand schema version `2` should treat unknown `schemaVersion` values as unsupported and fall back to Markdown-only fields when present.

### `index.md`

Human-oriented index page generated alongside `api.json` for browsing in repositories or static doc hosts.

## Layout in projects

When run as part of packaging, artifacts are written under **`<sourceRoot>/.beskid/docs/`** (for example `.beskid/docs/api.json`). The `beskid pckg pack` command copies those paths into the archive and records a `documentation` pointer in the embedded `package.json` so registries can open `api.json` without path heuristics.

## Example

```bash
beskid doc --project path/to/Project.proj --out doc-out
```

[← Back to CLI command reference](/book/reference/cli/command-reference/)
