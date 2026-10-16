## MODIFIED Requirements

### Requirement: Use imports public types: Decision [D-COMP-SEM-0007]
When the compiler resolves `use Logical.Module.Path` (with optional `as Alias`) and the path names a module, the module SHALL bind as an alias under its last segment (or `Alias`) for qualified member access in the importing source unit. Each `pub` function, type, enum and contract that the module declares or re-exports SHALL become nameable under its simple name in the importing source unit, in its position kind, below the unit's own declarations. Enum variants SHALL NOT bind unqualified: a variant SHALL be named as `Enum::Variant`, where `Enum` is any spelling of the enum type that is in scope. Items that are not `pub` SHALL NOT be introduced into scope by `use`. The bindings SHALL NOT be visible to other source units.

**Stable ID:** `BSP-REQ-B0391EE7114A`

#### Scenario: Public type and its variants through use
- **GIVEN** a module `Core.Results` that declares `pub enum Result<T, E> { Ok(T value), Error(E error) }`
- **WHEN** a unit with `use Core.Results;` writes `Result<i64, string> r = Result::Ok(1);`
- **THEN** `Result` binds to the enum and `Result::Ok` binds to its variant

#### Scenario: No unqualified variant
- **GIVEN** the same module and import
- **WHEN** the unit calls `Ok(1)`
- **THEN** the compiler emits **E1303** and does not bind the call to a variant

#### Scenario: Private items are not imported
- **GIVEN** a module `Codec` that declares `type Scratch {}` without `pub`
- **WHEN** a unit with `use Codec;` declares a parameter `Scratch s`
- **THEN** the compiler emits **E1201** for `Scratch`

### Requirement: Package-prefixed symbol identity: Decision [D-COMP-SEM-0016]
Every declaration that a binding fact can target SHALL have a package-prefixed qualified name, derived from the binding facts. The package SHALL be the project name of the source unit's declaring package; builtins SHALL use the fixed package `beskid`. The name shape SHALL be: the logical module path and item name for a module item; `Receiver::Name` for a method, with the receiver as written in its type, `impl` or `extend type` declaration; `Parent::child` for a field, variant or other member; `Test::statement#N` for the N-th statement of a test. The qualified name SHALL be the identity for cross-unit definition identity in tooling, for the `api.json` `symbolKey`, and for `@ref` and type-reference lookup by full package-prefixed path; the compiler SHALL provide that reverse lookup over the binding facts. Two declarations SHALL NOT have one qualified name; because duplicate items fail with **E1102** and duplicate module paths with **E1104**, a remaining collision SHALL be reported as an internal compiler error.

**Stable ID:** `BSP-REQ-8C2DE6CF3411`

#### Scenario: Method qualified name
- **GIVEN** a package `ui` with `Panel.bd` that declares `extend type Panel { pub unit Render() {} }`
- **WHEN** `beskid doc` writes the `api.json` row for `Render`
- **THEN** the `symbolKey` is the package-prefixed name with shape `Panel::Render`

#### Scenario: Reference lookup by qualified name
- **GIVEN** a doc comment `@ref Core.Results.Result` in a project that depends on Corelib
- **WHEN** documentation resolves the reference
- **THEN** it binds the `Result` enum declared in Corelib module `Core.Results`
