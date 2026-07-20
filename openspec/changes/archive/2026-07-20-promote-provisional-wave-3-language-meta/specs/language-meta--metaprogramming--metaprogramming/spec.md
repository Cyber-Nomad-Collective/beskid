## ADDED Requirements

### Requirement: Two metaprogramming planes
Beskid MUST provide two metaprogramming planes: language macros (`macro` items, `name!` invocation) and compiler mods (`type: Mod` projects, SDK contracts). Serialization MUST be realized as a reference mod plus attributes. This hub MUST NOT duplicate the full normative text of those child capabilities.

#### Scenario: Distinct macro and mod mechanisms
- **GIVEN** a library that both declares a `macro` item and depends on a `type: Mod` package
- **WHEN** compilation schedules metaprogramming phases
- **THEN** language macros expand via `macro.expand` and mods run via the Mod SDK pipeline as separate planes

### Requirement: Phase scheduling order
The reference compiler MUST schedule: parse and build HIR; `macro.expand` (**E1901–E1908**); re-run resolution and types on the expanded surface; then `mod.load` / `mod.collect` / generators; then continue semantic analysis, composition (if host), and codegen. Mods MUST NOT run before macro expansion completes on the same compilation unit unless a future decision explicitly orders otherwise. Tooling MUST invoke the same phase order for CI and IDE builds on a given project kind.

#### Scenario: Macros before mods
- **GIVEN** a compilation unit containing both language macro invocations and Mod dependencies
- **WHEN** the reference compiler builds the unit
- **THEN** `macro.expand` completes before `mod.load` begins

### Requirement: Project kind and attribute rules
App/Lib/Test projects MAY declare `macro` items and consume mods. Mod projects MUST NOT declare app `host` graphs. Attribute declarations `attribute Name(targets) { … }` are module items; misuse of targets MUST error (**E1508–E1510**). Metaprogramming effects are compile-time only; expanded/generated AST becomes input to later phases.

#### Scenario: Invalid attribute targets
- **GIVEN** an `attribute` declaration applied to a target kind not listed in its targets
- **WHEN** attribute checking runs
- **THEN** the compiler emits **E1508**, **E1509**, or **E1510**

## REMOVED Requirements

### Requirement: Metaprogramming conformance status
**Reason**: Replaced by explicit behavioral requirements extracted from migrated source.
**Migration**: Cite the ADDED requirements above.
