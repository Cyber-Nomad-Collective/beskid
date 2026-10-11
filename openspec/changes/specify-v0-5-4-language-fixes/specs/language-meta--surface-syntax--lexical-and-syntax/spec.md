## ADDED Requirements

### Requirement: String interpolation operand text
Each `${ expression }` operand SHALL contribute text by its static type: a
`string` itself; `i64`, `i32`, `u32`, or `u8` its decimal value, with a
leading `-` when negative, including the minimum `i64`; a `bool` `true` or
`false`; an `f64` its shortest round-trip text. An operand of any other type
SHALL fail compilation.

**Stable ID:** `BSP-REQ-STRING-INTERPOLATION-OPERANDS`

#### Scenario: Minimum i64 prints all of its digits
- **GIVEN** an `i64` value `v` equal to `-9223372036854775808`
- **WHEN** `"${v}"` is evaluated
- **THEN** the result is `"-9223372036854775808"`

#### Scenario: Bool prints its keyword spelling
- **GIVEN** `bool flag = true;`
- **WHEN** `"flag=${flag}"` is evaluated
- **THEN** the result is `"flag=true"`, not `"flag=1"`

#### Scenario: Unsigned operand prints without a sign
- **GIVEN** a `u32` value `n` equal to `4294967295`
- **WHEN** `"${n}"` is evaluated
- **THEN** the result is `"4294967295"`

### Requirement: Shortest round-trip f64 digits
The text of an `f64` interpolation operand SHALL use the fewest significant
decimal digits that read back as the same `f64` under round-half-even input.
When two digit strings of that length both read back, the one whose last
digit is even SHALL be used.

**Stable ID:** `BSP-REQ-STRING-INTERPOLATION-F64-DIGITS`

#### Scenario: Binary fraction keeps only the digits it needs
- **GIVEN** `f64 a = 0.1;` and `f64 b = 0.2;`
- **WHEN** `"${a}"` and `"${a + b}"` are evaluated
- **THEN** the results are `"0.1"` and `"0.30000000000000004"`

### Requirement: f64 interpolation text layout
`f64` text SHALL follow ECMAScript `Number::toString`: plain decimal for
magnitudes in [1e-6, 1e21); otherwise one digit, an optional fraction, and
`e+x` or `e-x`. Integral values SHALL have no fraction. NaN SHALL print `NaN`,
infinities `Infinity` and `-Infinity`, and both zeros `0`.

**Stable ID:** `BSP-REQ-STRING-INTERPOLATION-F64-LAYOUT`

#### Scenario: Integral value has no fraction
- **GIVEN** `f64 v = 2.0;`
- **WHEN** `"${v}"` is evaluated
- **THEN** the result is `"2"`

#### Scenario: Large and small magnitudes switch to exponent form
- **GIVEN** `f64` values equal to 1e20, 1e21, 0.000001, 1e-7, and 1.5e300
- **WHEN** each is interpolated
- **THEN** the results are `"100000000000000000000"`, `"1e+21"`,
  `"0.000001"`, `"1e-7"`, and `"1.5e+300"`

#### Scenario: Special values
- **GIVEN** `f64` values that are NaN, positive infinity, negative infinity,
  and negative zero
- **WHEN** each is interpolated
- **THEN** the results are `"NaN"`, `"Infinity"`, `"-Infinity"`, and `"0"`
