## ADDED Requirements

### Requirement: Rust Glue C ABI separation
Generated Rust Glue wrappers SHALL use the selected target C ABI with explicit representations and SHALL NOT expose native Rust ABI, Rust bool/char/str/Vec/Result layout or assume the Rust runtime embedding ABI is the user Glue ABI. Beskid exports SHALL execute canonical AOT code within its documented runtime entry/root scope. User FFI layout band and runtime ABI SHALL be separately recorded and validated; changed runtime export signatures SHALL follow the runtime ABI version gate. Panic/unwind SHALL NOT cross C boundaries: catches occur inside compatible wrappers and translate declared errors; abort/trap becomes terminal process failure.

#### Scenario: Representation is explicit
- **GIVEN** manual and generated wrappers for Rust functions and Beskid exports
- **WHEN** their signatures are inspected and linked on each required target
- **THEN** they use C-compatible scalar/view shapes and matching bands (R4-ABI-01)

#### Scenario: Foreign panic isolated
- **GIVEN** a foreign call panics or aborts
- **WHEN** the boundary executes
- **THEN** caught panic returns declared failure and abort terminates the bridge with typed process failure; no unwind crosses C (R4-CALL-04)

#### Scenario: Runtime gate independent
- **GIVEN** an artifact has compatible user layout but incompatible runtime ABI
- **WHEN** the export service loads
- **THEN** it fails closed before invoking exports

### Requirement: Normalized managed local transport
Manual and generated local C wrappers SHALL normalize borrowed UTF-8 and bytes to `(const uint8_t*, target usize length)` and managed returns to a signed `int32_t` status plus a checked writable `GlueOwnedView*` out parameter. `GlueOwnedView` SHALL contain pointer, target usize length, and checked u64 owner token in that order; on every required 64-bit target its size/alignment SHALL be 24/8 with offsets 0/8/16. Status SHALL be 0 success, 1 invalid boundary value, 2 declared foreign error, or 3 caught foreign panic. Scalar success signatures SHALL retain direct exact-width values and unit SHALL use void; scalar failures SHALL use an explicitly checked wrapper, never a success-value sentinel.
The wrapper SHALL validate output nullness/alignment, input null/nonempty consistency, strict UTF-8, and the declared 16 MiB bound before effects. It SHALL copy bounded managed inputs and outputs under canonical GC root scopes, zero the output on failure, and publish no partial buffer. The owning library SHALL export `int32_t beskid_glue_release_<librarySha256>(uint64_t token)`, where `librarySha256` is the lowercase SHA-256 of its exact UTF-8 logical library identity, and release exactly once. Generated declarations and private native admission SHALL use that exact qualified symbol rather than a shared basename. The canonical provider SHALL derive the token's shape, kind, and generation from the live source-owned library record before release. Tokens SHALL be issued and checked through the canonical process owner authority with library, session, shape, and generation provenance; a library-local counter or independent fallback registry SHALL NOT authorize production ownership. Hidden adapter pointers SHALL NOT be exposed as logical user raw-address signatures or serialized into the stdio bridge.

#### Scenario: Managed export succeeds under collection
- **GIVEN** a Rust caller invokes a Beskid string or byte-array export using this transport
- **WHEN** allocation and collection occur while the canonical adapter copies the result
- **THEN** status is zero, contents including embedded NUL and Unicode or high bytes are exact, and the valid owned token releases once (R4-OWN-01, R4-OWN-02)

#### Scenario: Invalid managed input publishes nothing
- **GIVEN** invalid UTF-8, null nonempty input, excessive length, or a null or misaligned output
- **WHEN** the checked wrapper is called
- **THEN** it returns invalid status before effects and any valid output is zeroed without a published token (R4-CALL-03)

#### Scenario: Owner authority rejects alien and stale tokens
- **GIVEN** a token belongs to another library/session/shape/generation or has already been released
- **WHEN** the owning release wrapper checks it
- **THEN** it returns invalid status without freeing any live allocation (R4-OWN-03)

### Requirement: Source-owned rooted owner record lifecycle

The canonical provider SHALL construct owner records from registered Runtime/Glue/OwnerRecord.bd typed constructors and their compiler-emitted aggregate descriptors. Owner chains SHALL use typed managed arrays with zero or one predecessor and typed managed byte payloads. Native foreign-buffer pointers SHALL remain untraced scalar storage. Callback registry V3 SHALL preserve its existing 1056-byte prefix, own Dynamic live-root handle at 1056 and Glue owner live-root handle at 1064, and have size 1072. Replacement SHALL transfer both live roots without releasing them. Shutdown SHALL release foreign buffers and unroot both registry handles before checking external roots or clearing canonical handles.

