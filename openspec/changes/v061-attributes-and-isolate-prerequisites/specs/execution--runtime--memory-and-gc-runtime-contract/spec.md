## MODIFIED Requirements

### Requirement: Ship Phase A GC before parallel mutators: Decision [D-EXEC-RT-0005]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> | Phase | Mutators | Ship order |
> | --- | --- | --- |
> | **A (v0.2)** | One Beskid mutator; many cooperative fibers | **Default ship** |
> | **B** | Parallel mutators | Not implemented in 0.6.0; the runtime has no Phase B switch. Parallel execution is planned in the changes `v061-attributes-and-isolate-prerequisites` through `v065-parallel-sequences` |
> 
> Phase B **must not** become the default without updating this feature hub and fiber
> scheduler contracts.

Phase A SHALL be read per heap, not per process: a process holds many heaps, one per runtime instance, and each heap has one allocator, one collector and one mutator thread. One object SHALL be written by at most one runtime instance at any time. Phase A per heap is preserved when several runtime instances run in parallel, because no two of them share an allocator, a collector or a mutable object.

**Stable ID:** `BSP-REQ-46C4422DC096`  
**Legacy source:** `site/spec-content/platform-spec/execution/runtime/memory-and-gc-runtime-contract/adr/0005-phase-a-before-phase-b/content.md`  
**Source SHA-256:** `e1c463259520657e4c81b6420e3a90e87afaea20ee7f12314a79dec3275d8563`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

#### Scenario: Two runtime instances keep one mutator each
- **GIVEN** two runtime instances created by `IsolateCreate` on two threads
- **WHEN** both allocate at the same time
- **THEN** each allocation lands in its own instance's heap and neither instance's collector marks, sweeps or frees an object in the other heap

### Requirement: Heap objects carry type descriptors for scanning: Decision [D-EXEC-RT-0007]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> | Rule | Detail |
> | --- | --- |
> | Header | Heap objects begin with a **type descriptor pointer** for precise scan |
> | Allocation | `alloc(size, type_desc)` uses `abfall::Heap::allocate_beskid` |
> | Strings / arrays | `BeskidStr`, `BeskidArray` headers per [builtins layout](/platform-spec/execution/abi-and-host/builtins-and-symbols/) |
> | Roots | Stacks (stack maps), globals (registered roots), `gc_root_handle` externals |
> | Compiler | Lowers descriptors and stack maps; does not embed collector policy |

The descriptor `flags` word SHALL carry `TYPE_DESCRIPTOR_IMMUTABLE = 4` next to `TYPE_DESCRIPTOR_ARRAY = 1` and `TYPE_DESCRIPTOR_UTF8_VIEW = 2`. The compiler SHALL set it on the descriptor of every nominal type whose transfer class is Shared and that is not an enum, and the runtime SHALL set it on the canonical string record descriptor. Array descriptors SHALL never carry it. The runtime SHALL expose the flag through `TypeDescriptorImmutableFlag()` in `Runtime/Bootstrap/Objects.bd`. No collector behavior SHALL depend on the flag in this release.

**Stable ID:** `BSP-REQ-8EDA62A2D0E0`  
**Legacy source:** `site/spec-content/platform-spec/execution/runtime/memory-and-gc-runtime-contract/adr/0007-heap-type-descriptors/content.md`  
**Source SHA-256:** `d048da0588f5491093ffb15b350cced510c8f6e9a617aa315d22936e6e97da9d`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

#### Scenario: Immutable type descriptor flag
- **GIVEN** `[Immutable] pub type Job { string id, i64 size }` and `pub type Draft { string id, i64 size }`
- **WHEN** the two aggregate descriptors are emitted
- **THEN** `Job`'s flags word has bit 4 set and `Draft`'s does not

#### Scenario: Arrays never immutable
- **GIVEN** the array descriptor for `i64[]`
- **WHEN** its flags are read
- **THEN** `TYPE_DESCRIPTOR_ARRAY` is set and `TYPE_DESCRIPTOR_IMMUTABLE` is clear

## ADDED Requirements

### Requirement: Non-moving collector
The collector SHALL be non-moving: once allocated, a managed object SHALL keep its address until it is freed, in every heap and in every collection phase. No compaction, promotion by copy, or relocation of managed objects SHALL be introduced without a change to this capability. Sharing an object between heaps by pointer depends on this rule.

#### Scenario: Address stable across collections
- **GIVEN** a managed object whose address is recorded before an allocation-triggered collection
- **WHEN** the collection completes and the object is still reachable
- **THEN** the object is at the recorded address

### Requirement: Foreign references
A foreign reference is a managed pointer, held by one runtime instance, whose target lies in a heap region owned by a different runtime instance. The owner of an object SHALL be the runtime instance whose heap allocated it and SHALL not change while the object lives. A runtime instance's collector SHALL never mark, sweep, free or write the header or span metadata of a foreign object; marking SHALL stop at a foreign reference. In this release no foreign reference is created by the language, the corelib or the runtime; the definition and the stop rule are normative so that later releases add counting without changing this contract.

#### Scenario: Marking stops at a foreign pointer
- **GIVEN** a test harness that stores, into an object of heap A, a pointer to an object allocated in heap B
- **WHEN** heap A collects
- **THEN** the object in heap B is neither marked nor freed by A's collector and heap B's span metadata is byte-identical before and after A's collection

### Requirement: Process-wide region-to-owner map
The runtime SHALL keep one process-wide map from heap region address range to owning runtime instance. `IsolateCreate` and every region growth SHALL register the region before the first allocation in it, and `IsolateDestroy` SHALL unregister the instance's regions after its heap is released. The export `beskid_rt_v5_region_owner(address) -> pointer` SHALL return the owning runtime instance of any address inside a registered region's object range and null otherwise, from any attached or unattached thread, without taking a lock on the lookup path; registrations SHALL publish with release ordering and lookups SHALL read with acquire ordering through the atomic intrinsics. `FindHeapRegionContaining` SHALL keep its per-heap meaning.

#### Scenario: Owner of a primary-heap address
- **GIVEN** a process with one runtime instance and a managed object `o` allocated in it
- **WHEN** `RegionOwner(o)` is called
- **THEN** it returns the primary runtime instance

#### Scenario: Unregistered address
- **GIVEN** a `SystemAllocate`d native buffer
- **WHEN** `RegionOwner` is called with its address
- **THEN** it returns null
