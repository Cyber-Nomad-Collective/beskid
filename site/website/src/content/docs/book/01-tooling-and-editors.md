---
title: "01. Tooling and Editors"
description: Set up your local workflow with the CLI, project discovery, and editor tooling.
---

This chapter gets your development environment into a reliable state before language work begins.

## By the end of this chapter

- Know the file types Beskid tools expect.
- Understand how CLI and analysis discover projects.
- Configure editor support for `.bd` and `.proj` files.

## Before you start

You only need a local clone and a terminal. If you have not built from source yet, use the install instructions on [Downloads](/downloads/).

## Core tooling entry points

- Beskid source files use `.bd`.
- Project and workspace manifests use `.proj`.
- Compiler and analysis tools discover `Project.proj` from the current path or from an explicit `--project` input.
- Workspace-aware discovery can resolve member projects through `Workspace.proj`.
- Language services (LSP) use the same project model as analysis and CLI.

## Editor workflow

- VS Code-compatible support is provided by the Beskid extension.
- The extension uses the `beskid` language id for `.bd` and `beskid-proj` for `.proj` (manifest highlighting and the same LSP).
- You can run the bundled LSP binary or point to a local development binary.
- Install from Open VSX: [beskid-vscode](https://open-vsx.org/extension/beskid/beskid-vscode)

## Deep dive in spec and guides

- [Guides / CLI](/guides/cli/)
- [Guides / LSP](/guides/lsp/)
- [Projects guide](/guides/projects/)

## Next

Continue with [02. Projects and Targets](/book/02-projects-and-targets/).
