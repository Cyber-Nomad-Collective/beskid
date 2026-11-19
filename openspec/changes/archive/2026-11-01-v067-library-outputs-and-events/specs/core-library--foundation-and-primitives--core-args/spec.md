## MODIFIED Requirements

### Requirement: Explicit JIT arguments and non-executable denial
JIT execution that can evaluate `Core.Args` SHALL accept its argument vector
only through an explicit public execution API before the entrypoint runs. It
SHALL NOT inherit the host process vector, read an ambient global, or substitute
an empty vector when no vector is supplied. Execution without an explicitly
injected vector SHALL fail with the stable diagnostic
`Core.Args requires explicit JIT arguments`. A shared or library output SHALL NOT
contain an item that uses `Core.Args` unless the item is an `[Export]` item
(`compiler--build-pipeline--backends-jit-aot`, "Library output item selection").
A shared or library output whose `[Export]` item uses `Core.Args` SHALL be
rejected with the stable diagnostic `Core.Args requires executable arguments`;
it SHALL NOT fabricate a process vector.

**Stable ID:** `BSP-REQ-E02D15F88344`

#### Scenario: JIT requires explicit argument injection
- **GIVEN** a JIT program that evaluates `Core.Args.All()`
- **WHEN** it is executed with the explicit vector `["jit", "--flag"]`
- **THEN** it observes exactly that vector and no host-process argument

#### Scenario: JIT rejects missing argument injection
- **GIVEN** a JIT program that evaluates `Core.Args.All()`
- **WHEN** it is executed without an explicitly injected argument vector
- **THEN** execution fails with `Core.Args requires explicit JIT arguments` and no fallback vector

#### Scenario: Shared output denies an exported Core.Args use stably
- **GIVEN** a shared or library output whose `[Export]` item uses `Core.Args`
- **WHEN** it is built
- **THEN** the build fails with `Core.Args requires executable arguments` and no fallback vector

#### Scenario: Library leaves out an unexported Core.Args use
- **GIVEN** the Corelib Foundation package, whose `Core.Args` functions have no `[Export]` attribute
- **WHEN** `beskid build` runs in the package directory
- **THEN** the build succeeds and the library output does not contain those functions
