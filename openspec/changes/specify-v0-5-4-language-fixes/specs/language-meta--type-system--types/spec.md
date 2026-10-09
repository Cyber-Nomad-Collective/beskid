## ADDED Requirements

### Requirement: Empty string concatenation
`+` with a `string` operand SHALL yield a new string holding the left text
followed by the right text. When both texts are empty, the result SHALL be the
empty string: a valid `string` of length 0 that behaves like any other string.
This SHALL hold for interpolation, where `"${s}"` is `"" + s`.

**Stable ID:** `BSP-REQ-STRING-CONCAT-EMPTY`

#### Scenario: Two empty operands
- **GIVEN** `string a = "";` and `string b = "";`
- **WHEN** `string c = a + b;` is evaluated and `c == ""` is tested
- **THEN** the test is `true`

#### Scenario: Interpolating an empty string
- **GIVEN** `string s = "";`
- **WHEN** `"${s}"` is evaluated
- **THEN** the result is the empty string

### Requirement: Ordinal string ordering
`<`, `<=`, `>`, and `>=` with two `string` operands SHALL type-check as
`bool` and SHALL compare the UTF-8 bytes of the operands, which equals Unicode
code point order. A proper prefix SHALL order before the longer string. The
order SHALL be ordinal, not locale collation. Ordering a `string` against a
non-`string` SHALL be a type error.

**Stable ID:** `BSP-REQ-STRING-ORDINAL-ORDERING`

#### Scenario: Prefix orders first
- **GIVEN** `string a = "ab";` and `string b = "abc";`
- **WHEN** `a < b` and `b <= a` are evaluated
- **THEN** the results are `true` and `false`

#### Scenario: Code point order, not collation
- **GIVEN** `string upper = "Z";` and `string lower = "a";`
- **WHEN** `upper < lower` is evaluated
- **THEN** the result is `true`, because U+005A orders before U+0061

### Requirement: Saturating f64 to integer conversion
The conversions `i64(x)`, `i32(x)`, `u32(x)`, and `u8(x)` (also spelled
`byte(x)`) of an `f64` `x` SHALL truncate toward zero. A value below or above
the target range SHALL give the target's minimum or maximum. NaN SHALL give
`0`. The conversion SHALL NOT trap.

**Stable ID:** `BSP-REQ-F64-TO-INTEGER-SATURATES`

#### Scenario: Truncation toward zero
- **GIVEN** `f64 x = -2.9;`
- **WHEN** `i64(x)` is evaluated
- **THEN** the result is `-2`

#### Scenario: Out-of-range values clamp
- **GIVEN** the `f64` literals `300.0`, `-1.0`, and `10000000000.0`
- **WHEN** `u8(300.0)`, `u32(-1.0)`, and `i32(10000000000.0)` are evaluated
- **THEN** the results are `255`, `0`, and `2147483647`

#### Scenario: NaN converts to zero
- **GIVEN** an `f64` value `x` that is NaN
- **WHEN** `i64(x)` is evaluated
- **THEN** the result is `0` and the program does not trap

### Requirement: Bulk parameters
When the last parameter of a function or method is `bulk T[] name`, a call
SHALL supply every earlier parameter and then zero or more trailing
arguments. Each trailing argument SHALL be type-checked against `T`. The
callee SHALL receive the trailing arguments, in order, as one `T[]`. Fewer
arguments than the earlier parameters SHALL be an arity error.

**Stable ID:** `BSP-REQ-BULK-PARAMETERS`

#### Scenario: Any number of trailing arguments
- **GIVEN** `i64 Sum(bulk i64[] values)` and
  `i64 Tail(string label, bulk i64[] values)`
- **WHEN** `Sum()`, `Sum(1_i64, 2_i64, 3_i64)`, `Tail("t")`, and
  `Tail("t", 1_i64, 2_i64)` are type-checked
- **THEN** every call is accepted

#### Scenario: Trailing argument of the wrong type
- **GIVEN** the same `Sum`
- **WHEN** `Sum(1_i64, "two")` is type-checked
- **THEN** the compiler reports a type mismatch

#### Scenario: Missing fixed argument
- **GIVEN** the same `Tail`
- **WHEN** `Tail()` is type-checked
- **THEN** the compiler reports an arity mismatch expecting 1 argument

### Requirement: Field access on call results and nested receivers
A field access SHALL be valid on any expression whose static type is a
nominal type that exposes the field, including a call result (`Make().x`,
`value.Method().x`) and a chained projection through the implicit receiver
(`this.inner.count`), also inside methods of a generic type for each of its
specializations.

**Stable ID:** `BSP-REQ-FIELD-ACCESS-ON-EXPRESSIONS`

#### Scenario: Field of a call result
- **GIVEN** `type Point { i64 x, i64 y, }` and
  `Point Make() { return Point { x: 9_i64, y: 2_i64 }; }`
- **WHEN** `Make().x + Make().y` is evaluated
- **THEN** the result is `11`

#### Scenario: Nested projection in a generic method
- **GIVEN** `type Inner<T> { T[] items, i64 count, }` and
  `type Outer<T> { Inner<T> inner, pub i64 Count() { return this.inner.count; } }`
- **WHEN** `outer.Count()` is compiled for an `Outer<i64>` value `outer`
- **THEN** the method compiles for that specialization and returns
  `outer.inner.count`
