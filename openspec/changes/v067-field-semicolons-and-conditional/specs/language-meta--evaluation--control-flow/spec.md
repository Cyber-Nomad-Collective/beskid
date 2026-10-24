## ADDED Requirements

### Requirement: Conditional expression evaluation and typing
In `cond ? a : b`, `cond` SHALL have type `bool`; any other type SHALL be reported with the same diagnostic as a non-`bool` `if` condition. The branches `a` and `b` SHALL have exactly the same type, and that type SHALL be the type of the expression. The compiler SHALL NOT widen or convert a branch to make the types equal. Unequal types SHALL be reported with the existing type-mismatch diagnostic at the second branch, with the first branch as a related location. A non-`bool` condition SHALL use the existing non-`bool` condition diagnostic and SHALL NOT allocate a new code. The runtime SHALL evaluate `cond` first and then exactly one branch. The branch that is not chosen SHALL NOT be evaluated, so its side effects and traps SHALL NOT occur.

#### Scenario: Chosen branch only
- **GIVEN** `i64 v = ok ? 1 : Fail();` where `Fail` traps and `ok` is `true`
- **WHEN** the code runs
- **THEN** `v` is 1 and `Fail` is not called

#### Scenario: Branch types differ
- **GIVEN** `let v = flag ? 1 : "one";`
- **WHEN** the code is checked
- **THEN** the compiler SHALL report a type mismatch at `"one"`

#### Scenario: Condition is not bool
- **GIVEN** `let v = 3 ? 1 : 2;`
- **WHEN** the code is checked
- **THEN** the compiler SHALL report the non-`bool` condition diagnostic at `3`
