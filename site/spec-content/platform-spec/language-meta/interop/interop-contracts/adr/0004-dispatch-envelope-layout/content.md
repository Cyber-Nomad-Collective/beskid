---
title: Dispatch envelope layout
description: Normative RuntimeInteropEnvelope layout and tag validity rules for v3 dispatch.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-LMETA-IC-0004
adrStatus: Accepted
adrDate: 2026-06-06
lastReviewed: 2026-06-06
---

## Context

Soft runtime ops share a small kernel export set in v3. Generated code and hosts need a stable, versioned envelope so dispatch tags, payload pointers, and return groups interoperate across JIT, AOT, and registration.

## Decision

| Rule | Detail |
| --- | --- |
| Envelope type | **`RuntimeInteropEnvelope`** is the normative tagged payload header for v3 soft dispatch |
| Layout band | Envelope field offsets and size **must** version with `BESKID_RUNTIME_ABI_VERSION`; v3 defines the initial band |
| Tag validity | Dispatch tags **must** be assigned from the manifest; runtime **must** reject unknown tags (bitmap or table validation) |
| Return groups | Tags partition into `unit`, `ptr`, `usize`, and `i64` return groups; codegen **must** call the matching `interop_dispatch_*` kernel entry |
| Conformance | Hosts claiming Interop.Contracts compatibility **must** honor envelope layout for the advertised ABI version |

Envelope offsets are realized in `beskid_runtime::interop_layout` and documented in corelib `Runtime.Abi`.

## Consequences

Envelope layout changes **must** increment `BESKID_RUNTIME_ABI_VERSION` per [D-EXEC-ABI-0002](/platform-spec/execution/abi-and-host/abi-versioning-and-compatibility/adr/0002-breaking-changes-bump-version/). Tag tables are generated from `runtime_manifest.toml`.

## Verification anchors

`compiler/crates/beskid_runtime/src/interop_layout.rs`; `compiler/crates/beskid_tests/src/interop/`; corelib `Runtime/Abi.bd`.
