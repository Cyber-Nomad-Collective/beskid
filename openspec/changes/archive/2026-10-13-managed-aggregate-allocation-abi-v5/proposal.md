## Why

Aggregate literals (structs, nominal types) currently reach `beskid_rt_v5_managed_object_allocate` through the same path as closure environments, but the allocation contract remains unspecified. The `BeskidTypeDescriptor.flags` field and OOM behavior have no normative requirements, and the descriptor layout lacks a versioning strategy. The taxonomy runtime spec is a stub with no conformance claims.

## What Changes

- **ADD** `execution--runtime--managed-allocation` capability spec defining the canonical ABI-v5 managed-object allocation contract.
- Specify `BeskidTypeDescriptor.flags` bit 0 as `IS_AGGREGATE` / `IS_CLOSURE` discriminant.
- Specify `gc_word` encoding in `BeskidObjectHeader` for mark state (0 = white, 1 = gray, 2 = black).
- Require `AllocateObject` to trap directly on OOM via `trap(out_of_memory, message, message_len)` rather than returning null.
- Preserve the existing `BeskidTypeDescriptor` 40-byte layout; defer versioning until the GC module is stable.
- Preserve the unified `beskid_rt_v5_managed_object_allocate` path for both closures and aggregates; defer escape analysis to 0.5.
- Trust codegen-emitted field offsets validated at allocation time against the manifest-derived descriptor; no runtime field-offset revalidation.
- Wire CYB-157 as the implementation owner.

## Capabilities

### New Capabilities

- `execution--runtime--managed-allocation`: Type descriptor layout, object header format, allocation request contract, OOM trap behavior, GC word encoding, aggregate vs closure descriptor discrimination.

### Modified Capabilities

- `execution--runtime--native-runtime-kit`: Cross-reference managed allocation contract from the kit-level manifest requirements.

## Impact

Spec-only change. Implementation is CYB-157/CYB-158/CYB-159 (already tracked). No breaking API changes — descriptor layout is unchanged, allocation path is unchanged, OOM behavior change from null-return to trap is internal to Bootstrap.bd.
