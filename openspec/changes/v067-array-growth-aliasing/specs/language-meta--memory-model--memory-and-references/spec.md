## ADDED Requirements

### Requirement: Array growth never reaches another handle
A `T[]` value is a handle to one array. Two or more handles can name the same array: a local copy (`ys = xs`), a field and a local, a closure capture, an element of a collection, an argument, and a returned array. An element write through one handle SHALL be visible through every handle to the same array. A growth operation (`Array.Append`, `Array.TryAppend`) through one handle SHALL NOT change the length, the capacity or the elements that another handle reads. This rule applies to the elements that the grower writes after the growth, also when those elements are in the spare capacity of the array.

When another handle can read the array, the growth SHALL copy the array into a new array, and only the grower SHALL hold the new array. A growth SHALL be in place only when no other handle can read the array. An array that only one handle can read SHALL grow in place while capacity remains, so that a sequence of appends costs amortized constant time for each element.

The compiler SHALL treat a handle as able to read the array when the program made that handle from the grower's handle:
- by a read of the array place in a copy position of copy on assignment (a `let` value, an assignment value, an argument that the callee keeps, a field, element or payload of a construction, the operand of `move` at an isolate crossing, or a returned place that the callable does not own);
- by a call result that can be an array argument of the call, unless the result is stored back into the place that every array argument reads (`xs = Array.Append<T>(xs, v)`);
- by an argument read from a field or an element, when the callee can reach the object that holds that field or element and can grow it during the call.

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
