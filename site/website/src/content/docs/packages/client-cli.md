---
title: Package Client CLI
description: `beskid pkg` command model for auth, dependency management, and publish workflows.
---

## Command groups

- `beskid pkg login`
- `beskid pkg whoami`
- `beskid pkg search <query>`
- `beskid pkg add <id>[@range]`
- `beskid pkg remove <id>`
- `beskid pkg install`
- `beskid pkg publish [--dry-run]`
- `beskid pkg yank <id> <version>`
- `beskid pkg unyank <id> <version>`

## Auth flow

`login` exchanges user credentials or API key for a scoped token stored in the local CLI credentials store. `whoami` validates current token and returns account role metadata (`User`, `Publisher`, `SuperAdmin`).

## Dependency workflow

1. `pkg add` updates `Project.proj` dependency block.
2. `pkg install` resolves + downloads dependencies.
3. `Project.lock` is synchronized and integrity fields are persisted.
4. `pkg remove` updates both manifest and lock on next install/update.

## Publish workflow

1. `pkg publish --dry-run` validates package structure and metadata locally.
2. `pkg publish` creates deterministic `.bpk` and uploads it.
3. Server returns accepted/rejected diagnostics with machine-readable codes.

## Exit and diagnostics policy

- Non-zero exit codes for resolver, auth, transport, or validation failures.
- Structured stderr with diagnostic code prefixes (example: `E30xx`, `PCKG4xx`).
- Human + JSON output modes for CI consumption.
