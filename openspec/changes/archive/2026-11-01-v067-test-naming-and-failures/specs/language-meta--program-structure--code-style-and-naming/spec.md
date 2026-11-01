## MODIFIED Requirements

### Requirement: Case profiles by declaration kind
Identifier case profiles MUST follow the declaration-kind table: `type`, `enum`, enum variants, `contract`, module path segments, top-level functions, type methods, `test` names, and App entry `Main` MUST use PascalCase; type fields, variant payload fields, parameters (except `self`), locals, and `macro` names MUST use lowerCamelCase. Generic type parameters MUST use PascalCase and SHOULD use a `T` prefix. The special name `self` is exempt from the parameter profile. Leading `_` is permitted only for keyword escape and does not change the expected case profile of the remaining spelling.

#### Scenario: Test name uses PascalCase
- **GIVEN** a `test` item declared in a Test project
- **WHEN** naming style checking runs
- **THEN** the test identifier MUST conform to PascalCase (or the style rule diagnoses the deviation)

#### Scenario: Snake_case test name
- **GIVEN** `test hub_register_accepts_channel { }`
- **WHEN** naming style checking runs
- **THEN** the style rule MUST report W1637 on the test name
