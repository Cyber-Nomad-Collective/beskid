---
title: Package Format (`.bpk`)
description: Canonical package artifact format shared by Rust compiler tooling and pckg server.
---

## Overview

Beskid packages use a deterministic ZIP-based artifact: `.bpk`.

## Required entries

- `package.json`
- `Project.proj`
- `src/**`
- `checksums.sha256`

## Optional entries

- `README.md`
- `LICENSE`
- `signature.json` (reserved for signed publishing)

## Determinism constraints

- Stable lexicographic entry ordering.
- Normalized ZIP timestamps.
- Normalized path separators (`/`).
- Byte-identical output for identical input.

## Integrity model

`checksums.sha256` stores one digest per packaged file, excluding itself.

Validation sequence:

1. Archive structure check.
2. `package.json` schema check.
3. Digest verification against extracted entries.
4. Manifest consistency check (`package.json` vs `Project.proj`).

## Compatibility policy

`package.json.schema` must declare schema id `beskid.package.v1`.
Future breaking changes move to `v2` and keep backward reader compatibility where possible.
