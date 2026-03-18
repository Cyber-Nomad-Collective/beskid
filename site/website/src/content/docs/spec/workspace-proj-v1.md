---
title: Workspace Proj v1
description: Grammar and validation rules for `Workspace.proj`.
---

## Supported blocks

- `workspace { ... }` (required)
- `member "<label>" { ... }`
- `override "<dependency>" { ... }`
- `registry "<name>" { ... }`

## Fields

### workspace

- `name` (required)
- `resolver` (optional, default `v1`)

### member

- `path` (required, relative)

### override

- `version` (required)

### registry

- `url` (required)

## Validation

- member paths must be relative and cannot contain parent traversal.
- labels in each block category must be unique.
- required fields must be non-empty.

## Resolution semantics

Workspace overrides apply before member-local dependency constraints.
