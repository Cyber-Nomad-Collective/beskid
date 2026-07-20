## ADDED Requirements

### Requirement: Result and Option representation
Recoverable errors SHOULD use `Core.Results.Result<TValue, TError>` when the project links Std. Projects MUST NOT define a second bare `enum Result` in the same scope as Std. Absence of value (not failure) MUST use `Option<T>`, not `null` or sentinel pointers. There is no built-in `Result<T,E>` type alias in v0.1 grammar; callers MUST use the corelib generic enum with explicit type arguments.

#### Scenario: Absence uses Option not null
- **GIVEN** an API that models optional presence of a value
- **WHEN** the API is type-checked against v0.1 rules
- **THEN** the type MUST be `Option<T>` (or an explicit absent-variant enum), not a nullable reference

### Requirement: Postfix try operator
Postfix `expr?` (`TryOperator`) MUST apply only where the surrounding function or lambda declares a compatible error propagation target. The operand type MUST be a `Result`-shaped enum (typically `Core.Results.Result<_, _>` with `Ok` / `Error` variants); otherwise the compiler MUST diagnose an invalid try target. Successful path MUST unwrap the success payload; failure path MUST return or translate to the enclosing error type. Lowering MUST desugar `?` using the resolved scrutinee enum variant names, not hard-coded identifier strings.

#### Scenario: Try on non-result expression
- **GIVEN** a postfix `?` applied to an expression that is not a Result-shaped enum
- **WHEN** try lowering or type-checking runs
- **THEN** the compiler diagnoses an invalid try target and does not unwrap a success payload

### Requirement: Shared try analysis spine
Analyze, compile (`run` / `build`), and LSP MUST share the same typed-HIR spine for `?`: resolve, normalize (including `?` desugar), re-resolve, then type-check. Error propagation MUST NOT implicitly allocate; lowering rewrites `?` to branch sequences. Panic or abort semantics are not language keywords in v0.1.

#### Scenario: IDE and compile agree on try desugar
- **GIVEN** a function body containing `expr?` with aligned Result types
- **WHEN** LSP analysis and `beskid compile` both process the unit
- **THEN** both apply the same `?` desugar before type-checking and accept the program

## REMOVED Requirements

### Requirement: Error handling conformance status
**Reason**: Replaced by explicit behavioral requirements extracted from migrated source.
**Migration**: Cite the ADDED requirements above.
