## ADDED Requirements

### Requirement: Mutable parameters pass by value
A `mut` parameter SHALL be a local binding of the callee that the body MAY assign again. An assignment whose target is the parameter name SHALL change only the callee's binding and SHALL NOT change the caller's argument. An assignment through the parameter to a field or an element (`p.f = v`, `p[i] = v`) SHALL write the object or array that the caller also references. A `mut` parameter SHALL NOT be an alias of the caller's storage.

The compiler SHALL report **E1259** for an expression statement that assigns a `mut` parameter of the enclosing function or method (`p = v;` or a compound assignment such as `p += v;`) when no read of the parameter can follow the assignment on any path before the parameter is assigned again or the body ends. A read SHALL be every occurrence of the parameter name other than the target of such an assignment, including a field or element access, a call argument, a `return` operand, an occurrence in a lambda and an occurrence in a string interpolation. A `break` SHALL continue the path after its loop, a `continue` and the end of a loop body SHALL continue it at the loop condition, and a `return` SHALL end it. The diagnostic is an error, and semantic analysis MUST fail closed on it before lowering. The compiler MUST NOT report **E1259** for an assignment to a local binding, a field or an element, or for an assignment that a later read can observe, also in a later iteration of a loop.

#### Scenario: Whole assignment that the caller cannot see
- **GIVEN** `type Size { i32 columns; i32 rows; }` and `unit AssignWhole(mut Size s) { s = Size { columns: 80, rows: 24, }; }`
- **WHEN** the code is checked or built
- **THEN** the compiler SHALL report **E1259** at the assignment, and the build SHALL NOT lower the body

#### Scenario: Field assignment reaches the caller
- **GIVEN** `unit AssignFields(mut Size s) { s.columns = 80; s.rows = 24; }` and a caller `mut Size s = Size { columns: 0, rows: 0, }; AssignFields(s);`
- **WHEN** the program runs
- **THEN** no diagnostic is reported and the caller reads `s.columns` as `80`

#### Scenario: Assignment read later in the body
- **GIVEN** `i64 Clamp(mut i64 value) { if (value < 0) { value = 0; } return value; }`
- **WHEN** the code is checked
- **THEN** no diagnostic is reported

#### Scenario: Assignment read in the next iteration
- **GIVEN** `i64 Digits(mut u64 value) { mut i64 count = 0; while (value > 0_u64) { value = value / 10_u64; count = count + 1; } return count; }`
- **WHEN** the code is checked
- **THEN** no diagnostic is reported

#### Scenario: Assignment to a primitive parameter at the end
- **GIVEN** `unit Bump(mut i64 value) { value = value + 1; }`
- **WHEN** the code is checked
- **THEN** the compiler SHALL report **E1259** at the assignment
