## MODIFIED Requirements

### Requirement: Dead growth of a mutable array parameter
A growth operation is a canonical `Core.Collections.Array` call that can reallocate the array named by its first argument and that returns the grown handle. `Array.Append` is a growth operation. Each sibling with the same shape is a growth operation. Parameters pass by value, so a growth operation on a `mut T[]` parameter changes only the callee's copy of the handle. The growth SHALL NOT change the length, the capacity or the elements of the caller's array, whatever the capacity of that array. While the parameter holds the handle that the caller passed, the first growth SHALL copy the array into a new array. An element write through the parameter before that growth SHALL write the caller's array.

The compiler SHALL reject a function or method body with the diagnostic `DeadCollectionGrowth` when all of the following conditions are true:

- The owner argument of a growth operation resolves to a `mut T[]` parameter of that body.
- The body discards the returned handle: the growth call is an expression statement, or it is the whole source of an expression statement `p = <growth call>;` whose target is the same parameter.
- The body does not publish the parameter handle. A read of the parameter publishes the handle when the read is in a position other than the owner argument of a growth operation, the target of an index expression, the target of an assignment, or an argument of a canonical `Core.Collections.Array` function that does not return or store its array argument (`Len`, `IsEmpty`, `Capacity`, `Get`, `Current`, `Iterate`, `Copy` and `CopyRange`). Another call argument, a `return` operand, an assignment or binding source, a struct field initializer, and a capture in a nested lambda are publishing reads.

The compiler MUST NOT report `DeadCollectionGrowth` when the body does not discard the returned handle, when the body contains one or more publishing reads of the parameter, or when the owner argument resolves to a local binding or an aggregate field instead of a parameter. The diagnostic is an error. Semantic analysis MUST fail closed on `DeadCollectionGrowth` before lowering, and the diagnostic MUST name the source site of the growth call. When the compiler reports `DeadCollectionGrowth` for the growth call of `p = <growth call>;`, it MUST NOT also report **E1259** for that assignment.

**Stable ID:** `BSP-REQ-35580A7D7B75`

#### Scenario: Discarded growth of a parameter is rejected
- **GIVEN** `unit Push(mut u8[] buffer, u8 value) { Array.Append<u8>(buffer, value); }` where `Array.Append` resolves to the canonical `Core.Collections.Array` declaration
- **WHEN** semantic analysis completes
- **THEN** the compiler reports `DeadCollectionGrowth` at the `Array.Append` call and does not lower the program

#### Scenario: A local read of the length is not a publication
- **GIVEN** `i64 AppendAndCount(mut i64[] xs) { Array.Append<i64>(xs, 9); return Array.Len<i64>(xs); }`
- **WHEN** semantic analysis completes
- **THEN** the compiler reports `DeadCollectionGrowth` at the `Array.Append` call

#### Scenario: A returned growth is accepted
- **GIVEN** `i64[] AppendAndReturn(mut i64[] xs) { Array.Append<i64>(xs, 9); return xs; }` and a caller `a = AppendAndReturn(a);`
- **WHEN** the program runs
- **THEN** no diagnostic is reported and the caller's `a` has one more element

#### Scenario: Growth never reaches the caller's array
- **GIVEN** a caller array `a` of length 1 and a callee `i64[] AppendMany(mut i64[] xs)` that appends 100 elements and returns `xs`, called as `i64[] b = AppendMany(a);`
- **WHEN** the program runs
- **THEN** `b` has 101 elements and `a` has 1 element, whatever the capacity of `a`
