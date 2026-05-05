---
title: "05. Workspaces and Monorepos"
description: Manage multiple Beskid projects with shared policy and reproducible resolution.
---

Use `Workspace.proj` when a repository has multiple Beskid projects that should share policy and dependency constraints.

## By the end of this chapter

- Understand when to introduce `Workspace.proj`.
- Use members, overrides, and registries intentionally.
- Keep multi-project builds reproducible.

## Workspace building blocks

- `workspace { ... }` defines workspace identity and resolver.
- `member "<label>" { path = "..." }` adds project members.
- `override "<dep>" { version = "..." }` enforces shared versions.
- `registry "<name>" { url = "..." }` centralizes registry endpoints.

## Why use workspaces

- Reproducible multi-project builds.
- Shared dependency override policy.
- Cleaner CI flows for lock and resolution validation.

## Deep dive in spec and guides

- [Workspace and lock contracts](/platform-spec/tooling/manifests-and-lockfiles/workspace-and-lock-contracts/)
- [Workspace Monorepo Setup](/guides/workspace-monorepo/)
- [Project Resolution](/guides/projects/resolution/)

## Next

Continue with [06. Public API Idioms](/book/06-public-api-idioms/).
