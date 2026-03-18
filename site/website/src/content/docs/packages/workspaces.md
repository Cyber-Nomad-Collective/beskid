---
title: Workspaces
description: Multi-project package management with `Workspace.proj`.
---

## Purpose

`Workspace.proj` enables monorepo workflows with shared dependency policies and deterministic resolution across multiple `Project.proj` members.

## Minimal shape

```text
workspace {
  name = "BeskidRoot"
  resolver = "v1"
}

member "compiler" {
  path = "compiler"
}

registry "default" {
  url = "https://pckg.beskid-lang.org"
}
```

## Supported blocks

- `workspace` (required)
  - `name` (required)
  - `resolver` (optional, default: `v1`)
- `member "<label>"`
  - `path` (required, relative)
- `override "<dependency>"`
  - `version` (required)
- `registry "<name>"`
  - `url` (required)

## Validation rules

- Member paths must be relative and cannot use `..`.
- Member labels must be unique.
- Override labels must be unique.
- Registry labels must be unique.

## Resolution precedence

1. Workspace overrides.
2. Member-local `Project.proj` constraints.
3. Registry defaults.

This ensures deterministic and centralized dependency governance.
