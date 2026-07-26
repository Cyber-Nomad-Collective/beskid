## ADDED Requirements

### Requirement: Managed object type descriptor
Every managed object allocated through `beskid_rt_v5_managed_object_allocate` SHALL carry a `BeskidTypeDescriptor` (40 bytes, alignment 8) with fields `size: usize`, `alignment: usize`, `pointer_map: pointer`, `pointer_count: usize`, `flags: u32`, and `reserved: u32`.

#### Scenario: Descriptor validation at allocation time
- **GIVEN** an allocation request with a type descriptor
- **WHEN** `AllocateObject` is called
- **THEN** the descriptor SHALL be validated: `size >= 16`, `alignment` is a power of two >= 8, `pointer_map` is non-null iff `pointer_count > 0`, every pointer-map offset is >= 16, 8-byte aligned, and falls within `size - 8`

#### Scenario: Descriptor flags discriminate aggregate vs closure
- **GIVEN** a valid `BeskidTypeDescriptor`
- **WHEN** bit 0 of `flags` is inspected
- **THEN** a value of 0 SHALL indicate a closure environment, and a value of 1 SHALL indicate an aggregate value

### Requirement: Object header format
Every managed object SHALL begin with a 16-byte `BeskidObjectHeader` at offset 0, containing `descriptor: pointer` at offset 0 and `gc_word: usize` at offset 8.

#### Scenario: Header initialization
- **GIVEN** a freshly allocated and zeroed object
- **WHEN** `InitializeObjectHeader` stamps the header
- **THEN** `descriptor` SHALL point to the validated type descriptor, and `gc_word` SHALL be 0 (white)

### Requirement: GC word mark state encoding
The `gc_word` field in `BeskidObjectHeader` SHALL encode mark state using values 0 (white/unreached), 1 (gray/in-progress), and 2 (black/reached). All other values are reserved and SHALL be treated as white by the collector.

#### Scenario: Mark state transitions
- **GIVEN** a managed object with `gc_word = 0`
- **WHEN** the GC marker reaches it
- **THEN** `gc_word` SHALL transition 0 → 1 → 2 during the mark phase, and reset to 0 during sweep

### Requirement: Allocation request contract
An allocation request SHALL be a 24-byte `BeskidAllocationRequest` with fields `size: usize` at offset 0, `alignment: usize` at offset 8, and `descriptor: pointer` at offset 16. The `size` and `alignment` SHALL exactly match the corresponding descriptor fields.

#### Scenario: Size/alignment mismatch rejection
- **GIVEN** an allocation request whose `size` or `alignment` does not match its `descriptor`
- **WHEN** `AllocateObject` is called
- **THEN** the allocation SHALL fail and return a null pointer (pre-OOM check) or trap

### Requirement: Out-of-memory trap
When the underlying platform allocator cannot satisfy an allocation request, `AllocateObject` SHALL invoke `trap(out_of_memory, message, message_len)` rather than returning a null pointer to the caller.

#### Scenario: OOM trap delivery
- **GIVEN** the platform allocator returns null for a valid allocation request
- **WHEN** `AllocateObject` detects the failure
- **THEN** it SHALL call `trap(5, "managed object allocation failed", 32)` and SHALL NOT return

### Requirement: Codegen-emitted static allocation data
The compiler SHALL emit three static data objects per aggregate literal: a pointer map, a type descriptor, and an allocation request. These SHALL conform to the `BeskidTypeDescriptor`, `BeskidAllocationRequest`, and pointer-map layouts declared in `runtime_manifest.bsol`.

#### Scenario: Aggregate static data emission
- **GIVEN** an aggregate literal in source code
- **WHEN** the codegen module emitter processes it
- **THEN** a `BeskidTypeDescriptor` with `flags` bit 0 set to 1, a pointer map with field offsets, and an `BeskidAllocationRequest` referencing that descriptor SHALL be emitted as local static data

#### Scenario: Closure static data emission
- **GIVEN** a closure literal with captures
- **WHEN** the codegen module emitter processes it
- **THEN** a `BeskidTypeDescriptor` with `flags` bit 0 set to 0, a pointer map with capture offsets, and an `BeskidAllocationRequest` referencing that descriptor SHALL be emitted as local static data

## MODIFIED Requirements

None.
