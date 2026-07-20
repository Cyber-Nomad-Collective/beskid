## ADDED Requirements

### Requirement: Enum declarations and variants
`enum Name<G…> { variants }` MUST introduce a nominal sum type. Variants MAY be nullary (`Ok`) or carry fields (`Err(message: string)`). Duplicate variant names MUST error (**E1002**). Enum types in expressions MUST resolve to a known enum (**E1301**).

#### Scenario: Duplicate variant name
- **GIVEN** an `enum` declaration with two variants that share the same name
- **WHEN** the enum is type-checked
- **THEN** the compiler emits **E1002**

### Requirement: Qualified constructors and arity
Qualified construction `Enum.Variant` or `Enum.Variant(args)` is REQUIRED when the enum type is not inferred from context (**E1303** if unqualified where ambiguous). For nullary variants, parentheses MAY be omitted (`Enum.Variant` and `Enum.Variant()` are equivalent). For variants with fields, `Enum.Variant(args)` MUST include parentheses and constructor arity MUST match the variant field list (**E1302**, **E1307**).

#### Scenario: Arity mismatch on field-carrying variant
- **GIVEN** a constructor call for a variant with fields whose argument count does not match the field list
- **WHEN** constructor checking runs
- **THEN** the compiler emits **E1302** or **E1307**

### Requirement: Match arm typing and guards
`match scrutinee { arms }` MUST evaluate the scrutinee once, then select the first arm whose pattern matches. Each arm `pattern => expression` MUST produce the same type; mismatches MUST error (**E1305**). A `when guard` on an arm MUST be `bool` (**E1308**). Patterns MAY be wildcard `_`, literals, identifiers (bind), or `Enum.Variant(subpatterns)`.

#### Scenario: Arm type mismatch
- **GIVEN** a `match` whose arms produce incompatible expression types
- **WHEN** match typing runs
- **THEN** the compiler emits **E1305**

### Requirement: Exhaustive enum match and arm scope
For enum scrutinees, match arms MUST cover all variants or include `_`; non-exhaustive matches MUST error (**E1304**). Matching MUST bind pattern variables in the arm expression scope only. There is no fall-through between arms; arm order is significant for overlapping patterns.

#### Scenario: Non-exhaustive enum match
- **GIVEN** a `match` on an enum that omits at least one variant and has no `_` arm
- **WHEN** exhaustiveness checking runs
- **THEN** the compiler emits **E1304**

## REMOVED Requirements

### Requirement: Enums and match conformance status
**Reason**: Replaced by explicit behavioral requirements extracted from migrated source.
**Migration**: Cite the ADDED requirements above.
