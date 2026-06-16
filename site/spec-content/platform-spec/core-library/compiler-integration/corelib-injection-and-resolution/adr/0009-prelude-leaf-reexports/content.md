---
title: Prelude leaf reexports (superseded)
description: Aggregate and shard preludes expose leaf public API modules;
  assembly must not denylist re-exports.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Superseded
adrId: D-CORE-COMP-0009
adrStatus: Superseded
adrDate: 2026-05-29
lastReviewed: 2026-06-07
---

## Status

**Superseded by [D-TOOL-MAN-0006 — Explicit use, no prelude](/platform-spec/tooling/manifests-and-lockfiles/adr/0006-explicit-use-no-prelude/)** on 2026-06-07.

Aggregate corelib no longer ships `Prelude.bd`; shard modules are consumed via explicit dependencies and `use` imports.

## Context (historical)

Shard preludes partially overlapped the aggregate `beskid_corelib` prelude. Loader-side denylists (for example skipping `Console`) papered over units that were not valid standalone compilation files.

## Decision (historical)

1. Aggregate and shard `Prelude.bd` files **must** list **leaf** public API surfaces via `pub mod` (for example `Ansi`, `Console` submodules re-exported as documented paths—not opaque marker comments).
2. Every `pub mod` line in a prelude **must** resolve to a `.bd` unit that parses and lowers as a standalone module (fix packaging when closure seeding pulls a file).
3. The compiler **must not** maintain loader-side module denylists to compensate for prelude or packaging mistakes.

## Consequences (historical)

Corelib packaging changes preceded assembly union seeding (D-COMP-BUILD-0022). Console and other terminal modules shipped as valid standalone units or were removed from prelude `pub mod` lists until prelude retirement.

## Verification anchors (historical)

Verification responsibility transferred to D-TOOL-MAN-0006.
