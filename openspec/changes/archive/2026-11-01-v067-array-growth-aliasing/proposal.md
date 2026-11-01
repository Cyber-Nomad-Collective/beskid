## Why

On the 0.6.7 preview.10 toolchain, a growth of one array handle is visible through other handles to the same array. A `T[]` value is a handle to one array header (data, length, capacity). `Array.Append` writes the new length and the new element into that header while capacity remains. Every other handle that names the header sees the growth until the first reallocation. Seven small programs showed it: a local copy (`ys = xs`), a field and a local, a closure capture, a list element, a parameter copied into a `mut` local, an array returned from a field, and the result of `Array.Append`. When two handles both grow into the same spare slot, the second growth overwrites the element of the first, and a write after the growth is visible through the other handle.

`Array.RemoveLast` had the same defect in the other direction: it stored the shorter length into the shared header, so every other handle lost its last element. A field or element lent to a free function was also not marked when the callee could reach its holder only through an element of an array argument (`Holder[]`).

The owner ruled on 2026-10-30: growing one handle never changes what another handle that shares the array sees. The coordinator extended the ruling the same day: shrinking one handle never changes another handle either, and the lent-field case is closed. Growth is in place only when the old handle is provably unused; otherwise the grower gets its own array. `List<T>` keeps its shared header (its own copy-on-write state is unchanged).

## What Changes

- A growth through one handle SHALL NOT change the length or the elements that another handle to the same array reads. When another handle can read the array, the growth copies the array into a new array that only the grower holds.
- A shrink (`Array.RemoveLast`) through one handle SHALL NOT change the length or the elements that another handle reads. A shared array is copied, and the owner receives the shortened copy; an unshared array shrinks in place. An argument that is not an owner always copies, and only the result is shortened.
- A field or element lent to a free function is marked when an array argument's elements can lead the callee to its holder.
- Each array carries a sharing mark. The compiler sets the mark where a second handle to an existing array is made. A growth of a marked array copies; a growth of an unmarked array is in place while capacity remains. A copy is unmarked.
- The canonical runtime derives the element descriptor without the mark. A growth that copies doubles the length (a full array doubles its capacity, as before), so repeated copies do not inflate the capacity.
- Corelib documents the rule on `Core.Collections.Array.Append`, `RemoveLast` and `Clear`. `Codec.Mem.Zeroed` and `Crypto.BigNat.Zeros`/`ZeroBytes` allocate with `Array.Zeroed` instead of shortening a literal; the bsol `WireEncoder.Abort` keeps its arrays (a shrink can allocate, and `Abort` is a non-allocating rollback).

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `language-meta--memory-model--memory-and-references`: new requirement "Array length changes never reach another handle".
- `core-library--foundation-and-primitives--core-collections`: "Manifest-owned typed dynamic array growth" names the sharing mark, the growth target and the owner-aware shrink.

## Impact

`beskid_queries` (`array_share` fact), `beskid_isle` (mark emission at place reads and call results; `growth_minimum_capacity` reads the mark), `beskid_codegen` adapter, the canonical runtime (`ArrayElementDescriptor`, geometric target from the length). Corelib doc comment of `Array.Append`. The runtime kit source hash changes. Target release: 0.6.7. No legacy URL changes.

## Compatibility, Migration and Reversion

No users exist. A program that read another handle's growth now reads its own unchanged array. A program that needs the grown array reads it through the handle that grew it, or returns it. Reversion removes the mark emission and the mark test; the runtime mask is harmless without them.
