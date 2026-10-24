## ADDED Requirements

### Requirement: Conditional expression evaluation and typing
In `cond ? a : b`, `cond` SHALL have type `bool`; any other type SHALL be reported with **E1208**, the non-`bool` condition diagnostic. The branches `a` and `b` SHALL have exactly the same type, and that type SHALL be the type of the expression. The compiler SHALL NOT widen or convert a typed value to make the types equal. A bare numeric literal without a suffix in one branch SHALL take the type of the other branch; when the conditional has an expected type, both branches take it. Hence `c ? 1 : 2_i64` has type `i64`. Unequal types SHALL be reported with **E1206** at the second branch, with both branches as related locations labelled "this branch is `T`". No new code is allocated. The runtime SHALL evaluate `cond` first and then exactly one branch. The branch that is not chosen SHALL NOT be evaluated, so its side effects and traps SHALL NOT occur.

#### Scenario: Chosen branch only
- **GIVEN** `i64 v = ok ? 1 : Fail();` where `Fail` traps and `ok` is `true`
- **WHEN** the code runs
- **THEN** `v` is 1 and `Fail` is not called

#### Scenario: Bare literal takes the other branch type
- **GIVEN** `let v = c ? 1 : 2_i64;`
- **WHEN** the code is checked
- **THEN** `v` has type `i64` and no diagnostic is reported

#### Scenario: Typed values do not widen
- **GIVEN** `let v = c ? a : b;` where `a` is `i32` and `b` is `i64`
- **WHEN** the code is checked
- **THEN** the compiler SHALL report the type-mismatch diagnostic at `b`

#### Scenario: Branch types differ
- **GIVEN** `let v = flag ? 1 : "one";`
- **WHEN** the code is checked
- **THEN** the compiler SHALL report a type mismatch at `"one"`

#### Scenario: Condition is not bool
- **GIVEN** `let v = 3 ? 1 : 2;`
- **WHEN** the code is checked
- **THEN** the compiler SHALL report the non-`bool` condition diagnostic at `3`
