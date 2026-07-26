## ADDED Requirements

### Requirement: Canonical runtime module constants

The compiler-owned canonical runtime corpus MAY declare a module constant with
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

#### Scenario: Caller source cannot use the canonical normalization facility

- **GIVEN** a caller-supplied application or Corelib source unit containing a
  module `const` declaration
- **WHEN** that source is parsed through the ordinary frontend
- **THEN** it is rejected by the ordinary language grammar rather than being
  normalized as canonical runtime source
