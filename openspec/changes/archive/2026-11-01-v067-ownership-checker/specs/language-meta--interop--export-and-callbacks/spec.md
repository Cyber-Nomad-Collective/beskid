## ADDED Requirements

### Requirement: Export entries resolve by declaration identity
An `[Export]` attribute SHALL take effect only when its name resolves to the compiler-recognized declaration `Core.Attributes.Export`. An attribute named `Export` that is declared elsewhere SHALL have no export meaning. Each export entry SHALL name its declaration by identity: the unit and node of the declaration, as issued by lowering. The linker symbol of a function SHALL be the exported symbol only when the function is that declaration or a generic specialization of it. Two functions with the same simple name SHALL be separate identities. When an entry resolves to no emitted function or to more than one, the build SHALL fail and SHALL NOT emit the symbol.

#### Scenario: Same name in two modules
- **GIVEN** `Net.Handle` and `Disk.Handle`, each marked `[Export]`
- **WHEN** the entry table is built
- **THEN** the table contains two entries, one per declaration, and each registration calls its own function

#### Scenario: Attribute declared elsewhere
- **GIVEN** an attribute named `Export` that is declared in a user module and applied to a function
- **WHEN** the entry table is built
- **THEN** the function is not exported

#### Scenario: Entry without a function
- **GIVEN** an entry whose declaration has no emitted function
- **WHEN** the build runs
- **THEN** the build fails and no symbol is emitted for the entry
