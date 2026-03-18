---
title: Project Lock v1
description: Normative lockfile format and behavior.
---

## Header

`Project.lock` starts with versioned header metadata and root manifest identity.

## Dependency record fields

- `name`
- `version`
- `source`
- `registry` (if source is registry)
- `artifactDigest`
- `descriptor`

## Modes

- default: allow updates
- locked: require existing up-to-date lock
- frozen: forbid mutations

## Determinism requirements

- sorted dependency entries
- stable serialization shape
- strict digest checking during restore/install

## Failure modes

- missing lock in locked mode
- stale lock in locked mode
- any lock mutation attempt in frozen mode
- digest mismatch during package materialization
