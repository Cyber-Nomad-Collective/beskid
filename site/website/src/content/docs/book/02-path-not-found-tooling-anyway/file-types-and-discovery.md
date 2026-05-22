---
title: "File types and discovery"
description: 'Beskid .bd sources, .proj manifests, and how CLI/LSP find your project from the cwd.'
tableOfContents: true
---

Beskid tooling is boring on purpose: **files on disk** tell the truth. No hidden solution file maintained by a plugin from 2014.

## The file zoo

| Extension / name | Role |
| --- | --- |
| `*.bd` | Beskid source |
| `Project.proj` | Single-project manifest (HCL-like blocks) |
| `Workspace.proj` | Multi-project workspace manifest |
| `Project.lock` | Resolved dependency lock (generated/maintained by tooling) |

Enum-like manifest fields (`kind`, `source`) are usually written **without** quotes (`kind = App`, `source = path`); quoted strings remain valid. See [Project manifest](/book/reference/projects/manifest/).

## Discovery model

From the current working directory, tools walk upward (or accept explicit flags) to locate `Project.proj`. Workspace-aware flows also understand `Workspace.proj` members.

```mermaid
flowchart TD
  cwd[Current directory] --> up[Walk parents]
  up --> found{Project.proj?}
  found -->|yes| root[Project root]
  found -->|no| fail[Explicit --project required]
  root --> lock[Project.lock + obj/beskid]
```

CLI commands that need a resolved entrypoint accept optional `--project`, `--target`, and `--workspace-member`, plus `--frozen` / `--locked` where resolution applies—see [CLI command reference](/book/reference/cli/command-reference/).

## Language services use the same graph

The LSP does not get a parallel universe. Editor diagnostics, go-to-definition, and analysis share the manifest model with `beskid analyze` / `beskid build`. When the editor disagrees with the CLI, suspect **different roots or versions**, not "LSP magic."

## Normative contracts

- [Project manifest contract](/platform-spec/tooling/manifests-and-lockfiles/project-manifest-contract/)
- [Workspace and lock contracts](/platform-spec/tooling/manifests-and-lockfiles/workspace-and-lock-contracts/)

## Next

[VS Code and LSP](/book/02-path-not-found-tooling-anyway/vscode-and-lsp/)
