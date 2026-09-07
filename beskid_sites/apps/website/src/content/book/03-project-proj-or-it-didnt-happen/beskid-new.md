---
title: "beskid new"
description: Templates for projects, workspaces, and items—scaffolding without copy-paste archaeology.
tableOfContents: true
---

Hand-rolling `Project.proj` is educational exactly once. After that, use **`beskid new`**.

## What `new` covers

The `new` subcommand lists, installs, and instantiates **templates** for:

- Projects (with sensible `project` / `target` / `dependency` stubs)
- Workspaces (when you already know you live in monorepo hell)
- Individual items (files/modules) inside an existing tree

See [new command](/book/reference/cli/commands/new/) and [project scaffolding](/book/reference/projects/scaffolding/).

## Typical first project

From an empty directory (flags exact names in reference):

```bash
beskid new project --name MyApp
```

You should get `Project.proj`, a `Src/` tree, and entry file paths that actually resolve. If not, your template checkout is stale—not your moral failure.

## Corelib on new projects

New projects expect the standard library to be reachable—tooling may materialize corelib via bundled templates (`corelib` command). When developing corelib itself, point `BESKID_CORELIB_SOURCE` at your checkout.

## When *not* to use templates

- You are merging into an existing repo with established layout conventions.
- You are converting a foreign build system—read [resolution](/book/reference/projects/resolution/) before forcing paths.

## Next

[Fetch, lock, update](/book/03-project-proj-or-it-didnt-happen/fetch-lock-update/)
