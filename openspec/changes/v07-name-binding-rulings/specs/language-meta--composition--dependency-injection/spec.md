## ADDED Requirements

### Requirement: Registry implementation paths
The implementation path of a registry entry (`single Impl for Service;`) SHALL resolve as a type path under the ordinary type name lookup of the declaring source unit, and SHALL bind a type declaration. An implementation path that binds no type SHALL fail with **E1201**. Host names and scope names SHALL stay separate namespaces from item names.

#### Scenario: Imported implementation type
- **GIVEN** a host with `registry { single ConsoleLogger for Logger; }` in a unit with `use Logging;`, where `Logging` declares `pub type ConsoleLogger`
- **WHEN** the composition graph is resolved
- **THEN** the entry binds the type `Logging.ConsoleLogger`

#### Scenario: Unknown implementation type
- **GIVEN** a host with `registry { single MissingLogger for Logger; }` and no type `MissingLogger` in scope
- **WHEN** the composition graph is resolved
- **THEN** the compiler emits **E1201**
