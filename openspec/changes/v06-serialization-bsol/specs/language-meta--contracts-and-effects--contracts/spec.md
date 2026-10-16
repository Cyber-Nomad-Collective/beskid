## ADDED Requirements

### Requirement: Generic implementation declaration scope
An implementation block SHALL support declared generic parameters and a trailing where clause, using `impl<T, E> Receiver<T> : Contract<E> where E: Encoder { ... }`. Its generic parameters SHALL be lexically scoped over the receiver, applied conformances, associated bindings, method signatures and method bodies. Methods SHALL inherit the implementation's substitutions and bounds. Duplicate or unbound parameters, incompatible bounds and generic arity mismatches SHALL reject with declaration spans. AST, reflection, typed syntax contributions and canonical queries SHALL retain ordered parameters and full bound paths; a serializer SHALL NOT replace a generic parameter with an unresolved nominal name or a boxed dynamic value.

#### Scenario: Format-neutral generated implementation
- **GIVEN** a record `Item<T>` and a generated `impl<T,E> Item<T> : Serializable<E> where E: Encoder`
- **WHEN** the program calls encoding with distinct concrete element and encoder types
- **THEN** each call selects an exact current specialization with both receiver and encoder substitutions
- **AND** the original record implements the contract without a public wrapper changing Encode semantics.

#### Scenario: Bound failure
- **GIVEN** an implementation requires `E: Encoder`
- **WHEN** a concrete caller supplies a type without the exact applied Encoder implementation
- **THEN** semantic validation rejects before lowering and emits no callable specialization.

### Requirement: Issuer-bound generic contribution specialization
A generated generic implementation SHALL bind its template declaration and typed contribution through current issuer-owned correspondence. A template handle SHALL NOT grant a concrete TypeShape or stable ShapeId. Concrete serialization metadata and executable adapters SHALL be issued only after exact argument count, source declaration, bounds, immutable package provenance and current generation are revalidated. Receiver and output correspondence SHALL retain all type arguments; copying contribution metadata into a new generation SHALL require private reissuance against unchanged admitted source and the actual contributed implementation.

#### Scenario: Stale or foreign template
- **WHEN** a serialization Mod binds a stale template, foreign contribution or wrong generic argument list
- **THEN** contribution admission rejects before a descriptor or executable adapter is published.

#### Scenario: Distinct instantiations
- **WHEN** the same admitted template is instantiated with `i32` and `string`
- **THEN** its field types and applied Encoder contracts use the respective substitutions and its stable identities remain distinct.
