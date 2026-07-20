## ADDED Requirements

### Requirement: Contract declaration and embeddings
`contract Name { items }` MUST declare required members. Items MAY be method signatures (`T name(params);`) or embeddings (`OtherContract;`) that flatten member requirements. Types MUST declare implementation with a conformance list (`type T : I, J { … }`). Duplicate contract method names in one contract MUST error (**E1003**). Conflicting embedded contract methods MUST error (**E1004**).

#### Scenario: Duplicate method name in one contract
- **GIVEN** a `contract` that declares two methods with the same name
- **WHEN** the contract is validated
- **THEN** the compiler emits **E1003**

### Requirement: Conformance satisfaction and diagnostics
Implementing types MUST supply every required member with a compatible signature (**E1601**, **E1602**, **E1606**). Invalid conformance targets MUST error (**E1607**). All `Standard` types advertising conformance MUST pass contract satisfaction in the reference compiler.

#### Scenario: Missing required member
- **GIVEN** a type that lists a contract in its conformance list but omits a required member
- **WHEN** contract satisfaction checking runs
- **THEN** the compiler emits **E1601**, **E1602**, or **E1606**

### Requirement: Contract call dispatch
Contract calls MUST use static dispatch on the receiver’s type after conformance is proven. Contracts MAY be used as namespaces for static-style calls when the resolver provides contract-as-namespace fallback.

#### Scenario: Static dispatch after proven conformance
- **GIVEN** a receiver whose static type implements a contract containing method `M`
- **WHEN** `receiver.M(...)` is resolved
- **THEN** the callee is selected from the receiver’s static type without runtime virtual dispatch

## REMOVED Requirements

### Requirement: Contracts conformance status
**Reason**: Replaced by explicit behavioral requirements extracted from migrated source.
**Migration**: Cite the ADDED requirements above.