Owner admission SHALL check nonzero process issuer, process-issued session, library, generation, kind, shape and token correlations. Opening a library SHALL establish a generation-bound ownership domain supporting multiple shapes. A scalar shape correlation SHALL NOT qualify canonical serializer signature authority; generated adapters SHALL bind their independently validated compiled shape set. Issuance SHALL be bounded to 65536 records per session and 16 MiB per copied payload, and return checked failure without publishing output when admission fails.

#### Scenario: Library and generation separation
- **GIVEN** two ownership domains in one canonical provider and an output owned by the first
- **WHEN** release uses the second library or a substituted generation, kind or shape
- **THEN** release fails and the output remains owned by the first domain
- **AND** release with all original correlations succeeds exactly once

#### Scenario: Root preservation and teardown
- **GIVEN** an owner chain with a live copied payload and Dynamic registry root
- **WHEN** callback registration replaces the registry and collection runs
- **THEN** both roots remain live and the copied payload retains its bytes
- **WHEN** the runtime shuts down and is initialized again
- **THEN** foreign buffers are freed and both old roots are unrooted before handle clearing
- **AND** old session tokens fail admission even if fresh GC slot generations coincide


### Requirement: Canonical GC-owned primitive UTF-8 storage
The runtime SHALL represent each newly constructed primitive String through a canonical source-declared Utf8ViewRecord whose descriptor and pointer map are emitted from the registered typed runtime assembly. The record SHALL contain a managed u8-array payload and untraced native data pointer and length. Its ABI-visible String view SHALL retain the existing data-and-length geometry while canonical reference normalization resolves that view to its live owning GC object. Descriptor flag 2 SHALL be admitted only for the compiler-authorized canonical runtime record with verified size 40, alignment 8 and pointer-map offset 16; user declarations with matching names or geometry SHALL NOT receive that authority. String construction, concatenation, integer conversion and slicing SHALL publish only fully initialized, rooted records. Collection SHALL retain backing bytes reachable through String roots and reclaim unreachable records and backing arrays without a separate immortal native-buffer allocation.

#### Scenario: String retained across collection
- **GIVEN** a String constructed from copied UTF-8 bytes containing an embedded NUL and a supplementary Unicode scalar
- **WHEN** a canonical GC handle roots its ABI-visible view and collection runs
- **THEN** the handle resolves to the same view and all bytes and length remain intact
- **AND** empty-string and concatenation results obey the same ownership contract.

#### Scenario: Forged UTF-8 view is rejected
- **GIVEN** an arbitrary native fat pointer or a user-defined record matching the canonical geometry
- **WHEN** the value is submitted to canonical managed-reference normalization
- **THEN** it SHALL NOT be admitted as a canonical String owner without the live allocation and compiler-issued descriptor authority.


### Requirement: Shared compiled-shape registration authority
Glue and Dynamic V1 SHALL share the callback-registry V3 Dynamic root at offset 1056. Native shape registration SHALL use the explicitly versioned 136-byte, eight-byte-aligned registration DTO: version and size at offsets 0 and 4, library and generation at 8 and 16, complete source SHA-256 at 24, complete signature SHA-256 at 56, signature pointer and native length at 88 and 96, payload and cell descriptor pointers at 104 and 112, and compiler-emitted constructor and accessor callbacks at 120 and 128. Registration SHALL retain source and full signature bytes in descriptor-backed managed records, recompute the signature digest through the canonical hash service, reject conflicting bytes or descriptor/callback closure under the same digest, and limit each signature to one MiB, aggregate signature storage to sixteen MiB, and registrations to 65536. A library owner token alone SHALL NOT grant compiled-shape authority: production registration SHALL be issued from the validated loaded artifact and current canonical specialization closure. Registered callbacks and descriptors SHALL remain pinned while any cell or registry references them.

#### Scenario: Conflicting or stale compiled shape rejected
- **GIVEN** a registered full signature and current compiler-issued constructor/accessor closure
- **WHEN** a registration reuses its digest with different bytes, source identity, descriptors, callbacks or generation
- **THEN** registration fails without replacing the existing shape or publishing a token.

#### Scenario: Registry teardown retains safe stale metadata
- **GIVEN** cells retain managed shape records whose registry owner is active
- **WHEN** the runtime closes its registry before dropping canonical roots and clearing handles
- **THEN** stale create, cast and map requests fail, while retained metadata follows the canonical GC lifetime without acquiring a new session identity.


