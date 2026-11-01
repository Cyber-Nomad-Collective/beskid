## ADDED Requirements

### Requirement: Array length changes never reach another handle
A `T[]` value is a handle to one array. Two or more handles can name the same array: a local copy (`ys = xs`), a field and a local, a closure capture, an element of a collection, an argument, and a returned array. An element write through one handle SHALL be visible through every handle to the same array. A growth operation (`Array.Append`, `Array.TryAppend`) through one handle SHALL NOT change the length, the capacity or the elements that another handle reads. This rule applies to the elements that the grower writes after the growth, also when those elements are in the spare capacity of the array. A shrink operation (`Array.RemoveLast`, the only operation that decreases the length of an array) through one handle SHALL NOT change the length or the elements that another handle reads. `Array.Clear` clears one element and keeps the length: it is an element write.

When another handle can read the array, the growth or the shrink SHALL copy the array into a new array, and only the handle that changes the length SHALL hold the new array. A growth or a shrink SHALL be in place only when no other handle can read the array. An array that only one handle can read SHALL grow in place while capacity remains, so that a sequence of appends costs amortized constant time for each element, and SHALL shrink in place.

The handle that changes the length is the owner of the array: a `let` local, a `mut` or `move` parameter, or a field of an object that a local, a parameter or the receiver holds. The changed array SHALL be written back to the owner. When the first argument of `Array.RemoveLast` is not an owner (a plain parameter, an element, a call result), the call SHALL return a shortened copy and the argument SHALL keep its length.

The compiler SHALL treat a handle as able to read the array when the program made that handle from the grower's handle:
- by a read of the array place in a copy position of copy on assignment (a `let` value, an assignment value, an argument that the callee keeps, a field, element or payload of a construction, the operand of `move` at an isolate crossing, or a returned place that the callable does not own);
- by a call result that can be an array argument of the call, unless the result is stored back into the place that every array argument reads (`xs = Array.Append<T>(xs, v)`);
- by an argument read from a field or an element, when the callee can reach the object that holds that field or element and can grow or shrink it during the call. The callee can reach the holder when it is a method, a function value or a dispatched call, or when another argument is an object, struct, enum, closure or contract value, or an array whose elements can lead to one (for example `Holder[]`). An argument that is a primitive, a string, or an array whose elements are primitives, strings or such arrays cannot reach the holder.

`List<T>` is not an array: a list keeps its own sharing state (copy on assignment), and this requirement does not change it.

#### Scenario: A local copy keeps its length
- **GIVEN** `mut i64[] xs` with length 1 and capacity 4, and `mut i64[] ys = xs;`
- **WHEN** the program runs `Array.Append<i64>(xs, 9);`
- **THEN** `Array.Len<i64>(ys)` is 1 and `Array.Len<i64>(xs)` is 2

#### Scenario: Two handles grow into the same spare slot
- **GIVEN** `mut i64[] xs` with length 1 and capacity 4, and `mut i64[] ys = xs;`
- **WHEN** the program runs `Array.Append<i64>(xs, 5);`, then `Array.Append<i64>(ys, 6);`, then `xs[0] = 3;`
- **THEN** `xs[1]` is 5, `ys[1]` is 6 and `ys[0]` is unchanged

#### Scenario: A field and a local
- **GIVEN** a local `xs` with spare capacity and `Holder h = Holder { items: xs };`
- **WHEN** the program runs `Array.Append<i64>(h.items, 9);`
- **THEN** `Array.Len<i64>(xs)` is unchanged and `Array.Len<i64>(h.items)` is one more

#### Scenario: A capture, a list element and a returned field
- **GIVEN** an array with spare capacity that a lambda captured, that a `List<i64[]>` holds, or that a function returned from a field
- **WHEN** the program grows the original handle
- **THEN** the lambda, the list element and the returned array each read the original length

#### Scenario: An unaliased array grows in place
- **GIVEN** `mut i64[] xs` with length 1 and capacity 4 that no other handle can read
- **WHEN** the program runs `Array.Append<i64>(xs, 1);` and `xs = Array.Append<i64>(xs, 2);`
- **THEN** `Array.Capacity<i64>(xs)` is still 4

#### Scenario: A shrink through a local copy
- **GIVEN** `mut i64[] xs` with length 3 and `mut i64[] ys = xs;`
- **WHEN** the program runs `Array.RemoveLast<i64>(xs);`
- **THEN** `Array.Len<i64>(xs)` is 2, `Array.Len<i64>(ys)` is 3 and `ys[2]` is unchanged

#### Scenario: A shrink through a field, a capture, a list element or a returned field
- **GIVEN** an array that a second handle reads: a field of a construction, a lambda capture, a `List<i64[]>` element, an element of an `i64[][]` bound to a local, or the result of a function that returns a field
- **WHEN** the program runs `Array.RemoveLast` through either handle
- **THEN** the other handle reads the original length and the original last element

#### Scenario: A shrink of a parameter
- **GIVEN** a caller array `xs` with length 2
- **WHEN** a callee runs `Array.RemoveLast` on a `mut i64[]` parameter, on a plain `i64[]` parameter (and returns the result), or on a local copy of a parameter
- **THEN** the callee's result has length 1 and `Array.Len<i64>(xs)` is still 2

#### Scenario: A shrink of an element is not an owner shrink
- **GIVEN** `i64[][] nested` whose element 0 has length 2
- **WHEN** the program runs `i64[] shorter = Array.RemoveLast<i64>(nested[0]);`
- **THEN** `Array.Len<i64>(shorter)` is 1 and `Array.Len<i64>(nested[0])` is 2

#### Scenario: Clear keeps the length
- **GIVEN** `mut i64[] xs` with length 2 and `i64[] ys = xs;`
- **WHEN** the program runs `Array.Clear<i64>(xs, 1);`
- **THEN** both handles read length 2 and `ys[1]` is 0

#### Scenario: An unaliased array shrinks in place
- **GIVEN** `mut i64[] xs` with length 4 and capacity 4 that no other handle can read, or a field that no other handle can read
- **WHEN** the program runs `Array.RemoveLast<i64>(xs);` and `xs = Array.RemoveLast<i64>(xs);`, or removes every element of the field
- **THEN** `Array.Capacity` is still 4, and a later `Array.Append<i64>(xs, 9)` stores into the freed slot in place

#### Scenario: A field lent beside an array of holders
- **GIVEN** `Holder h` with `items` of length 2, `Holder[] holders = [h];`, and a free function `i64 F(i64[] lent, Holder[] holders)` that binds `mut Holder g = holders[0];` and runs `Array.RemoveLast<i64>(g.items);` or `Array.Append<i64>(g.items, 9);`
- **WHEN** the program calls `F(h.items, holders)` and `F` returns `Array.Len<i64>(lent)`
- **THEN** the result is the original length of `h.items`
