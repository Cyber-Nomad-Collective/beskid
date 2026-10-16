## ADDED Requirements

### Requirement: Declared empty-array enum payload representation
An empty array used directly as an enum constructor argument SHALL obtain its element representation from the corresponding variant field's declared array type. The compiler SHALL resolve the constructor's exact nominal declaration and variant and preserve explicit or contextually declared generic arguments. It SHALL NOT infer an element representation from pointer width, a neighboring argument, or an unresolved constructor. Allocation and GC tracing SHALL use the resulting canonical array metadata.

#### Scenario: Recursive serialization optional payload
- **GIVEN** a DataValue enum variant declares a DataValue array payload
- **WHEN** its constructor receives an empty array for that payload
- **THEN** native lowering constructs a valid empty managed array using the declared DataValue element representation

#### Scenario: No declared array payload
- **GIVEN** an empty array appears without an exact declared array field at the corresponding enum argument position
- **WHEN** native lowering requests its element representation
- **THEN** no fabricated element representation is provided

### Requirement: Managed array element facts
A non-empty array containing managed nominal values SHALL derive its element representation and trace map from current-generation semantic ABI and managed-reference facts for every element. A pointer-sized scalar or native pointer SHALL NOT be treated as a managed element solely because its representation is pointer-sized. Nominal type legality SHALL remain governed by the shared semantic authority.

#### Scenario: Array of named recursive enum values
- **GIVEN** a typed local owns a DataValue enum value
- **WHEN** an array literal contains that local
- **THEN** native lowering produces managed pointer-element metadata that traces the stored value

#### Scenario: Integer array remains untraced
- **GIVEN** an array contains machine-word integer values
- **WHEN** native lowering produces its element metadata
- **THEN** the element trace map contains no managed pointer offsets

### Requirement: Checked runtime constructor closure before UTF8 publication
The compiler SHALL emit the checked UTF8 constructor only from the exact embedded canonical `Utf8RecordConstruct` declaration and its current finite no-yield source closure. The checked constructor SHALL use the same source-issued descriptors as ordinary emission, check allocation and root failure before any subsequent field or element store, and return a private null failure to the already admitted checked caller. Canonical runtime artifact finalization SHALL require the exact checked constructor export and its current manifest provenance; descriptive ABI rows alone SHALL NOT issue an executable recovery witness. The native UTF8 view adapter SHALL select this constructor only in an active checked scope and check failure before accessing or publishing its payload.

#### Scenario: Failed UTF8 allocation cannot publish or dereference a partial record
- **GIVEN** an admitted checked invocation reaches canonical UTF8 construction
- **WHEN** allocation or temporary root admission fails
- **THEN** the checked source closure returns failure before subsequent stores and the adapter does not access the partial payload
- **AND** the outer caller publishes its pre-admitted immutable allocation failure value

#### Scenario: Constructor lookalike cannot issue checked provider authority
- **GIVEN** an ordinary source declaration has the same name, ABI or record geometry as the canonical constructor
- **WHEN** checked runtime constructor emission is requested
- **THEN** missing exact embedded source and current canonical runtime authority prevents emission

### Requirement: Checked Dynamic counterpart closure and typed result factories
Checked Dynamic Create, Cast and Map SHALL invoke only source-issued guarded counterpart closures correlated with the ordinary callback's exact source and signature identities in the current admitted image and generation. The canonical erased constructor and reader counterparts SHALL use the sole ordinary descriptor authority. Checked typed Result construction SHALL clone the exact canonical source factory and use an invocation-owned native status slot; it SHALL NOT depend on scratch allocation after failure. Failure SHALL be checked before each payload dereference, field store and result publication. Map SHALL additionally retain the exact finite no-yield effect witness for its mapping callback. Callback tokens, role numbers, service names and manifest signatures alone SHALL NOT grant this authority.

#### Scenario: Checked mapping callback proof is missing
- **GIVEN** an ordinary admitted Dynamic mapping callback exists without its source-issued guarded counterpart
- **WHEN** checked Map attempts the mapping
- **THEN** the operation rejects before invoking an allocation-unsafe callback

#### Scenario: Result factory allocation fails
- **GIVEN** a checked canonical Dynamic operation owns a native status slot and an admitted immutable failure destination
- **WHEN** its typed Result factory fails to allocate or register a temporary root
- **THEN** it returns private failure before later stores or dereferences
- **AND** the caller publishes its pre-admitted failure without allocating a replacement Result
