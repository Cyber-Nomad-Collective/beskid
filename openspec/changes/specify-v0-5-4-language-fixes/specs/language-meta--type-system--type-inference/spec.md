## ADDED Requirements

### Requirement: Generic inference from bulk arguments
For a generic callee whose last parameter is `bulk T[]`, the element type `T`
SHALL be inferred from the trailing arguments as if they were one `T[]`
argument, or SHALL be taken from explicit type arguments. A call with no
trailing arguments SHALL leave `T` uninferred, so it SHALL supply explicit
type arguments or be rejected for missing type arguments.

**Stable ID:** `BSP-REQ-BULK-GENERIC-INFERENCE`

#### Scenario: Element type inferred from trailing arguments
- **GIVEN** `T First<T>(bulk T[] values) { return values[0]; }`
- **WHEN** `First(4_i64, 5_i64)` and `First<i64>(4, 5, 6)` are compiled
- **THEN** both calls specialize `First` with `T` as `i64` and pack their
  trailing arguments as `i64` elements

#### Scenario: No trailing arguments needs type arguments
- **GIVEN** the same `First`
- **WHEN** `First()` is type-checked
- **THEN** the compiler rejects the call for missing type arguments

### Requirement: Locals annotated with a type parameter
Inside a generic function, a local declared with a type parameter as its type
(`T held = value;`) SHALL take the concrete type that the current
specialization substitutes for that parameter, for scalar and reference
types alike.

**Stable ID:** `BSP-REQ-GENERIC-ANNOTATED-LOCAL`

#### Scenario: Scalar and string specializations
- **GIVEN** `T Same<T>(T value) { T held = value; return held; }`
- **WHEN** `Same("s")` and `Same(7_i64)` are compiled and run
- **THEN** each specialization compiles, and the calls return `"s"` and `7`

### Requirement: Contextual enum constructors in method arguments
An enum constructor written without type arguments SHALL take its type from
the declared parameter type when it is an argument to a method called on a
local whose type is written explicitly, as it already does for arguments to
module functions.

**Stable ID:** `BSP-REQ-ENUM-CONSTRUCTOR-METHOD-ARGUMENT-CONTEXT`

#### Scenario: Generic constructor takes the parameter's application
- **GIVEN** `enum Maybe<T> { None(), Some(T value) }`, a type `Holder` with
  method `i64 Pick(Maybe<i64> other)`, and `Holder holder = Holder { n: 1 };`
- **WHEN** `holder.Pick(Maybe::None())` is type-checked
- **THEN** the constructor resolves to `Maybe<i64>::None`
