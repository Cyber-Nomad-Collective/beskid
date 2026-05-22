---
title: "PATH not found — tooling anyway"
description: File types, CLI discovery, VS Code + LSP, logging flags, and where the reference manuals hide.
tableOfContents: true
---

You have a binary. Now you need a **workflow** that does not devolve into `grep` archaeology every time the compiler disagrees with your mental model.

This chapter folds the old "tooling and editors" material into something you can actually use: what files exist, how discovery works, how the extension talks to the same project graph as the CLI, and where to read when you want every flag documented.

## What you will find here

| Section | Topic |
| --- | --- |
| [File types and discovery](/book/02-path-not-found-tooling-anyway/file-types-and-discovery/) | `.bd`, `.proj`, `Project.proj`, `Workspace.proj`. |
| [VS Code and LSP](/book/02-path-not-found-tooling-anyway/vscode-and-lsp/) | Extension, language ids, bundled vs local LSP. |
| [CLI tour](/book/02-path-not-found-tooling-anyway/cli-tour/) | Subcommands you will touch in week one. |
| [Logging and debug flags](/book/02-path-not-found-tooling-anyway/logging-and-debug-flags/) | Progress, verbosity, and not drowning in noise. |
| [Reference deep dives](/book/02-path-not-found-tooling-anyway/reference-deep-dives/) | Pointers to CLI/LSP/project reference trees. |

## By the end of this chapter

- Know which file extensions mean what.
- Configure editor support for `.bd` and `.proj`.
- Know where CLI vs LSP vs analysis share the same manifest model.

## Previous

[01. It works on my machine](/book/01-it-works-on-my-machine/)

## Next

[03. Project.proj or it didn't happen](/book/03-project-proj-or-it-didnt-happen/)