### Requirement: Issuer-bound managed Dynamic erasure
The compiler SHALL represent logical erased Dynamic cells and payload boxes as sealed managed nominals issued from the verified canonical runtime source and exact syntax generation. An ordinary empty aggregate layout SHALL NOT authorize the cell's forty-byte runtime representation. The sealed cell nominal SHALL have no ordinary constructor or readable/copyable source fields. User declarations with matching names, annotations or geometry SHALL NOT acquire the representation capability. Only the checked typed native bridge SHALL return a logical sealed cell after validating live allocation, registered descriptor, shape, tag and active provider/session. Result and aggregate storage containing that nominal SHALL use normal managed root and barrier facts. Payload erasure SHALL likewise be issued from its registered payload descriptor rather than a pointer-to-nominal source cast. Old descriptor-only creation and unchecked mapping services SHALL be removed.

#### Scenario: Logical result retains a Dynamic cell
- **GIVEN** a checked typed bridge returns a registered cell as the canonical sealed managed nominal
- **WHEN** the caller allocates a Result or aggregate and collection runs before unpacking it
- **THEN** the cell, payload box and shape metadata remain reachable through ordinary managed facts.

#### Scenario: Empty lookalike cannot construct an erased cell
- **GIVEN** an ordinary source type named DynamicValueV1 or copied opaque annotation
- **WHEN** ordinary construction or ABI lowering attempts to obtain the canonical erased-cell representation
- **THEN** no canonical representation capability is granted, and construction through the real sealed declaration fails closed.

### Requirement: Source-derived opaque nominal boxing

A logical GlueHandle nominal SHALL retain its canonical managed source representation inside Beskid and SHALL cross normalized foreign transport only as a checked u64 owner token. Its adapter allocation descriptor, object geometry, token field offset and pointer map SHALL come from the current registered nominal aggregate layout and the sole compiler descriptor pass. The compiler SHALL project the exact binding type through the shared portable semantic shape issuer, preserving applied generic arguments and package/declaration identity; equal physical u64 fields SHALL NOT collapse different brands. Ordinary u64 signatures SHALL NOT receive nominal boxing or ownership authority.

#### Scenario: Distinct applied brands preserve distinct identities

- **GIVEN** one source-defined GlueHandle nominal Token<T> with an untraced u64 token field
- **WHEN** current bindings use Token<i64> and Token<u64>
- **THEN** both adapters SHALL use source-derived managed geometry while retaining distinct complete applied shape identities
- **AND** an ordinary u64 binding SHALL receive no GlueHandle shape grant.

#### Scenario: Foreign owner is a compiled dependency domain

- **GIVEN** an opaque token owned by a pinned Rust library and a Beskid consumer owned by another library
- **WHEN** the normalized adapter admits that token
- **THEN** it SHALL resolve the owner through a private producer-issued brand dependency correspondence
- **AND** it SHALL validate the actual process, session, library, generation, kind and complete brand before allocating a managed nominal box
- **AND** neither a library-name string nor a caller-supplied token-library pair SHALL establish that correspondence.

### Requirement: Opaque owner lifecycle in the canonical traced chain
Opaque ownership SHALL use the same canonical process issuer and traced owner-record chain as managed transfers. A kind-seven live record SHALL retain a copied forty-eight-byte payload containing the complete thirty-two-byte brand digest, eight-byte foreign address and eight-byte checked destructor address. A kind-eight dependency record SHALL retain sorted unique eighty-byte rows containing consumer brand digest, owning library identity, owning brand digest and owning generation. These scalar bytes SHALL NOT be traced as managed pointers, and the source record's foreign buffer SHALL be null for these borrowed-copy records. Their retained bytes SHALL debit the shared sixteen-MiB owner budget. Registration SHALL require private producer/loader image and source correspondence; callers SHALL NOT extend admitted brands or substitute an owning domain. Destructor role six SHALL have the checked physical signature i32(pointer), with panic contained by the owning Rust wrapper. Release SHALL tombstone and clear the record before invoking the admitted destructor exactly once; stale, foreign or already released tokens SHALL reject without invoking it. Library close SHALL release all live opaque owners before invalidating the image closure, while the process lease retains their image through heap destruction. Failure outputs SHALL remain zero and a destructor failure SHALL not make a released token live again.

#### Scenario: Foreign opaque token cannot acquire a managed box
- **GIVEN** a live token with the same scalar width but another complete brand or owning library
- **WHEN** a consumer normalizes it through its compiled dependency row
- **THEN** it rejects before allocating a box or calling source code

#### Scenario: Release failure cannot repeat destruction
- **GIVEN** an admitted Rust destructor reports a caught panic after its owner record is tombstoned
- **WHEN** release is repeated or the library closes
- **THEN** destruction is not invoked again and the checked failure remains distinct from a successful live token
