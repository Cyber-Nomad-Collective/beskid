## MODIFIED Requirements

### Requirement: Manifest-derived ABI-v5 managed object allocation
The canonical ABI-v5 runtime manifest SHALL declare
`beskid_rt_v5_managed_object_allocate(pointer request) -> pointer`. Its request
MUST reference a non-null `BeskidTypeDescriptor` whose size, alignment, flags,
and pointer map are structurally valid and agree exactly with the request. The
canonical runtime MUST reject null, malformed, mismatched, unowned, or
unrepresentable requests before allocation. A successful call SHALL return one
zeroed object-header base, install the validated descriptor, initialize the GC
word, and expose the object only to the manifest-derived precise tracing model.
Raw system allocation MUST remain private to canonical runtime source and MUST
NOT become a generated-code or host fallback.

Generated aggregate construction MUST establish manifest-approved roots for
the new owner and every pointer-bearing initializer value before an
allocation-capable operation can make them otherwise unreachable. The owner
root MUST remain live until every field store is complete. Each pointer field
store MUST be followed by the canonical write barrier before an allocation or
safepoint may observe the edge; scalar stores MUST NOT call the pointer
barrier. The construction root MUST be released exactly once on every normal
or recoverable-failure path; a non-returning trap MUST have no continuation
that can reuse or release the root. Ordinary managed pointer-field assignment
MUST preserve the owner and value through the same store/barrier interval.

#### Scenario: Valid managed object request
- **GIVEN** a canonical descriptor and request with matching size, alignment,
  flags, and pointer map
- **WHEN** generated lowering calls managed-object allocation
- **THEN** the runtime returns one zeroed object-header base whose descriptor
  and GC word match the ABI-v5 layout without a raw allocator fallback

#### Scenario: Invalid managed object request
- **GIVEN** a null request or a request whose descriptor, size, alignment,
  flags, or pointer map violates the ABI-v5 contract
- **WHEN** managed allocation validates the request
- **THEN** it fails before allocating, initializing a header, publishing an
  object, or leaking a root

#### Scenario: Aggregate survives allocating field initializers
- **GIVEN** a managed aggregate with pointer fields whose initializer
  evaluation can allocate and trigger collection
- **WHEN** generated construction allocates and initializes the aggregate
- **THEN** the owner and live initializer values remain rooted, every pointer
  edge is stored and barred before a safepoint, and the construction root is
  released once after initialization

#### Scenario: Pointer field replacement preserves the new referent
- **GIVEN** a rooted managed aggregate and a pointer field assignment during an
  active marking phase
- **WHEN** direct ISLE field-assignment lowering stores the new value
- **THEN** it retains owner and value through the store/barrier sequence and
  the new referent remains reachable

#### Scenario: Closure allocation shares the canonical implementation
- **GIVEN** a closure allocation request accepted by the managed-object
  contract
- **WHEN** the closure allocation wrapper handles the request
- **THEN** it delegates to the same managed-object allocation implementation
  without parallel validation, zeroing, or header initialization
