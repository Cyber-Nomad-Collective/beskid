## Context

`T[]` is a handle to one GC object: a hidden prefix (type descriptor, mark word, element descriptor), the public header `{ data, length, capacity }`, and the elements. `beskid_rt_v5_array_grow_rooted(array, minimum, root)` returns the same array when `minimum <= capacity`; the generated code then stores the element and the new length into that header. Every handle that names the header sees the change. The arrgrow slice fixed only the `mut T[]` parameter case (first growth through the incoming handle copies).

## Decision

A growth or a shrink is in place only when no other handle can read the array. The proof is a sharing mark: bit 0 of the hidden element-descriptor word at `array - 8`. Element descriptors are static data with at least 8-byte alignment, so bit 0 is free, and only generated code sets it.

- The compiler marks the array where a second handle is made (`array_share` in `beskid_queries`, `mark_array_shared` in ISLE):
  - a read of an array place in a copy position of copy on assignment (`let` value, assignment value, an argument the callee keeps, a construction field, element or payload, a crossing operand, a returned place that the callable does not own). A returned plain or `mut` parameter is not marked: E1241 stops a plain parameter from escaping, and the caller decides for the call result;
  - a read of a field or element as an argument of a plain or `mut` parameter when the call can reach the holder: the callee is a method, a function value or a dispatched call, or another argument is an object, struct, enum, closure or contract value. The array operand of a canonical `Core.Collections.Array` function (`Len`, `Capacity`, the owner of `Append`) and every argument of a runtime intrinsic (`__array_len`, an I/O read into a buffer) never mark: they run no user code and keep no handle (a channel or port send wraps its value in a construction, which marks);
  - a call result (ordinary call, `Append`, `Set`, `Clear`, `RemoveLast`) in a copy position when an array argument can be the result. `xs = F(xs, ...)` back into the same place, and a returned result whose array arguments are all locals or parameters of the returning callable, are not marked. `Empty`, `Zeroed`, `Of`, `Copy` and `CopyRange` return new arrays.
- `Append` and `TryAppend` request `capacity + 1` (the runtime copies) when the mark is set or a `mut` parameter slot still holds the incoming handle; else `length + 1` (in place while capacity remains). The copy is a new object with a clean descriptor word.
- Inside the `Copy`, `Borrow` and `Detached` hooks of a `[CopyOnAssign]` type, reads are not marked: `List<T>` counts holders and copies before a write itself.
- The runtime reads the element descriptor only through `ArrayElementDescriptor(object)`, which clears the mark. Geometric growth doubles the length, not the capacity: a forced copy of a half-full array does not double an already spare capacity.

Rejected: always copy on growth unless a static proof shows the handle is unique. Field owners (`List.Push`, codec builders, priority queues) can never be proven unique statically, so every append to a field would copy the array (quadratic). Rejected: a new header word for the mark. It changes the public `BeskidArray` layout and every offset in the runtime and the generated code. Rejected: the GC mark word (`object + 8`): the collector writes it, so a mutator read-modify-write could lose a color.

## Shrink

`Array.RemoveLast` is the only operation that decreases the length of an array (`Clear` clears one slot; `Set` writes one). It used to clear the last slot and store the new length into the shared header. It now takes the same owner as `Append` (`array_mutation_owner` in `beskid_queries`): a `let` local, a `mut` or `move` parameter, or an aggregate field. Lowering reads the mark (and, for a parameter slot, compares it with the incoming handle) and branches. The shared branch calls `beskid_rt_v5_array_grow_rooted` with `capacity + 1`, which copies every live element into a new unmarked array; the copy is shortened and written back to the owner, and its construction root is released after the store. The unshared branch shortens the array in place with no runtime call. An argument that is not an owner (a plain parameter, an element, a call result) always copies, and only the call result is shortened, as for `Append`.

The copy can allocate, so `RemoveLast` is no longer accepted in a non-allocating publication or rollback body. The bsol `WireEncoder.Abort` no longer shortens its arrays: it sets `used` to 0, and the next `Begin` replaces the bytes and the frames.

Rejected: a new header over the same storage for the shrinking handle. The header is inline in the array object, so a new header is a new object; with a copy the old storage stays exactly as other handles see it. Rejected: shrink in place and copy on the next growth. The other handle reads the shorter length at once.

## Lent field reached through an array element

A field or element passed to a plain parameter of a free function is marked when another argument can lead the callee to its holder. An array argument can when its element type can (`Holder[]`: the callee binds `holders[0]` and grows or shrinks its field). An array of primitives or strings cannot, and neither can an array of such arrays: the callee reaches an inner array only as an element, and an element is not an owner (a growth or shrink of it copies), while a binding of it marks it. The array operand of a canonical `Core.Collections.Array` function and every intrinsic argument still never mark, so `Array.Len` and `Array.Capacity` in an append loop do not force copies.

## Observability, security, rollback

The mark is visible only as an extra copy on a later growth. `Array.Capacity` shows it (a copied array has capacity of at least twice its length, or 4). Rollback: remove the mark emission and the mark test; the runtime mask stays valid. Source of truth: this change and the memory-model requirement; the Corelib `Append` comment is informative.
