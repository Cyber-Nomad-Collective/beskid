## ADDED Requirements

### Requirement: Use declaration resolution and diagnostics
`use Path;` MUST import the final segment into the current scope; `use Path as Alias;` MUST bind the resolved target to `Alias`. Unknown import paths MUST error (**E1105**); ambiguous imports MUST error (**E1104**); `use` before declaration in the same module MUST error (**E1106**) when forward reference is illegal.

#### Scenario: Unknown import path
- **GIVEN** a `use` declaration whose path does not resolve to any module or item
- **WHEN** name resolution processes imports
- **THEN** the compiler emits **E1105** and does not bind the import

### Requirement: Value and type path binding
Value paths MUST resolve to functions, locals, constants, enum constructors, and contract namespaces. Type paths MUST resolve to types, generics, and primitive names. Unresolved value names MUST error (**E1101**); unresolved type names MUST error (**E1201**); unknown module segments MUST error (**E1108**).

#### Scenario: Unresolved value name
- **GIVEN** an expression that references a value name with no binding in scope
- **WHEN** value-path resolution runs
- **THEN** the compiler emits **E1101**

### Requirement: Visibility, duplicates, and shadowing
Resolution MUST respect visibility from the importer’s module; private item access MUST error (**E1107**). Duplicate definitions in the same scope MUST error (**E1006**, **E1102**). Inner scopes MAY shadow outer locals; shadowing SHOULD warn (**W1103**). Generic parameters shadow type names in signature scope only for the declaring signature.

#### Scenario: Private item accessed across modules
- **GIVEN** a reference from module A to a non-`pub` item in module B
- **WHEN** visibility checking runs during resolution
- **THEN** the compiler emits **E1107**

### Requirement: Single resolver snapshot and stable qualified names
The package driver and typechecker MUST share one resolution snapshot per compilation. Emitted metadata MUST record stable `qualifiedName` strings for tooling across compiles. Resolution MUST NOT inject nullable or `optional` aliases as implicit imports.

#### Scenario: Shared resolution snapshot
- **GIVEN** a multi-module compilation
- **WHEN** the package driver and typechecker consult name bindings
- **THEN** both consume the same resolution snapshot and each resolved symbol has a stable `qualifiedName`

## REMOVED Requirements

### Requirement: Name resolution conformance status
**Reason**: Replaced by explicit behavioral requirements extracted from migrated source.
**Migration**: Cite the ADDED requirements above.
