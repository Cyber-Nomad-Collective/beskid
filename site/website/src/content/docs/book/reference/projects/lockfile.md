---
title: "Lockfile (`Project.lock`)"
description: Beskid Project Lockfile (`Project.lock`)
---


`Project.lock` records resolved dependency identities for deterministic builds.

## File location

- Path: `<project-root>/Project.lock`

## Lifecycle rules

1. If lockfile is missing during resolve/build/run, create it automatically.
2. If dependency graph identity changes, update lockfile automatically.
3. Build/run uses lockfile as the authoritative resolved graph snapshot.
4. `--frozen` forbids an update. `--locked` requires an existing file and forbids an update.
5. The first line of the file is `# Project.lock v3`. A file with a different first line has an unsupported format. No command reads or changes it. Delete the file and run `beskid dev project lock` to write a new one.

## Minimal schema (conceptual)

- Root project identity (`name`, `version`, canonical manifest path).
- Resolved dependencies list:
  - package identity
  - source kind (`path` or `registry`)
  - source descriptor (canonical path)
  - source root
  - dependency aliases
- Graph metadata:
  - deterministic projection order
  - lock format version

## Source-provider behavior

- `path`: records the canonical manifest, source root, and materialized root.
- `registry`: records the selected version, registry alias when present, and materialized root.
- `git`: is not materialized by the current workflow and fails before compilation.

## Failure modes

- Read error (`E3020`): failed to read lockfile.
- Parse error (`E3021`): malformed lockfile content.
- Out-of-date lock (`E3022`): lock does not match resolved graph.
- Frozen mismatch (`E3023`): update required but forbidden in frozen mode.
- Unsupported format (`E3025`): the first line is not `# Project.lock v3`. Delete the file and write a new lock.

## Relationship to materialization

- Lock sync happens before dependency materialization.
- Materialization consumes lock-resolved identities and writes to `obj/beskid/deps/src`.
- Build stages consume materialized roots only.

## Interop migration note

`Project.lock` records the Corelib dependency under the label `Core`. The lock must contain this identity before compilation starts.
