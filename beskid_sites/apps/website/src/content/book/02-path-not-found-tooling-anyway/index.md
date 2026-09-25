---
title: "PATH not found — tooling anyway"
description: File types, CLI discovery, VS Code + LSP, logging flags, and where the reference manuals hide.
tableOfContents: true
---

You have a binary. Now you need a **workflow** that does not devolve into `grep` archaeology every time the compiler disagrees with your mental model.

This chapter folds the old "tooling and editors" material into something you can actually use: what files exist, how discovery works, how the extension talks to the same project graph as the CLI, and where to read when you want every flag documented.

## By the end of this chapter

- Know which file extensions mean what.
- Configure editor support for `.bd` and `.bproj`/`.bws`.
- Know where CLI vs LSP vs analysis share the same manifest model.
