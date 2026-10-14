## MODIFIED Requirements

### Requirement: Public-only access and visibility
Members inside `extend type` MAY access public members of the extended type only. Private member access is forbidden inside `extend type` bodies: an `extend type` body SHALL NOT read, write, build or call a member without `pub` of the extended type (**E1511**). This SHALL hold also when the `extend type` block is in the source unit that declares the type, and also for an `extend type` block that a Mod contributes. `extend type` MUST NOT bypass module visibility; extension sites MUST satisfy normal import and visibility rules.

#### Scenario: Private field access from extend type
- **GIVEN** an `extend type` body that reads a private field of the extended type
- **WHEN** access checking runs
- **THEN** the compiler rejects the private member access

#### Scenario: Extend type in the declaring unit
- **GIVEN** `Account.bd` that declares `pub type Account { i64 balance }` and `extend type Account { pub i64 Peek() { return this.balance; } }`
- **WHEN** access checking runs
- **THEN** the compiler emits **E1511** for `balance`
