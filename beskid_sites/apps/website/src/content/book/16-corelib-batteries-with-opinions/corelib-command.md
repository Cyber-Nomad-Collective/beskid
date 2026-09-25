---
title: "The corelib command"
description: Materialize the embedded corelib workspace when you want to read, patch, or build against the standard library on disk.
tableOfContents: true
---

The CLI binary embeds the corelib workspace it was built with. Normally that stays inside the binary and the resolver reads it from there. When you want the tree on disk, for reading, for a fix, or for pointing a build at a modified copy, you materialize it.

```bash
beskid corelib
beskid corelib --output ./vendor/corelib
```

The default destination is `corelib/` under the current directory. What lands there is the whole workspace: `CoreLib.bws`, `packages/`, and `beskid_corelib/`. If the destination already is the bundled template location, the command prints the path and does nothing, because copying a tree over itself is not work.

## Building against your copy

```bash
BESKID_CORELIB_SOURCE=./vendor/corelib beskid build --project ./MyApp.bproj --target App
```

`BESKID_CORELIB_SOURCE` tells the resolver to inject that tree instead of the embedded one. This is the loop for a standard library change: materialize, edit, set the variable, build the thing that exercises the edit, run `beskid test` on `corelib_tests`. The embedded copy is untouched, so unsetting the variable gets you back to a known state without reinstalling anything.

Do not ship with the variable set. A production build that resolves the standard library from a path on one developer's laptop is a build nobody else can reproduce, and the lockfile will faithfully record that path for posterity.

## Identity

The package the resolver injects is named `corelib`. Its manifest is `beskid_corelib/corelib.bproj`, and its dependencies are the `corelib_*` packages under `packages/`. `corelib_foundation` is where `Core.*` lives, `corelib_concurrency` is chapter 11, `corelib_network` and `corelib_http` are two pages from here. Their manifests are ordinary `.bproj` files and chapter 03 applies to them without exception.

Contracts: [corelib discovery and packaging](/platform-spec/core-library/compiler-integration/corelib-discovery-and-packaging/). Command reference: [beskid corelib](/book/reference/cli/commands/corelib/).
