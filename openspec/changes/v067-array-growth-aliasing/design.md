## Context

`T[]` is a handle to one GC object: a hidden prefix (type descriptor, mark word, element descriptor), the public header `{ data, length, capacity }`, and the elements. `beskid_rt_v5_array_grow_rooted(array, minimum, root)` returns the same array when `minimum <= capacity`; the generated code then stores the element and the new length into that header. Every handle that names the header sees the change. The arrgrow slice fixed only the `mut T[]` parameter case (first growth through the incoming handle copies).

## Decision

A growth is in place only when no other handle can read the array. The proof is a sharing mark: bit 0 of the hidden element-descriptor word at `array - 8`. Element descriptors are static data with at least 8-byte alignment, so bit 0 is free, and only generated code sets it.

- The compiler marks the array where a second handle is made (`array_share` in `beskid_queries`, `mark_array_shared` in ISLE):
  - a read of an array place in a copy position of copy on assignment (`let` value, assignment value, an argument the callee keeps, a construction field, element or payload, a crossing operand, a returned place that the callable does not own). A returned plain or `mut` parameter is not marked: E1241 stops a plain parameter from escaping, and the caller decides for the call result;
  - a read of a field or element as an argument of a plain or `mut` parameter when the call can reach the holder: the callee is a method, a function value or a dispatched call, or another argument is an object, struct, enum, closure or contract value. The array operand of a canonical `Core.Collections.Array` function (`Len`, `Capacity`, the owner of `Append`) and every argument of a runtime intrinsic (`__array_len`, an I/O read into a buffer) never mark: they run no user code and keep no handle (a channel or port send wraps its value in a construction, which marks);
  - a call result (ordinary call, `Append`, `Set`, `Clear`, `RemoveLast`) in a copy position when an array argument can be the result. `xs = F(xs, ...)` back into the same place, and a returned result whose array arguments are all locals or parameters of the returning callable, are not marked. `Empty`, `Zeroed`, `Of`, `Copy` and `CopyRange` return new arrays.
- `Append` and `TryAppend` request `capacity + 1` (the runtime copies) when the mark is set or a `mut` parameter slot still holds the incoming handle; else `length + 1` (in place while capacity remains). The copy is a new object with a clean descriptor word.
- Inside the `Copy`, `Borrow` and `Detached` hooks of a `[CopyOnAssign]` type, reads are not marked: `List<T>` counts holders and copies before a write itself.
- The runtime reads the element descriptor only through `ArrayElementDescriptor(object)`, which clears the mark. Geometric growth doubles the length, not the capacity: a forced copy of a half-full array does not double an already spare capacity.

Rejected: always copy on growth unless a static proof shows the handle is unique. Field owners (`List.Push`, codec builders, priority queues) can never be proven unique statically, so every append to a field would copy the array (quadratic). Rejected: a new header word for the mark. It changes the public `BeskidArray` layout and every offset in the runtime and the generated code. Rejected: the GC mark word (`object + 8`): the collector writes it, so a mutator read-modify-write could lose a color.

## Residual boundary

A field or element passed to a plain parameter of a free function whose other arguments are primitives, strings or arrays is lent without a mark. The callee can reach the holder only through an element of an array argument. A growth of the holder's field through that path during the call is visible to the callee's parameter. No Corelib code has this shape.

## Observability, security, rollback

The mark is visible only as an extra copy on a later growth. `Array.Capacity` shows it (a copied array has capacity of at least twice its length, or 4). Rollback: remove the mark emission and the mark test; the runtime mask stays valid. Source of truth: this change and the memory-model requirement; the Corelib `Append` comment is informative.
