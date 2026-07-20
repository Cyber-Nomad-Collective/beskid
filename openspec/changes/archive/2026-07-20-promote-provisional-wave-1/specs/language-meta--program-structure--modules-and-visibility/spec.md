## ADDED Requirements

### Requirement: Module forms and identity
Path `mod` (`mod a.b;`) MUST declare the file’s module path and MUST be the first top-level item when used (**E1505**, **E1506**, **E1507**). Inline `mod name { items }` MUST nest a submodule in the current file. Without a file-scoped `mod`, module identity MUST derive from the file path relative to the project source root. Explicit `mod path;` MUST take precedence over path-derived module identity when present.

#### Scenario: File-scoped mod not first
- **GIVEN** a source file whose file-scoped `mod path;` is not the first top-level item
- **WHEN** module collection runs
- **THEN** the compiler emits **E1505**

### Requirement: Default privacy and pub export
Items MUST default to private to their module. `pub` on an item MUST export it to importers of the containing module. Importing a private item MUST error (**E1501**, **E1107**). v0.1 MUST use private-by-default plus `pub` only; there is no `internal` keyword.

#### Scenario: Private item imported from another module
- **GIVEN** a `use` of a non-`pub` item from another module
- **WHEN** visibility checking runs
- **THEN** the compiler emits **E1501** or **E1107**

### Requirement: Pub use re-exports
`pub use path` MUST re-export symbols, and re-exported names MUST refer to accessible items. Re-exports MUST preserve the underlying symbol’s accessibility rules; `pub use` of a private item from another module MUST be rejected.

#### Scenario: Re-export of inaccessible item
- **GIVEN** a `pub use` that names a private item from another module
- **WHEN** re-export checking runs
- **THEN** the re-export is rejected

### Requirement: File-scoped module nesting restrictions
Duplicate module declarations in one file MUST error. Nested `mod` declarations inside a file-scoped module file MUST error (**E1507**). Package boundaries MUST align with project manifests; cross-package visibility follows the same `pub` rules within each compilation.

#### Scenario: Nested mod in file-scoped module file
- **GIVEN** a file that begins with file-scoped `mod path;` and later contains a nested `mod` declaration
- **WHEN** module collection runs
- **THEN** the compiler emits **E1507**

## REMOVED Requirements

### Requirement: Modules and visibility conformance status
**Reason**: Replaced by explicit behavioral requirements extracted from migrated source.
**Migration**: Cite the ADDED requirements above.
