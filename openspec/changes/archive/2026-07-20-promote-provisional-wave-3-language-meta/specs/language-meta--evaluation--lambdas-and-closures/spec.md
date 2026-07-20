## ADDED Requirements

### Requirement: Lambda syntax and typing
`param => body` or `(p1, p2) => body` MUST form a lambda where `body` is an expression or `{ block }`. Parameters MAY be typed (`T name`) or untyped (`name`) when contextual type is available. Lambda type MUST be inferable from expected type or parameter annotations (**E1202** otherwise). Lambdas MAY appear anywhere an `Expression` is allowed, including as `spawn` operands.

#### Scenario: Untyped lambda without context
- **GIVEN** an untyped lambda with no expected function type in context
- **WHEN** type inference runs
- **THEN** the compiler emits **E1202**

### Requirement: Capture and closure lifetime
Captured locals MUST be definitely assigned before capture or diagnosed per definite-assignment rules. Lambdas MUST NOT capture `mut` bindings unless the implementation explicitly allows it; otherwise they MUST error. A closure MUST extend the lifetime of captured storage to at least the closure value’s lifetime. Closures passed to `spawn` MUST be compatible with fiber entry signatures.

#### Scenario: Capture of mut binding rejected
- **GIVEN** a lambda that captures a `mut` local when the implementation does not allow mutable capture
- **WHEN** capture analysis runs
- **THEN** the compiler emits an error and rejects the lambda

## REMOVED Requirements

### Requirement: Lambdas and closures conformance status
**Reason**: Replaced by explicit behavioral requirements extracted from migrated source.
**Migration**: Cite the ADDED requirements above.
