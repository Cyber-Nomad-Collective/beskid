---
title: "Lockfile (`Project.lock`)"
description: Beskid Project Lockfile (`Project.lock`)
---


`Project.lock` records resolved dependency identities for deterministic builds.

## File location

- Path: `<project-root>/Project.lock`

## Lifecycle rules (v1)

1. If lockfile is missing during resolve/build/run, create it automatically.
2. If dependency graph identity changes, update lockfile automatically.
3. Build/run uses lockfile as the authoritative resolved graph snapshot.
4. Future strict modes can disable lock updates (`--frozen`) or require lock presence (`--locked`).

## Minimal schema (conceptual)

- Root project identity (`name`, `version`, canonical manifest path).
- Resolved dependencies list:
  - package identity
  - source kind (`path` in v1)
  - source descriptor (canonical path)
  - source root
  - dependency aliases
- Graph metadata:
  - deterministic projection order
  - lock format version

## v1 source-provider behavior

- `path`: lock entry created from canonical manifest path and source root.
- `git`, `registry`: not enabled in runtime scope; lock generation fails with provider diagnostics.

## Failure modes

- Read error (`E3020`): failed to read lockfile.
- Parse error (`E3021`): malformed lockfile content.
- Out-of-date lock (`E3022`): lock does not match resolved graph.
- Frozen mismatch (`E3023`): update required but forbidden in frozen mode.
- Source mismatch (`E3024`): lock entry does not match resolved source identity.

## Relationship to materialization

- Lock sync happens before dependency materialization.
- Materialization consumes lock-resolved identities and writes to `obj/beskid/deps/src`.
- Build stages consume materialized roots only.

## Interop migration note

When `Std` is a dependency, `Project.lock` must reflect `Std` resolution identity before compilation proceeds.
