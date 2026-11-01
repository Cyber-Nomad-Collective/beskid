## Why

On the 0.6.7 preview.8 toolchain, the growth of a `mut T[]` parameter is partly visible to the caller. The array header (data, length, capacity) is shared by the caller's handle and the callee's copy, and `Array.Append` writes the new length into that header while capacity remains. After the first reallocation, the callee writes a new array and the caller keeps the old header. Thus the caller sees a length between the old length and the old capacity: with one spare slot the caller's length goes from 1 to 2, after 100 appends the callee has 101 elements and the caller has 4, and from an empty array the caller stays at 0. The standard says that parameters pass by value and that a growth of a `mut T[]` parameter changes only the callee's copy of the handle, so no result can depend on capacity.

`DeadCollectionGrowth` (E1231) also did not find these bodies: a read of the length (`Array.Len<i64>(xs)`) is a call argument, and every call argument counted as a publication of the handle.

## What Changes

- A growth of a `mut T[]` parameter never changes the caller's array, whatever its capacity. While the parameter holds the caller's handle, the first growth copies the array into a new one; later growths grow the callee's copy in place. Element writes before the first growth write the caller's array, as before.
- E1231: an argument of a canonical `Core.Collections.Array` function that does not return or store its array (`Len`, `IsEmpty`, `Capacity`, `Get`, `Current`, `Iterate`, `Copy`, `CopyRange`) is a local read, not a publication. `p = Array.Append<T>(p, v);` is a discarded growth like `Array.Append<T>(p, v);`.
- E1231 and E1259: when E1231 names the growth call of `p = Array.Append<T>(p, v);`, the compiler does not report E1259 for the same assignment.

## Capabilities

### Modified Capabilities
- `language-meta--memory-model--memory-and-references`.

## Impact

`beskid_isle` array growth lowering (`growth_minimum_capacity`), `beskid_queries` `dead_collection_growth` and the legality gate. Corelib doc comment of `Core.Collections.Array.Append`. Target release: 0.6.7.

## Compatibility, Migration and Reversion

No users exist. A caller that read a partly grown array after a call now reads its own unchanged array. A body that grew a `mut T[]` parameter, read it only locally and did not return it is now rejected with E1231: return the grown array and assign it in the caller. There is no compatibility path.
