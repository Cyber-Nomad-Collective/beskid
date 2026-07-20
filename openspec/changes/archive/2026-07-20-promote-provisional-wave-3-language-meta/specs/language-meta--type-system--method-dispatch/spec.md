## ADDED Requirements

### Requirement: Receiver member resolution
Instance calls MUST use postfix `.Identifier` after a primary expression that denotes a value type. The receiver’s static type MUST expose a callable member with matching name and signature, or the call MUST error (**E1101**, **E1213**). `extend type` members MUST participate in the member set of the extended type with the same visibility rules as declared members.

#### Scenario: Missing member on receiver
- **GIVEN** a call `receiver.Missing()` where the static type has no such callable member
- **WHEN** member resolution runs
- **THEN** the compiler emits **E1101** or **E1213**

### Requirement: Overload resolution and static dispatch
Overloading MUST be resolved by arity and argument types at the call site; there is no ad hoc ranking beyond signature match. Ambiguous overload sets MUST error rather than pick a candidate. Dispatch is static in v0.1: the callee MUST be known at compile time from the receiver’s static type. Interop thunks MUST preserve the statically selected symbol through lowering. Contracts used as namespaces (`Contract.method()`) MUST follow resolver fallback for contract-as-namespace calls.

#### Scenario: Ambiguous overload set
- **GIVEN** two callable members that both match a call’s arity and argument types
- **WHEN** overload resolution runs
- **THEN** the compiler emits an ambiguity error and does not select a candidate

### Requirement: impl and extend type methods
Legacy `impl Receiver { … }` blocks MAY still parse; new code SHOULD use `extend type`. Methods in `impl` / `extend type` MUST obey visibility and access rules of the target type. Call resolution tests in `beskid_analysis` MUST pass for L2 claims.

#### Scenario: extend type method visible on receiver
- **GIVEN** an `extend type T { pub unit Extra() { } }` in scope
- **WHEN** a value of type `T` invokes `Extra()`
- **THEN** dispatch resolves to the extended method under normal visibility rules

## REMOVED Requirements

### Requirement: Method dispatch conformance status
**Reason**: Replaced by explicit behavioral requirements extracted from migrated source.
**Migration**: Cite the ADDED requirements above.
