## Why

On the 0.6.7 preview.10 toolchain, a growth of one array handle is visible through other handles to the same array. A `T[]` value is a handle to one array header (data, length, capacity). `Array.Append` writes the new length and the new element into that header while capacity remains. Every other handle that names the header sees the growth until the first reallocation. Seven small programs showed it: a local copy (`ys = xs`), a field and a local, a closure capture, a list element, a parameter copied into a `mut` local, an array returned from a field, and the result of `Array.Append`. When two handles both grow into the same spare slot, the second growth overwrites the element of the first, and a write after the growth is visible through the other handle.

The owner ruled on 2026-10-30: growing one handle never changes what another handle that shares the array sees. Growth is in place only when the old handle is provably unused; otherwise the grower gets its own array. `List<T>` keeps its shared header (its own copy-on-write state is unchanged).

## What Changes

- A growth through one handle SHALL NOT change the length or the elements that another handle to the same array reads. When another handle can read the array, the growth copies the array into a new array that only the grower holds.
- Each array carries a sharing mark. The compiler sets the mark where a second handle to an existing array is made. A growth of a marked array copies; a growth of an unmarked array is in place while capacity remains. A copy is unmarked.
- The canonical runtime derives the element descriptor without the mark. A growth that copies doubles the length (a full array doubles its capacity, as before), so repeated copies do not inflate the capacity.
- Corelib documents the rule on `Core.Collections.Array.Append`.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `language-meta--memory-model--memory-and-references`: new requirement "Array growth never reaches another handle".
- `core-library--foundation-and-primitives--core-collections`: "Manifest-owned typed dynamic array growth" names the sharing mark and the growth target.

## Impact

`beskid_queries` (`array_share` fact), `beskid_isle` (mark emission at place reads and call results; `growth_minimum_capacity` reads the mark), `beskid_codegen` adapter, the canonical runtime (`ArrayElementDescriptor`, geometric target from the length). Corelib doc comment of `Array.Append`. The runtime kit source hash changes. Target release: 0.6.7. No legacy URL changes.

## Compatibility, Migration and Reversion

No users exist. A program that read another handle's growth now reads its own unchanged array. A program that needs the grown array reads it through the handle that grew it, or returns it. Reversion removes the mark emission and the mark test; the runtime mask is harmless without them.
