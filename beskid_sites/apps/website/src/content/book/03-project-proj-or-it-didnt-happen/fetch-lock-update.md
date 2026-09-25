---
title: "Fetch, lock, update"
description: "The manifest declares intent. Project.lock records what happened. Three commands keep them honest."
tableOfContents: true
---

Every package manager eventually learns the same lesson: what you asked for and what you got are different files. Beskid starts with that separation instead of retrofitting it.

| Command | What it does |
| --- | --- |
| `beskid fetch` | Resolve the dependency graph and materialize sources under `obj/beskid` |
| `beskid lock` | Write `Project.lock` to match the current resolution |
| `beskid update` | Re-resolve and refresh the materialized tree, rewriting the lock |

All three accept `--project`, `--target`, and `--workspace-member`, and share the two lockfile policies:

- `--locked` requires that a lockfile exists and matches what resolution would produce now. Mismatch fails.
- `--frozen` is `--locked` plus a ban on writing the lockfile. This is the CI flag.

A pipeline that runs `beskid fetch --frozen` fails when someone edited a manifest and forgot to run `lock`. That failure is the point. The alternative is discovering the drift when production resolves a different folder than the one you tested.

## What the lock actually contains

`Project.lock` is a flat text file, versioned, and readable in a diff without tooling:

```text
# Project.lock v1
root_manifest=/home/you/MyApp/MyApp.bproj
project_name=MyApp
dependencies:
- name=Inventory;manifest=/home/you/Inventory/Inventory.bproj;project=/home/you/Inventory;source_root=/home/you/Inventory/Src;materialized_root=obj/beskid/deps/src/Inventory-9cd57d122395daf1
```

One line per resolved package: where its manifest was, where its sources were, and the hashed directory the sources were copied into. When a review shows a lock diff you can read which dependency moved and where it moved to. Compare that with a 400-line `package-lock.json` change from adding one dev dependency.

Commit the lock. The argument "it is generated" is true of every artifact that makes a build reproducible, and it is a bad argument for all of them.

## When the lock changes

Expect a diff after you add, remove, or repoint a dependency, after a path dependency's manifest moves, and after a toolchain upgrade changes resolution rules. Do not expect one from editing source files. If `lock` rewrites the file and you did none of those things, the resolver's view of the world changed under you, and that is worth understanding before you commit it.

Contracts for the lockfile and workspace-level locking are in the [workspace and lock contracts](/platform-spec/tooling/manifests-and-lockfiles/workspace-and-lock-contracts/); the [lockfile reference](/book/reference/projects/lockfile/) walks the format field by field.
