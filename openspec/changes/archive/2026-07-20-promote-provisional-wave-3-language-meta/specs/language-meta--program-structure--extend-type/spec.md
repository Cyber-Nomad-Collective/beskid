## ADDED Requirements

### Requirement: extend type syntax and target binding
`extend type` MUST be the normative mechanism for adding members to an existing type. The extended type name MUST refer to an in-scope type declaration. The body MAY declare methods and other members allowed by the type system for that target.

#### Scenario: Unknown extended type
- **GIVEN** an `extend type Missing { ... }` where `Missing` is not in scope
- **WHEN** name resolution runs
- **THEN** the compiler rejects the extension because the target type does not resolve

### Requirement: Public-only access and visibility
Members inside `extend type` MAY access public members of the extended type only. Private member access is forbidden inside `extend type` bodies. `extend type` MUST NOT bypass module visibility; extension sites MUST satisfy normal import and visibility rules.

#### Scenario: Private field access from extend type
- **GIVEN** an `extend type` body that reads a private field of the extended type
- **WHEN** access checking runs
- **THEN** the compiler rejects the private member access

### Requirement: Generated extend type contributions
`Generator` contracts MAY emit `extend type` blocks as typed AST contributions. Generated extensions MUST follow the same access and visibility rules as hand-authored extensions.

#### Scenario: Generated extension obeys access rules
- **GIVEN** a `Generator` that emits an `extend type` attempting private member access
- **WHEN** the host merges and re-checks the contribution
- **THEN** the private access is rejected under the same rules as hand-authored extensions

## REMOVED Requirements

### Requirement: extend type conformance status
**Reason**: Replaced by explicit behavioral requirements extracted from migrated source.
**Migration**: Cite the ADDED requirements above.
