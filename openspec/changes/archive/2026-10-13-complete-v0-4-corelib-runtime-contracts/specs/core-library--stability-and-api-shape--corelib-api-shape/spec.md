## MODIFIED Requirements

### Requirement: Single Core.* namespace: Decision [D-CORE-NS-0001]
Every public Corelib module MUST use the `Core.*` prefix. In particular,
collection modules and types MUST use `Core.Collections.*`, filesystem modules
and errors MUST use `Core.FS.*`, and standard streams MUST use their established
`Core.Input`, `Core.Output`, and `Core.Error` paths. `Collections.*`,
`System.*`, `Core.Platform`, and any alias, re-export, resolver redirect,
duplicate source tree, or compatibility facade for them MUST be removed. An
OS-backed module SHALL express stability through `@tier(...)` and use the
canonical runtime boundary; it MUST NOT use a separate public namespace.

#### Scenario: Old collection namespace has no compatibility resolution
- **GIVEN** source that names `Collections.Array`
- **WHEN** package assembly and name resolution run after the migration
- **THEN** the name is unresolved and no alias or generated facade redirects it
  to `Core.Collections.Array`

#### Scenario: Old filesystem namespace has no compatibility resolution
- **GIVEN** source that names `System.FS`
- **WHEN** package assembly and name resolution run after the migration
- **THEN** the name is unresolved and only `Core.FS` can provide the public
  filesystem API

### Requirement: Owning-type inline methods: Decision [D-CORE-API-0002]
Methods on a Corelib-owned `pub type` MUST be declared inside that type's
`pub type { }` block in its owning module file. `extend type` MUST NOT add
members to types defined in Corelib packages, and module-level free functions
MUST NOT duplicate receiver behavior; free functions MAY remain only for
constructors and namespace helpers without a receiver. Generated fluent
wrappers MAY delegate to owning methods but MUST NOT own a second
implementation, storage model, error model, or namespace compatibility path.
Foreign types remain governed by the separate `extend type` capability.

#### Scenario: Collection method has one implementation
- **GIVEN** a public `Core.Collections.List<T>` receiver operation
- **WHEN** its declarations and generated wrappers are inspected
- **THEN** one method body exists inside the owning `List<T>` and every wrapper
  delegates to it without an extension or free-function duplicate

#### Scenario: Constructor remains a valid namespace helper
- **GIVEN** a collection constructor that does not receive an existing
  collection value
- **WHEN** its API placement is checked
- **THEN** it may remain a module helper while all receiver behavior remains on
  the owning type
