## MODIFIED Requirements

### Requirement: Dynamic types and mapping (v0.3 scope): Contract [compiler/codegen-and-ir/dynamic-types-and-mapping]
Dynamic SHALL use registered serializable shape descriptors and canonical traced runtime allocation. This requirement supersedes the historical HIR/CLIF lowering entry paths, struct-only eligibility fallback, resolved-item FNV identity and ignored mapping behavior in the v0.3 migrated contract. Eligibility SHALL be Serialization Mod semantic authority; codegen SHALL consume approved dynamic plans through TypedProgram/CodegenInput/ISLE. Stable ShapeId SHALL be distinct from a checked nonzero process-local registry tag; zero SHALL be invalid. ABI cell layout/version SHALL be declared through canonical runtime-kit authority, and its descriptor SHALL trace non-null payload and preserve shape metadata lifetime. Wrap/Cast/Map SHALL return checked results, never expose GC addresses as serialized values.

#### Scenario: Conformance exercises Contract
- **GIVEN** two eligible registered shapes with nonzero distinct local tags
- **WHEN** values wrap and checked casts execute
- **THEN** correct casts succeed; wrong/zero/unknown source or destination shapes reject

#### Scenario: Canonical lowering (DYN-06-02)
- **GIVEN** a dynamic wrapping or mapping operation
- **WHEN** compilation lowers it
- **THEN** canonical semantic eligibility and descriptor/ABI plans are consumed without retired HIR lowering or structural eligibility bypass

## ADDED Requirements

### Requirement: Fresh lossless registered dynamic mapping
AOT and runtime-known-shape mapping SHALL use registered descriptor-approved field plans and allocate a fresh owned destination. Exact compatible fields, declared missing defaults/optional values and explicitly approved lossless integer widening MAY be mapped; narrowing, string coercion, unregistered reflection, resource fields, unknown/disallowed fields and incompatible enum/shape versions SHALL reject. Source and destination SHALL not alias mutable aggregate storage. All fields SHALL validate before destination publication; mapping SHALL NOT return the source payload as success.

#### Scenario: Fresh mapping (DYN-06-03)
- **GIVEN** compatible source/destination records with nested aggregates
- **WHEN** AOT and runtime registered mapping execute
- **THEN** both return a fresh destination with equivalent values and mutation cannot change the source

#### Scenario: Incompatible atomic mapping (DYN-06-04)
- **GIVEN** a mapping requires numeric narrowing or fails on a later nested field
- **WHEN** mapping executes
- **THEN** it rejects without returning any partial destination or changing the source

### Requirement: Dynamic GC and lifecycle proof
Dynamic cells, payloads and in-progress mapping destinations SHALL remain rooted/traced across allocation, safepoints and forced collection according to canonical collector/barrier rules. Descriptor and registry lifetime SHALL cover every live cell. Registration collision, null payload, allocation failure and repeated construction/drop SHALL have checked outcomes and deterministic cleanup. Generic instantiations SHALL retain distinct compatible descriptor identities.

#### Scenario: Forced collection (DYN-06-05)
- **GIVEN** dynamic nested records contain strings/arrays and two generic instantiations
- **WHEN** forced collection occurs during wrap/map and repeated creation/drop
- **THEN** live nested values retain correct contents, distinct identities remain correct, and unreachable values/resources are reclaimed

#### Scenario: Allocation failure (DYN-06-05)
- **GIVEN** allocation failure is injected into cell or destination construction
- **WHEN** Wrap or Map runs
- **THEN** a checked error returns with no dangling pointer or partially published destination


### Requirement: Versioned traced Dynamic V1 cell and owned registry
Dynamic V1 SHALL allocate a canonical 40-byte, alignment-8 GC cell with descriptor at offset 0, collector state at 8, managed payload at 16, managed shape record at 24 and nonzero process-local tag at 32. Its descriptor SHALL trace offsets 16 and 24. RuntimeState SHALL remain 64 bytes and BeskidTypeDescriptor SHALL remain 40 bytes; reserved descriptor storage SHALL NOT encode shape identity. The shared internal callback registry V3 SHALL occupy 1072 bytes and own the Dynamic registry root handle at offset 1056 and the checked Glue owner-record root handle at offset 1064, preserving all prior fields. Replacement, rollback and shutdown SHALL preserve or release each root ownership explicitly; shutdown SHALL release both before the live-handle guard.

#### Scenario: Cell-only collection root (DYN-V1-GC)
- **GIVEN** a canonically emitted registered shape and live managed payload wrapped in a V1 cell
- **WHEN** only the cell is rooted and forced collection runs
- **THEN** payload and shape record remain live, headers remain valid, and releasing the cell permits reclamation

