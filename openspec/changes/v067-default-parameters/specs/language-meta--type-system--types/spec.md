## ADDED Requirements

### Requirement: Default parameter values
A default value SHALL be a compile-time constant: a boolean, integer, float, character or string literal (a string without interpolation), a negated integer or float literal, or the name of a constant (`const`) declared at the top level of the same file. Any other expression SHALL be **E1252**. A default value SHALL have the type of the parameter under the literal typing rules. An integer literal without a suffix SHALL fit any integer type whose range holds it and SHALL convert to `f32` and `f64`. A float literal without a suffix SHALL fit `f32` and `f64` when it is finite. A suffix SHALL fix the type. A `bool`, `char` or `string` literal SHALL fit only its own type. Any other default SHALL be **E1253**. Optional parameters SHALL follow every required parameter; a required parameter after an optional parameter SHALL be **E1251**. Defaults MAY be declared on parameters of top-level functions, methods, contract methods, functions in inline modules, and the parameters of hosts, scopes and hooks. A default value or a caller-information attribute on an event parameter or on a `bulk` parameter SHALL be **E1254**, because a default cannot apply there. A default value in an event parameter list SHALL remain a parse error. A call MAY omit any number of trailing optional arguments. The compiler SHALL pass the default value of each omitted parameter at the call site. An argument that the call passes SHALL NOT be replaced. A call with fewer arguments than the required parameters, or more than all parameters, SHALL be **E1204** with the text "expected R–T arguments, got N", or "expected T arguments, got N" when the callee has no optional parameters.

#### Scenario: Omitted trailing argument
- **GIVEN** `unit Log(string text, i64 level = 1)` and the call `Log("a")`
- **WHEN** the call is checked and lowered
- **THEN** the call passes `1` for `level`

#### Scenario: Required after optional
- **GIVEN** `unit Log(i64 level = 1, string text)`
- **WHEN** the function is checked
- **THEN** the compiler SHALL report **E1251** at `text`

#### Scenario: Not a constant
- **GIVEN** `unit Log(i64 level = Compute())`
- **WHEN** the function is checked
- **THEN** the compiler SHALL report **E1252**

#### Scenario: Arity wording
- **GIVEN** `unit Log(string text, i64 level = 1, bool loud = false)` and the call `Log()`
- **WHEN** the call is checked
- **THEN** the compiler SHALL report **E1204** with "expected 1–3 arguments, got 0"

### Requirement: Caller-information parameters
A parameter marked `[CallerFilePath]` (type `string`), `[CallerLineNumber]` or `[CallerColumnNumber]` (type `i64`) SHALL be an optional parameter. When a call omits it, the compiler SHALL pass the file of the call, or the 1-based line or column where the callee expression of the call starts, instead of a default value. A caller-information parameter without a default value SHALL be **E1255**. A caller-information parameter of another type SHALL be **E1256**.

#### Scenario: Line number
- **GIVEN** `unit Trace([CallerLineNumber] i64 line = 0)` and the call `Trace()` on line 12
- **WHEN** the call is lowered
- **THEN** the call passes `12`
