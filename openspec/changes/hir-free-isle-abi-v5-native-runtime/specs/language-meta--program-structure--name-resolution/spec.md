## ADDED Requirements

### Requirement: Canonical runtime module constants

The compiler-owned canonical runtime corpus SHALL be the only source permitted to declare a module constant with
`const Name = IntegerLiteral;`. The declaration SHALL be the sole authority for
that integer value. Before HIR-free syntax facts are constructed for the
canonical corpus, the compiler SHALL replace each use of that constant in its
declaring source unit with its declared integer literal and SHALL exclude the
declaration itself from the executable syntax tree. This normalization SHALL
preserve source offsets, SHALL reject duplicate names and non-integer
initializers, and SHALL NOT grant the facility to caller-supplied application
or Corelib sources.

#### Scenario: Runtime layout constant is consumed without a duplicate literal

- **GIVEN** a canonical runtime source unit that declares `const SLOT_SIZE = 16;`
  and uses `SLOT_SIZE` in an executable expression
- **WHEN** the compiler prepares the canonical runtime corpus for HIR-free
  lowering
- **THEN** the executable syntax tree contains the literal `16` at the use site
  and no executable declaration for `SLOT_SIZE`
- **AND THEN** the original canonical source corpus remains the sole hashed and
  provenance-checked source of that value

#### Scenario: Runtime layout constant materializes at its direct-call ABI type

- **GIVEN** the exact canonical runtime corpus declares `const TABLE_SIZE = 3480;`
  and passes `TABLE_SIZE` to a direct helper whose parameter type is `word`
- **WHEN** the corpus is prepared through generation-safe Salsa facts and the
  production ISLE path
- **THEN** the constant path retains its integer value and materializes at the
  target pointer width required by that direct-call ABI argument
- **AND THEN** no implicit `i32` fallback, dynamic dispatch, HIR lowering, or
  Rust lowering fallback is used

#### Scenario: Constant ABI materialization remains scoped to the canonical corpus

- **GIVEN** a caller-supplied application or Corelib source unit with a path
  that resembles a canonical runtime module constant
- **WHEN** its ordinary semantic facts are queried
- **THEN** it does not receive canonical-runtime constant substitution or
  canonical direct-call ABI materialization

#### Scenario: Caller source cannot use the canonical normalization facility

- **GIVEN** a caller-supplied application or Corelib source unit containing a
  module `const` declaration
- **WHEN** that source is parsed through the ordinary frontend
- **THEN** it is rejected by the ordinary language grammar rather than being
  normalized as canonical runtime source

### Requirement: Canonical runtime corpus cross-unit resolution

The compiler-owned canonical runtime corpus SHALL resolve an unqualified
function reference to one uniquely named public function in another exact
canonical-runtime source unit when no same-unit declaration shadows it. This
implicit corpus scope SHALL be installed only after the compiler has verified
the complete embedded runtime corpus and minted its runtime capability. It
MUST NOT apply to application, Corelib, partial-runtime, or caller-supplied
assemblies; ambiguous cross-unit names SHALL remain unresolved.

#### Scenario: Scheduler wrapper reaches a Bootstrap conversion helper

- **GIVEN** the exact canonical runtime corpus where `Runtime/Fiber/Scheduler.bd`
  calls the public Bootstrap helper `NativePointer`
- **WHEN** the corpus is prepared for HIR-free syntax facts and ISLE lowering
- **THEN** the call resolves to the Bootstrap declaration with its declared
  ABI signature and participates in the runtime export's direct-call closure
- **AND THEN** the same unqualified name in an ordinary assembly remains
  unresolved unless that assembly declares or explicitly imports it
