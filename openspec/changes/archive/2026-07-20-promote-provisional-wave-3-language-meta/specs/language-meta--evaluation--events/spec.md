## ADDED Requirements

### Requirement: Event field declaration
`event Name(params);` on a `type` MUST declare a multicast callback slot. Optional `event {N} Name` MAY set a capacity hint (`EventCapacity`); the runtime MAY use this for bounded subscriber lists. Event fields MUST NOT be read like ordinary value fields.

#### Scenario: Event field is not a value field
- **GIVEN** a type member declared as `event Changed();`
- **WHEN** code attempts to read the event as an ordinary value
- **THEN** the compiler rejects the read as event misuse

### Requirement: Raise subscribe and synchrony
Raising or subscribing MUST target an in-scope event member on a value or `this`-equivalent receiver. Event signatures MUST use parameter lists compatible with delegate lowering (value parameters only in v0.1). Raise MUST invoke subscribers in registration order unless a host profile defines fairness. Unless a host documents otherwise, event handlers MUST run on the raising fiber and MUST NOT block on `Join` of self. Types with `event` fields MUST lower to the same calling convention in AOT and JIT for a given target.

#### Scenario: Multicast raise order
- **GIVEN** two subscribers registered on the same event in order A then B
- **WHEN** the event is raised under the default host profile
- **THEN** handler A runs before handler B on the raising fiber

## REMOVED Requirements

### Requirement: Events conformance status
**Reason**: Replaced by explicit behavioral requirements extracted from migrated source.
**Migration**: Cite the ADDED requirements above.
