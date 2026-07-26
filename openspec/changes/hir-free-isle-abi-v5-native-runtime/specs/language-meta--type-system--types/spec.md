## ADDED Requirements

### Requirement: Typed local default initialization

A typed local declaration MAY omit its initializer using `Type Name;` or
`mut Type Name;`. An uninitialized typed local SHALL be initialized before its
first observable use with the type-safe zero value: integer and word types use
zero, `bool` uses `false`, floating point uses `0.0`, and pointer-like values
use the null pointer. An inferred `let Name;` declaration remains invalid
because it has no type from which to derive a default value.

#### Scenario: Typed word local defaults to zero

- **GIVEN** a function body containing `word slotIndex;`
- **WHEN** the function is lowered through the HIR-free ISLE path
- **THEN** `slotIndex` has word type and its first value is the word zero
- **AND THEN** no runtime allocation, helper call, or target-specific rewrite is introduced

#### Scenario: Inferred declaration requires an initializer

- **GIVEN** a function body containing `let value;`
- **WHEN** parsing runs
- **THEN** parsing rejects the declaration because no default type is available

### Requirement: Hexadecimal integer literals

Integer literals MAY use the `0x` prefix with ASCII hexadecimal digits and
underscores. The compiler SHALL preserve the literal's bit pattern through
HIR-free lowering. An unsuffixed hexadecimal value that exceeds signed `i64`
range SHALL have `word` semantic type and lower as the corresponding two's
complement word immediate; `0xFFFFFFFFFFFFFFFF` therefore lowers as word
all-ones.

#### Scenario: Unsigned all-ones word literal

- **GIVEN** `word freeHead` compared with `0xFFFFFFFFFFFFFFFF`
- **WHEN** HIR-free semantic analysis and ISLE lowering run
- **THEN** the literal has `word` type and lowers to an all-ones word immediate
