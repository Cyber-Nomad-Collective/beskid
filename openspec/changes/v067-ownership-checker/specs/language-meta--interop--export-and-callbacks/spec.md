## ADDED Requirements

### Requirement: Export entries resolve by declaration identity
The compiler SHALL resolve each `[Export]` entry to exactly one declaration. The identity of a declaration SHALL be its module path together with its declaration. The compiler SHALL NOT match an entry by simple name. When two functions have the same simple name in different modules, each SHALL be a separate entry. When an entry does not resolve to exactly one declaration, the compiler SHALL report an error and SHALL NOT emit the registration.

#### Scenario: Same name in two modules
- **GIVEN** `Net.Handle` and `Disk.Handle`, each marked `[Export]`
- **WHEN** the entry table is built
- **THEN** the table contains two entries, one per declaration, and each registration calls its own function

#### Scenario: Entry without a declaration
- **GIVEN** an entry that names a function that is not declared
- **WHEN** the entry table is built
- **THEN** the compiler SHALL report an error and SHALL NOT emit a registration for it
