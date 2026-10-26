## MODIFIED Requirements

### Requirement: Event field declaration
`event Name(params);` on a `type` MUST declare a multicast callback slot. Optional `event {N} Name` MAY set a capacity hint (`EventCapacity`); the runtime MAY use this for bounded subscriber lists. An event declared without a capacity SHALL have the default capacity 16. An event SHALL hold at most its capacity of handlers; a subscription to a full event SHALL keep the handlers that it already holds. Event fields MUST NOT be read like ordinary value fields.

#### Scenario: Event field is not a value field
- **GIVEN** a type member declared as `event Changed();`
- **WHEN** code attempts to read the event as an ordinary value
- **THEN** the compiler rejects the read as event misuse

#### Scenario: Event without a capacity
- **GIVEN** `type Meter { i64 total; event Changed(i64 value); }` and a handler subscribed with `meter.Changed += handler;`
- **WHEN** a method of `Meter` raises `Changed`
- **THEN** the handler runs, and the event can hold 16 handlers

### Requirement: Raise subscribe and synchrony
Raising or subscribing MUST target an in-scope event member on a value or `this`-equivalent receiver. In a method of the type that declares an event, the bare event name SHALL raise the event on the implicit receiver: `Changed(value);` SHALL mean `this.Changed(value);`, unless a parameter or local of that name is in scope. The compiler SHALL NOT report **E1101** for such a raise. Event signatures MUST use parameter lists compatible with delegate lowering (value parameters only in v0.1). Raise MUST invoke subscribers in registration order unless a host profile defines fairness. Unless a host documents otherwise, event handlers MUST run on the raising fiber and MUST NOT block on `Join` of self. Types with `event` fields MUST lower to the same calling convention in AOT and JIT for a given target.

#### Scenario: Multicast raise order
- **GIVEN** two subscribers registered on the same event in order A then B
- **WHEN** the event is raised under the default host profile
- **THEN** handler A runs before handler B on the raising fiber

#### Scenario: Bare raise in a method of the declaring type
- **GIVEN** `type DataSource { string name; event Changed(); pub unit Update() { Changed(); } }` and a subscribed handler
- **WHEN** `Update` runs
- **THEN** the compiler reports no diagnostic and the handler runs once
