---
title: Workspace Monorepo Setup
description: Configure a multi-project Beskid repository with shared dependency policy.
---

## Layout example

```text
Workspace.proj
compiler/Project.proj
compiler/corelib/beskid_corelib/Project.proj
tools/Project.proj
```

## Define workspace

```text
workspace {
  name = "BeskidRoot"
  resolver = "v1"
}

member "compiler" { path = "compiler" }
member "corelib" { path = "compiler/corelib/beskid_corelib" }
member "tools" { path = "tools" }

registry "default" {
  url = "https://pckg.beskid-lang.org"
}
```

## Apply shared overrides

Use `override` blocks to pin critical dependency versions across all members.

## Operate in CI

- run installs in `--locked` mode for safety
- run release pipelines in `--frozen` mode
- fail on lock drift to keep reproducibility

## Recommended policy

- avoid parent-relative member paths
- keep registry aliases centralized in workspace root
- commit lockfiles for all release branches
