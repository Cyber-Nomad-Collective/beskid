## ADDED Requirements

### Requirement: Case profiles by declaration kind
Identifier case profiles MUST follow the declaration-kind table: `type`, `enum`, enum variants, `contract`, module path segments, top-level functions, type methods, and App entry `Main` MUST use PascalCase; type fields, variant payload fields, parameters (except `self`), locals, and `macro` names MUST use lowerCamelCase; `test` names MUST use snake_case. Generic type parameters MUST use PascalCase and SHOULD use a `T` prefix. The special name `self` is exempt from the parameter profile. Leading `_` is permitted only for keyword escape and does not change the expected case profile of the remaining spelling.

#### Scenario: Test name uses snake_case
- **GIVEN** a `test` item declared in a Test project
- **WHEN** naming style checking runs
- **THEN** the test identifier MUST conform to snake_case (or the style rule diagnoses the deviation)

### Requirement: Module path and App entrypoint naming
Each dot-separated segment in a module path MUST be PascalCase. Executable App targets MUST declare a top-level entry function named `Main`. The reference compiler MUST map Beskid `Main` to the native C link symbol `main` at AOT object emission. CLI defaults (`beskid run`, `beskid build`) MUST resolve an empty `--entrypoint` to `Main`. `root_namespace` MUST NOT override module path segment casing in source.

#### Scenario: Empty entrypoint resolves to Main
- **GIVEN** an App project invoked with `beskid run` and no `--entrypoint`
- **WHEN** the CLI resolves the entry symbol
- **THEN** the resolved Beskid entry name is `Main`

### Requirement: Generated and reflected surface naming
Tools that emit Beskid identifiers from foreign schemas MUST map into these case profiles. Compiler Mod SDK generators MUST emit field and type names per these profiles. Public API docs MUST display identifiers as spelled in source after formatting.

#### Scenario: Mod SDK emits lowerCamelCase fields
- **GIVEN** a Mod SDK reflection emitter producing Beskid field names from a foreign schema
- **WHEN** identifiers are emitted
- **THEN** fields use lowerCamelCase and types use PascalCase per the declaration-kind table

## REMOVED Requirements

### Requirement: Code style and naming conformance status
**Reason**: Replaced by explicit behavioral requirements extracted from migrated source.
**Migration**: Cite the ADDED requirements above.