#### Scenario: Registry replacement and shutdown (DYN-V1-OWNER)
- **GIVEN** registered shapes and an installed callback registry
- **WHEN** callback registry replacement and process shutdown occur
- **THEN** replacement preserves the Dynamic owner and shutdown releases it before checking remaining external handles

### Requirement: Canonical bounded Dynamic registration and complete V1 migration
Shape registration SHALL consume production compiler-emitted signature and layout metadata derived from generation-bound ModSemanticAuthority and canonical layout facts. Metadata SHALL preserve nominal identity, generic substitution, ordered field identities/types, scalar representations and managed-reference ownership. Complete bounded closure, cycles, collisions, stale issuer/process generations and invalid pointer maps SHALL be checked before publication. Invocation-local semantic handles SHALL NOT become persistent runtime metadata. V1 Create, Cast and Map SHALL use owner/generation checked registered tokens and checked results. All old internal signatures, call sites and runtime manifest entries SHALL migrate explicitly; no descriptor-only compatibility delegation or ignored mapping fallback SHALL remain. Native export schema migration SHALL be declared explicitly rather than retaining obsolete symbols with apparent success.

#### Scenario: Source-authoritative registration (DYN-V1-EMIT)
- **GIVEN** a fixture containing serializable nominal types and applied generics
- **WHEN** the production Serialization Mod emits registration metadata
- **THEN** canonical semantic and layout facts supply the full signature and no handwritten test signature or duplicate semantic registry supplies authority

#### Scenario: Invalid registration and mapping (DYN-V1-REJECT)
- **GIVEN** zero, stale, wrong-owner or unknown shape/mapping tokens, incomplete metadata or conflicting signatures
- **WHEN** registration, Create, Cast or Map executes
- **THEN** it returns a checked error without raw-pointer inspection, source alias success, partial destination publication or leaked roots

### Requirement: Public issuer-bound managed Dynamic facade
The canonical Corelib Dynamic facade SHALL expose managed Dynamic value and payload nominals and checked Create, Cast and Map results. Native status buffers, callback pointers, descriptor addresses and GC object addresses SHALL remain private normalized transports. Sealed nominal authority SHALL require current registered declaration generation, preparation-issued canonical Corelib package provenance and exact compiler-owned source correspondence. Ordinary empty aggregate construction, field copying and user-owned same-name or exact-source-copy declarations SHALL NOT acquire this authority or a synthetic sixteen-byte representation. Runtime constructors and public results SHALL use the same canonical nominal identities and SHALL retain managed values across result allocation and collection.

#### Scenario: Public managed value survives collection (DYN-V1-PUBLIC)
- **GIVEN** a compiler-emitted registered shape and payload created through the public managed facade
- **WHEN** the payload creation scope exits, collection runs and the retained Dynamic value is cast
- **THEN** the checked payload preserves its contents without a user raw-pointer conversion or explicit raw GC handle

#### Scenario: Untrusted nominal cannot acquire sealed representation (DYN-V1-SEALED)
- **GIVEN** an ordinary empty constructor or a user-owned same-name or exact-source-copy Dynamic declaration
- **WHEN** construction or native Dynamic bridge admission is requested
- **THEN** the compiler rejects the unauthorized representation and the runtime publishes no managed cell
### Requirement: Library associated registered callbacks and descriptor lifetime

Each registered Dynamic shape and mapping SHALL retain its canonical admitted library identity as well as source generation and process issuer. Registration, duplicate admission, creation, casting, and mapping SHALL reject a closed or foreign library before invoking a callback. Duplicate shape admission within one library domain SHALL compare full signature, source identity, generation, library, payload and cell descriptor identities, and constructor and reader addresses. Distinct admitted libraries MAY register the same stable shape identity but SHALL receive distinct checked process tags. Descriptor and callback images SHALL remain pinned by the canonical process lease through heap destruction; closing one library SHALL stop calls without unloading an image that a live managed cell can still reference. Implementations SHALL NOT replace this lifetime with a separate global image registry or a per-library early unload.

#### Scenario: Same signature with different callback is rejected
- **GIVEN** an admitted shape with exact signature, descriptors, and constructor and reader addresses
- **WHEN** duplicate registration within that library domain substitutes either callback address
- **THEN** registration fails without publishing a tag or calling the substituted callback

#### Scenario: Equal stable shapes in different libraries remain distinct owners
- **GIVEN** two admitted libraries with the same stable shape identity
- **WHEN** both register their independently validated shape closures
- **THEN** each receives a distinct process tag
- **AND** a cell from one domain cannot be cast with the other domain's tag

#### Scenario: Closed library cell cannot invoke foreign code
- **GIVEN** a live cell whose registered shape belongs to a subsequently closed library
- **WHEN** creation, casting, or mapping attempts to use that shape
- **THEN** it returns a declared failure before invoking callbacks
- **AND** the image remains pinned until heap destruction so tracing cannot dereference unloaded descriptor data

