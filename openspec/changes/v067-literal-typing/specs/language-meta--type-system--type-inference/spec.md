## ADDED Requirements

### Requirement: Contextual numeric literal typing
An integer literal without a suffix SHALL have the type that its context requires when the context requires a primitive integer type. The contexts SHALL be: a declared local or field type; an assignment target; a function, method or enum variant parameter, after generic inference; a type literal field; a `return` value; an array element of a known element type; a match arm or value block whose result type is known; the other operand of a binary operator whose type is known; and a branch of a conditional expression as stated in the control-flow capability. A float literal without a suffix SHALL have type `f32` when its context requires `f32`, and otherwise `f64`. An integer literal without a suffix where `f32` or `f64` is required SHALL be converted to that type. Without a context, an integer literal without a suffix SHALL have type `i32` when its value fits, and otherwise `i64`; a hexadecimal literal above `i64::MAX` SHALL have type `word`. A suffix (`_u8`, `_i64`, `_f32`) SHALL fix the type of the literal and SHALL take precedence over the context. When the type of a suffix differs from the numeric type that the context requires, the compiler SHALL report **E1206**, except when the literal is an operand of a binary operator, where the numeric promotion rules of the operator apply. A float literal where an integer type is required SHALL be **E1206**. A literal whose value does not fit the type that its context or suffix gives it SHALL be **T0905** at the literal, and SHALL NOT be wrapped or truncated. A negative value SHALL NOT fit an unsigned type. A float literal fits when it is finite in its type.

#### Scenario: Field context
- **GIVEN** `type Port { u8 high; u8 low; }` and `Port { high = 1, low = 2 }`
- **WHEN** the code is checked
- **THEN** both literals have type `u8` and no diagnostic is reported

#### Scenario: No context
- **GIVEN** `let n = 3000000000;`
- **WHEN** the code is checked
- **THEN** `n` has type `i64`, and `let m = 7;` gives `m` the type `i32`

#### Scenario: Literal does not fit
- **GIVEN** `u8 x = 300;`
- **WHEN** the code is checked
- **THEN** the compiler SHALL report **T0905** at `300` with the message "`300` does not fit in `u8`"

#### Scenario: Conflicting suffix
- **GIVEN** `u8 x = 1_i64;`
- **WHEN** the code is checked
- **THEN** the compiler SHALL report **E1206**

#### Scenario: Suffix as a binary operand
- **GIVEN** `i64 y = a + 1_i64;` where `a` is `i64`
- **WHEN** the code is checked
- **THEN** no diagnostic is reported
