## ADDED Requirements

### Requirement: Dead growth of a mutable array parameter
A growth operation is a canonical `Core.Collections.Array` call that can reallocate the array named by its first argument and that returns the grown handle. `Array.Append` is a growth operation. Each sibling with the same shape is a growth operation. Parameters pass by value, so a growth operation on a `mut T[]` parameter changes only the callee's copy of the handle. The compiler SHALL reject a function or method body with the diagnostic `DeadCollectionGrowth` when all of the following conditions are true:

- The owner argument of a growth operation resolves to a `mut T[]` parameter of that body.
- The growth call is an expression statement, so the body discards the returned handle.
- The body does not publish the parameter handle. A read of the parameter publishes the handle when the read is in a position other than the owner argument of a growth operation or the target of an index expression. A call argument, a `return` operand, an assignment or binding source, a struct field initializer, and a capture in a nested lambda are publishing reads.

The compiler MUST NOT report `DeadCollectionGrowth` when the growth call is not an expression statement, when the body contains one or more publishing reads of the parameter, or when the owner argument resolves to a local binding or an aggregate field instead of a parameter. The diagnostic is an error. Semantic analysis MUST fail closed on `DeadCollectionGrowth` before lowering, and the diagnostic MUST name the source site of the growth call.

**Stable ID:** `BSP-REQ-35580A7D7B75`

#### Scenario: Discarded growth of a parameter is rejected
- **GIVEN** `unit Push(mut u8[] buffer, u8 value) { Array.Append<u8>(buffer, value); }` where `Array.Append` resolves to the canonical `Core.Collections.Array` declaration
- **WHEN** semantic analysis completes
- **THEN** the compiler reports `DeadCollectionGrowth` at the `Array.Append` call and does not lower the program
