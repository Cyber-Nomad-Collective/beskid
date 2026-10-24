## ADDED Requirements

### Requirement: Array.Append ownership
`Array.Append<T>` on an array that the caller owns SHALL grow the array in place. An owned array SHALL be a `let` local, a `mut` parameter or a field. `Array.Append<T>` on an array that the caller does not own, such as a parameter that is not `mut`, a loop or pattern variable, a lambda parameter, a call result or an element, SHALL copy the array and SHALL return the new array; the argument SHALL NOT change. Lowering SHALL NOT fail for an array without a proven owner; it SHALL copy.

#### Scenario: Owned local grows in place
- **GIVEN** `mut i64[] xs = Array.Empty<i64>(); Array.Append<i64>(xs, 1);`
- **WHEN** the code runs
- **THEN** `xs` has one element

#### Scenario: Non-owned array is copied
- **GIVEN** `i64[] Grown(i64[] xs) { return Array.Append<i64>(xs, 1); }` called with an array `a` of length 2
- **WHEN** the code runs
- **THEN** the result has length 3 and `a` still has length 2
