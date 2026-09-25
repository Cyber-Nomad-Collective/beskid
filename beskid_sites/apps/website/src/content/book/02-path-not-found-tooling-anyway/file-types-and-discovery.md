---
title: "File types and discovery"
description: 'Beskid .bd sources, .bproj/.bws manifests, and how CLI/LSP find your project from the cwd.'
tableOfContents: true
---

Beskid tooling is boring on purpose: **files on disk** tell the truth. No hidden solution file maintained by a plugin from 2014.

## The file zoo

| Extension / name | Role |
| --- | --- |
| `*.bd` | Beskid source |
| `<name>.bproj` | Single-project manifest (`project.v1`, written in Bsol) |
| `<name>.bws` | Multi-project workspace manifest (`workspace.v1`) |
| `Project.lock` | Resolved dependency lock (generated/maintained by tooling) |

The older `Project.proj` and `Workspace.proj` names are gone; a current toolchain rejects them outright (E1894 and E1895, respectively, each telling you what to rename the file to). See [Project manifest](/book/reference/projects/manifest/) for the full block reference, including the rule that a manifest's root block kind must equal its `name`.

## Discovery model

From the current working directory, tools walk upward (or accept explicit flags) to locate a `.bproj` manifest. Workspace-aware flows also understand `.bws` members.

CLI commands that need a resolved entrypoint accept optional `--project`, `--target`, and `--workspace-member`, plus `--frozen` / `--locked` where resolution applies; see [CLI command reference](/book/reference/cli/command-reference/).

## Language services use the same graph

The LSP does not get a parallel universe. Editor diagnostics, go-to-definition, and analysis share the manifest model with `beskid analyze` / `beskid build`. When the editor disagrees with the CLI, suspect **different roots or versions**, not "LSP magic."

See [Project manifest contract](/platform-spec/tooling/manifests-and-lockfiles/project-manifest-contract/) and [Workspace and lock contracts](/platform-spec/tooling/manifests-and-lockfiles/workspace-and-lock-contracts/) for the normative versions of the rules above.
