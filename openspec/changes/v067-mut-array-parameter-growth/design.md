## Context

`T[]` is a handle to one GC object: a header `{ data, length, capacity }` followed by the elements. Parameters pass by value, so a `mut T[]` parameter is a copy of the caller's handle, and both handles name the same header. `beskid_rt_v5_array_grow_rooted(array, minimum, root)` returns the same array when `minimum <= capacity`, and the generated code then writes the new length into that header.

## Decision

The callee does not write a header that the caller can read. The ISLE lowering of `Array.Append` and `Array.TryAppend` with a `mut` parameter owner compares the current parameter value with the incoming handle. If they are equal, it requests `capacity + 1` elements, so the runtime always allocates and copies; else it requests `length + 1` as for any other owner. The collector does not move objects, so the comparison of the two pointers is sufficient. The runtime ABI does not change.

Rejected: an in-out (`ref`) parameter whose growth reaches the caller. The standard has no `ref` parameter, and E1259 rules that a `mut` parameter is a local binding of the callee. Rejected: a copy at function entry. Element writes through a `mut T[]` parameter must reach the caller, and a copy at entry would stop that.

## Diagnostic

E1231 is a syntactic publication analysis. A read of the parameter as an argument of a canonical array function that neither returns nor stores its array argument stays in the body. `Set`, `Clear` and `RemoveLast` return their argument, so they stay publishing reads. Other calls stay publishing reads, because the analysis cannot see the callee.