### Requirement: Compiler-issued public generic shape binding
The public Dynamic `Shape<T>()` operation SHALL obtain a nonzero shape tag only from the current canonical declaration's concrete specialization and the same complete compiled type graph and Pack box descriptor used by `Pack<T>`. The compiler SHALL emit its private shape getter and native initializer from that source authority, and SHALL require canonical shared-provider initialization before entry publication. A caller-authored signature, alias, integer tag, or same-name declaration SHALL NOT authorize a Shape binding.

#### Scenario: Shape-only entry receives its compiled descriptor closure
- **GIVEN** a registered program calls canonical `Shape<T>()` without allocating a T value
- **WHEN** the compiler prepares and admits that program
- **THEN** its exact source-derived Pack box descriptor and complete T signature are emitted and admitted through the once-only initialization closure before the entry can execute
- **AND** the getter returns the tag issued by that closure.

#### Scenario: Mutated prepared shape body loses authority
- **GIVEN** a lowered artifact retains a compiler-issued Dynamic initialization plan
- **WHEN** its body, data, descriptor, import, or export graph is changed
- **THEN** privileged emission rejects the artifact before native compilation or initialization.

### Requirement: Source-typed extraction from a packed value
Public `Unpack<T>` SHALL produce the exact source-specialized `Result<T,DynamicErrorV1>` using the canonical box descriptor and source-derived field ABI for T. It SHALL validate current managed-allocation membership and descriptor identity before any field dereference, retain the box across allocations, and use the current typed Result constructors. An incompatible, stale, foreign, or allocation-failed value SHALL fail closed without a pointer-to-T cast or scalar sentinel.

#### Scenario: Mismatched T cannot extract the packed field
- **GIVEN** a live payload was packed with one complete canonical type identity
- **WHEN** `Unpack<T>` requests an incompatible complete type identity
- **THEN** extraction returns the typed Invalid error before loading the field or publishing T.

#### Scenario: Managed extracted value survives Result allocation
- **GIVEN** the packed field is a managed string, array, or nominal value
- **WHEN** the typed Result constructor allocates or collection moves objects
- **THEN** source-typed roots preserve the field and the returned Result contains its current managed reference.

### Requirement: Static generic contract bridge substitution

The compiler SHALL represent private Dynamic bridges using the existing generic contract declaration grammar. A static contract method SHALL inherit generic binders from its exact current owning contract, SHALL substitute explicit receiver type arguments through canonical call-specialization and source-result facts, and SHALL have no implicit managed receiver argument. Equal binder names in another declaration SHALL NOT grant Dynamic bridge authority.

#### Scenario: Concrete static bridge specialization

- **GIVEN** an exact registered `contract Bridge<T>` with method `T Echo(T value)`
- **WHEN** the current assembly resolves `Bridge<i64>.Echo(7)`
- **THEN** its canonical call signature SHALL have one i64 parameter and an i64 result, with T bound to that receiver argument
- **AND** an ordinary user Bridge declaration SHALL receive no canonical Dynamic packing capability.

#### Scenario: Current owning declaration is required

- **GIVEN** a private Dynamic bridge call specialized under a current Pack, Shape, or Unpack declaration
- **WHEN** the compiler issues its bridge specialization
- **THEN** the owning generic contract and current generation SHALL be validated before its substitution is consumed
- **AND** a missing, stale, ambiguous, or wrong-arity receiver SHALL fail closed.

### Requirement: Checked callback image correspondence

Dynamic Create, Cast, and Map executing inside an admitted checked allocation scope SHALL invoke only a producer-issued guarded counterpart of the exact registered constructor, reader, or transform. The private image closure SHALL correlate ordinary roles 3, 4, and 5 with guarded roles 13, 14, and 15 by identical complete source and signature digests, current library and generation, and independently pinned executable addresses. Runtime lookup SHALL validate this membership before invoking an address and SHALL reject missing or ambiguous counterparts. A callback registration token alone SHALL NOT establish allocation effect safety.

#### Scenario: Missing guarded callback rejects before invocation

- **GIVEN** a current Dynamic shape with an admitted ordinary constructor but no guarded counterpart
- **WHEN** Create executes inside an admitted checked allocation scope
- **THEN** Create SHALL reject without calling that ordinary constructor or publishing a cell.

#### Scenario: Guarded callback allocation failure preserves publication

- **GIVEN** a current image closure containing the exact source-issued guarded callback counterpart
- **WHEN** its checked allocation fails while creating or mapping a Dynamic value
- **THEN** the runtime SHALL inspect the sticky failure before reading the returned managed object or publishing an output
- **AND** roots acquired by the operation SHALL be released without changing the prior caller destination.
