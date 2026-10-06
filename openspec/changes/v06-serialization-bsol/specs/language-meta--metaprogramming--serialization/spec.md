## MODIFIED Requirements

### Requirement: Serialization package split
Serialization SHALL have three package roles: Serialization Mod (`type: Mod`) owns `[Serialize]` and eligibility/Collector/incremental Generator; Serialization library transitively loads that Mod and exposes format-neutral metadata/value/encoding contracts; format libraries implement those contracts. BSOL SHALL be the required native format library; a small JSON test adapter SHALL demonstrate that generic metadata is format-independent, without requiring a separate broad JSON product API.

#### Scenario: Host depends on Serialization library
- **GIVEN** a host depends only on Serialization library
- **WHEN** dependency resolution and generation run
- **THEN** the Serialization Mod is loaded transitively and `[Serialize]` is available without a direct Compiler Mod SDK dependency

#### Scenario: Independent format metadata (SER-03)
- **GIVEN** one generated generic nested record adapter
- **WHEN** BSOL and the internal JSON adapter encode/decode it
- **THEN** both use the same descriptor and typed adapter contract without BSOL dependency in Serialization

### Requirement: Attribute ownership and generation model
`[Serialize]` SHALL be declared by Serialization Mod AttributeGenerator. Collector SHALL collect annotated resolved instantiated types, Analyzer SHALL reject unsupported shapes before lowering, and incremental Generator SHALL emit structural typed AST only with no CodeString/codeOutputs/source reparsing. Eligibility and field/variant/layout facts SHALL come from canonical generation-bound semantic queries. Generated adapters SHALL call specialized typed operations for known T without requiring every field to be boxed as dynamic.

#### Scenario: Generator emits AST not source text
- **GIVEN** GenericRecord<i32> and GenericRecord<string> annotated with `[Serialize]`
- **WHEN** one definition changes and incremental generation runs
- **THEN** distinct substituted adapters/metadata are emitted; only dependent outputs are replaced and removed annotations remove their generated outputs

#### Scenario: Source output rejected (SER-04)
- **GIVEN** a serialization Generator returns a code output or stale semantic handle
- **WHEN** the host accepts contributions
- **THEN** it rejects the contribution before lowering with a structural-generation diagnostic

## ADDED Requirements

### Requirement: Direct typed format reader
The format-neutral serialization library SHALL expose a Reader protocol distinct from the generated Decoder<T> target adapter. Reader SHALL provide checked typed scalar operations retaining declared integer and float widths, exact float bits and strict Unicode, and bounded record, sequence, map, variant and optional traversal. It SHALL retain current source location and structured failure diagnostics. Generated Decoder<T> SHALL statically specialize against the concrete Reader implementation, construct fields and payloads with their declared types and return a fresh T only after complete traversal, duplicate, required/default and unknown-field validation. Reader SHALL NOT require each field to be converted into a universal boxed value or use a runtime type-name switch as semantic authority.

#### Scenario: One decoder across formats
- **GIVEN** the same admitted typed decoder and distinct BSOL and test-format Reader implementations
- **WHEN** their concrete Decoder<T> specializations execute
- **THEN** both use the same declared field and variant operations while their readers own their respective representation and precision policies.

#### Scenario: Fresh typed result after complete traversal
- **WHEN** a later field has the wrong type, a duplicate name or a configured bound is exceeded
- **THEN** the decoder publishes no partial T and returns the reader's structured failure with source location.

### Requirement: Complete serializable shape profile
Serialization SHALL support bool; the fixed-width signed/unsigned integer and f32/f64 profile defined by `language-meta--type-system--types`; Unicode scalar char; string; explicit bytes; unit; nested and instantiated generic records; arrays/lists; string-key maps; payload enums; and optional values. Target-width word SHALL require an explicit declared wire width and range check. Pointers, arbitrary references, closures, resources, opaque handles, never and unsupported map keys SHALL be rejected before lowering. Constructors/field access and enum construction SHALL be proven legal by canonical semantic/ISLE facts.

#### Scenario: Full shape matrix (SER-01)
- **GIVEN** eligible generic records contain every supported shape including enum payload and optional nested arrays
- **WHEN** generated adapters execute in an installed program
- **THEN** values roundtrip without losing integer range, float width, field order or variant identity

#### Scenario: Unsupported shape diagnostic (SER-02)
- **GIVEN** an annotated field is a pointer, closure, opaque resource or non-string map key
- **WHEN** eligibility analysis runs
- **THEN** it fails before lowering at the field declaration span rather than boxing or coercing it

### Requirement: Stable registered metadata and format contracts
Serialization SHALL expose ShapeId, ShapeDescriptor, FieldDescriptor, VariantDescriptor, DataValue, SerializationLimits and SerializationError. ShapeId SHALL be SHA-256 of a length-delimited UTF-8 canonical signature containing locked package identity, qualified type, instantiated generic signatures, explicit schema version and ordered field/variant signatures. Registration SHALL compare the full signature and descriptor and reject digest collisions/incompatible registration; AST node IDs SHALL NOT define stable identity. DataValue SHALL distinguish unit, bool, signed/unsigned exact integer with declared width, float width/bits, Unicode scalar, string, bytes, sequence, ordered record, string-key map, tagged variant and optional. `Encode<T>(T value, Encoder encoder, SerializationLimits limits)` SHALL return Result<unit,SerializationError>; `Decode<T>(Decoder decoder, SerializationLimits limits)` SHALL return Result<T,SerializationError>. Encoder/Decoder SHALL own format representation policy and consume the same typed adapters. ShapeDescriptor SHALL distinguish array and list kinds and retain their exact element shape identity; accepting an array wire tag for a declared list, or the converse, SHALL reject.

#### Scenario: Collision rejection (SER-06)
- **GIVEN** two registrations claim the same ShapeId with different full signatures or field descriptors
- **WHEN** registration runs
- **THEN** the second registration is rejected and the first remains unchanged

#### Scenario: Format floating policy (SER-03)
- **GIVEN** a generic float value retains f32/f64 bits
- **WHEN** different format adapters encode it
- **THEN** each applies its explicitly documented policy without generic integer/float coercion or loss of width

### Requirement: Bounded atomic owned values
Default SerializationLimits SHALL be 8388608 input bytes, 8388608 output bytes, nesting depth128, aggregate100000 value nodes/collection entries and 1048576 bytes per scalar string/bytes. Explicit callers/adapters MAY select different documented values within checked address/word bounds. Accounting SHALL occur before allocation with checked arithmetic. Cycles SHALL be rejected using active-path identity; repeated acyclic aliases SHALL serialize by value. Allocation/limit failure SHALL return a structured code/path/span error and SHALL expose no partial destination or output.

#### Scenario: Limit boundary (SER-05)
- **GIVEN** inputs at each configured limit and one unit above it
- **WHEN** encoding/decoding executes
- **THEN** limit inputs succeed if otherwise valid and above-limit inputs return LimitExceeded without partial results

#### Scenario: Cycle and allocation failure (SER-05)
- **GIVEN** a cyclic value, repeated acyclic alias and injected allocation failure
- **WHEN** owned-value mapping runs
- **THEN** cycles reject, aliases copy by value and allocation failure returns AllocationFailed with rooted intermediates cleaned up

### Requirement: Deterministic field precision and Unicode policies
Duplicate record/map keys SHALL reject with both available spans; unknown typed fields SHALL reject unless that type explicitly admits extras; missing required fields SHALL reject, missing optional fields SHALL become None, and type-checked declared defaults SHALL apply only to missing fields. Unknown enum discriminants SHALL reject. Record output SHALL use declaration order; maps SHALL use ordinal UTF-8 key-byte order. Integer parsing SHALL be exact range-checked decimal, never implicit floating conversion. UTF-8 SHALL decode strictly; invalid escapes, surrogate scalars and invalid char values SHALL reject without Unicode normalization. Bytes SHALL use an explicit format encoding. Format-specific float special-value policy SHALL NOT be inferred from generic metadata.

#### Scenario: Missing default duplicate fields (SER-05)
- **GIVEN** a record has required/optional/default fields plus duplicate and unknown cases
- **WHEN** decoding runs
- **THEN** missing required, duplicate and disallowed unknown fields reject; optional/default cases use only their declared missing-field semantics

#### Scenario: Precision Unicode (SER-05)
- **GIVEN** integers beyond 2^53, non-BMP Unicode and invalid UTF-8/surrogate sequences
- **WHEN** decoding runs
- **THEN** integers retain exact values and valid Unicode retains scalar identity while invalid input rejects


### Requirement: Preparation-owned stable package provenance
The compiler SHALL issue immutable package provenance only after successful manifest, dependency materialization and lock validation. The provenance SHALL include the manifest package name, exact declared SemVer, source kind and a SHA-256 digest over sorted relative UTF-8 compiled `.bd` source paths and source bytes, excluding generated `obj` and private `.beskid`, `.git` and `node_modules` directories. Registry provenance SHALL additionally retain the verified registry identity, exact locked version and artifact digest, and SHALL reject a manifest version differing from that lock. Local packages SHALL use their actual declared version and source digest without claiming registry provenance. Provenance SHALL reject symlink and nonregular source entries and SHALL bind original and materialized source roots to identical byte snapshots. Absolute paths, dependency aliases, AST IDs, generation IDs and unrelated lock-entry changes SHALL NOT form the stable package identity.

#### Scenario: Copied source root (SER-06-PACKAGE-01)
- **WHEN** identical package manifests and source bytes are prepared at different absolute roots
- **THEN** their stable package identities are equal
- **AND** changing the exact declared version or source bytes changes that identity.

#### Scenario: Registered snapshot integrity (SER-06-PACKAGE-02)
- **WHEN** materialized source, manifest or lock bytes change after preparation, or an editor override differs from the prepared source
- **THEN** publication of stable serialization identity fails closed
- **AND** package provenance is bound to the registered project session and syntax generation rather than a caller-supplied signature.

#### Scenario: Synthetic assembly (SER-06-PACKAGE-03)
- **WHEN** an assembly is constructed without preparation-issued provenance
- **THEN** structural record and enum inspection may remain available
- **AND** it is explicitly ineligible for stable serialization package identity and receives no fabricated version or digest.

### Requirement: Package-relative nominal declaration identity
Stable serialization nominal identity SHALL combine preparation-issued package provenance, the verified package-relative compiled source path, lexical inline-module and enclosing declaration names, and canonical applied type arguments. The Mod authority SHALL project those components from the registered source declaration. The assembly-qualified resolution name SHALL remain distinct metadata and SHALL NOT substitute for portable nominal identity. Absent package provenance SHALL produce no package-relative identity.

#### Scenario: Dependency aliases do not alter nominal identity (SER-06-PACKAGE-04)
- **WHEN** the same verified package declaration is reached through a different dependency alias or copied checkout root
- **THEN** its package-relative source and lexical declaration components remain equal
- **AND** lexical declarations or applied arguments that differ remain distinct.

### Requirement: Exact native floating point bit projections
Core.Numeric.FloatBits SHALL provide ToBits32(f32)->u32, FromBits32(u32)->f32, ToBits64(f64)->u64 and FromBits64(u64)->f64 as source-authorized canonical native services. Their implementations SHALL preserve every bit, including signed zero, subnormal values, infinities and NaN payloads, using equal-width bit reinterpretation rather than arithmetic conversion. Ordinary source SHALL NOT acquire the hidden runtime intrinsic capability by copying a function name or declaring an extern. Serialization wire codecs SHALL independently enforce their finite decimal wire policy.

#### Scenario: Native exact round trip (FLOAT-06-01)
- **GIVEN** either IEEE scalar width and arbitrary input bits including negative zero and NaN payloads
- **WHEN** FromBits is followed by ToBits
- **THEN** the result equals every original bit without widening, rounding or canonicalizing

### Requirement: Checked Unicode scalar projections
Core.Numeric.UnicodeScalar SHALL provide FromCodePoint(u32) returning a typed Result<char, UnicodeScalarError> and ToCodePoint(char) returning the exact u32 scalar. Surrogates and code points above U+10FFFF SHALL return an error. The primitive char(u32) constructor SHALL validate these same scalar bounds before producing a char; invalid input SHALL trap rather than truncate or create an invalid character. The reverse u32(char) projection SHALL retain every scalar bit. Numeric conversions of other source types SHALL NOT implicitly manufacture characters.

#### Scenario: Scalar boundaries remain exact (CHAR-06-01)
- **GIVEN** U+0000, U+D7FF, U+E000, U+1F600 or U+10FFFF
- **WHEN** checked character construction is followed by code point projection
- **THEN** the original scalar is retained

#### Scenario: Invalid character ranges are rejected (CHAR-06-02)
- **GIVEN** a surrogate or code point above U+10FFFF
- **WHEN** checked character construction is requested
- **THEN** FromCodePoint returns its typed error and raw char construction cannot produce a value

### Requirement: Canonical managed identity and checked allocation transactions
Core.Memory.Managed.SameIdentity<T> SHALL compare canonical live allocation identity only for compiler-proven GcManaged source types. Its private operation SHALL require the exact registered Foundation source and each specialized argument's traced ownership witness. Pointer ABI width, spelling, structural equality, copied source and native pointer values SHALL NOT grant this operation. The runtime SHALL normalize managed ABI interior references through the collector's canonical reference resolver and SHALL NOT expose addresses, process ordinals or unrooted identity tokens. Serialization SHALL maintain an active traversal path and reject CycleDetected before descending into an identity already on that path; repeated sibling aliases SHALL remain legal by-value edges.

Core.Collections.Array.TryAppend<T> SHALL consume the same canonical mutable local or aggregate-field owner proof as ordinary Append and SHALL return a scalar checked status. It SHALL use checked snapshot-root admission and rooted allocation/growth, and SHALL branch on failed admission, arithmetic or allocation before element stores, logical-length changes or owner publication. Failure SHALL preserve the original owner and contents, leave construction output ownership absent and release every admitted snapshot/construction root. Success SHALL publish typed element storage and the owner before exactly one construction finish. Ordinary allocation, root admission and Append SHALL preserve their existing exhaustion trap contracts.

A checked serialization allocation boundary SHALL reserve and root its failure result before fallible work and result publication. Failure handling SHALL NOT depend on a new managed allocation succeeding after exhaustion. Checked scalar allocation statuses alone SHALL NOT qualify generic Encode/Decode recoverability: top-level frame admission, temporaries, result wrappers and string/container construction SHALL participate in the checked boundary. Missing reservation or cleanup authority SHALL fail closed rather than store a null managed value or claim AllocationFailed recovery.

#### Scenario: Active identity differs from shared content (SER-IDENTITY-01)
- **GIVEN** a managed recursive value points back to itself and another value repeats one acyclic child in two sibling fields
- **WHEN** typed traversal runs
- **THEN** the recursive edge returns CycleDetected without output publication while both sibling edges serialize by value

#### Scenario: Checked nested owner failure (SER-ALLOC-01)
- **GIVEN** a registered checked append targets a nested managed array field and snapshot or construction-root allocation is forced to fail
- **WHEN** its rooted owner transaction runs
- **THEN** it returns false with unchanged owner and logical contents and no leaked admitted root or partial managed store

#### Scenario: Exhausted failure publication (SER-ALLOC-02)
- **GIVEN** a serialization boundary has admitted its reserved rooted failure result and managed allocation subsequently fails
- **WHEN** Encode or Decode exits through failure
- **THEN** the reserved AllocationFailed result is returned without allocating a replacement error, publishing a partial value or leaking construction ownership

### Requirement: Duplicate locations retain both owned spans
SerializationError SHALL retain primary source byte start/end and explicit optional related byte start/end. Duplicate wire fields or map keys SHALL identify the later occurrence as primary and the first occurrence as related within the same owned syntax document. Distinct descending keys SHALL report ordering failure without inventing a duplicate location. Source-free failures SHALL explicitly omit related location and SHALL NOT retain stale spans from prior operations.

#### Scenario: Duplicate scalar assignment (SER-DIAGNOSTIC-01)
- **GIVEN** a tagged scalar block contains two data assignments
- **WHEN** the strict format reader rejects the duplicate
- **THEN** its primary span covers the second assignment and its related span covers the first assignment

### Requirement: Immutable exact-specialization failure admission
The reserved serialization error SHALL be a zero-payload AllocationFailure variant. Ordinary diagnostic storage SHALL be private and published errors SHALL expose readonly accessors without mutation authority. A caller SHALL NOT be able to alter a reserved error or Result payload retained for future invocations. Admission SHALL retain the exact current canonical Results and Errors declarations, source constructor keys and concrete generic specialization; matching names, tags, pointer widths or layouts SHALL NOT substitute for this proof. The source AllocationFailureResult<T> factory SHALL remain ordinary allocating construction unless consumed by compiler-issued preadmission authority. Admission SHALL complete in the current process and heap domain before checked invocation or callable publication; a reusable process-global managed pointer SHALL NOT substitute for domain ownership.

A checked call SHALL reserve its destination root before evaluating the invocation and SHALL reuse that admitted root on publication. Its exact callgraph and allocation/effect witness SHALL cover frame/root admission, allocating argument evaluation, constructor calls, private status propagation and nonallocating cleanup. Missing executable effect authority for extern, native Mod or yielding calls SHALL reject recoverability. Merely entering a scope, retaining a receiver or declaring a Result return type SHALL NOT grant the witness.

#### Scenario: Private error and foreign constructor (SER-ALLOC-03)
- **GIVEN** a caller observes a reserved AllocationFailure and a user declares same-name Result and SerializationError enums
- **WHEN** immutable accessors and reserved-constructor admission are checked
- **THEN** no mutation of the reserved payload is permitted and the copied declarations receive no admission authority

#### Scenario: Caller root admission fails (SER-ALLOC-04)
- **GIVEN** a checked invocation's destination root registration cannot succeed before entry
- **WHEN** its invocation boundary selects failure
- **THEN** the preadmitted exact failure result is published without executing the body, registering a new root afterward or storing a null managed value

### Requirement: Checked invocation state remains private and domain owned
The canonical provider SHALL retain public ThreadState size 64, Heap size 328 and CallbackRegistryV3 size 1072. Private BeskidTlsState SHALL have size 56 and a checked allocation scope link at byte offset 48. BeskidCheckedAllocationScope SHALL have size 64 and alignment 8, with native words for magic, previous link, admitted failure handle, first failure reason, heap identity and thread identity at offsets 0, 8, 16, 24, 32 and 40; offsets 48 and 56 SHALL remain reserved and zero. No existing callback root, marking queue or heap field SHALL become scope scratch storage.

Each checked invocation SHALL own its scope storage and require a current process, heap, thread and live admitted failure handle before entry. Scope entry SHALL NOT allocate managed objects. The first allocation or root-admission exhaustion reason SHALL remain sticky for that invocation, including after ordinary allocator scratch diagnostics are cleared; subsequent fallible operations SHALL stop before allocation, stores or publication. Nested invocation links SHALL restore the previous scope before teardown, dereference or result publication. Invalid or foreign scope links SHALL fail closed. Scope state SHALL NOT be exposed as a managed identity token and SHALL NOT confer executable effect authority by itself.

#### Scenario: Nested scopes retain distinct exhaustion state (SER-ALLOC-05)
- **GIVEN** an admitted outer scope enters an admitted inner scope and the inner allocation exhausts its budget
- **WHEN** allocator scratch state is cleared and the inner invocation leaves
- **THEN** the inner first failure remains recorded until its leave, subsequent inner allocation is skipped and the restored outer scope retains its own prior state

#### Scenario: Finite executable closure is distinct from source naming (SER-ALLOC-06)
- **GIVEN** a closed recursive graph of current source-specialized direct calls and another graph containing an unproved native callback, yielding operation or cleanup
- **WHEN** executable no-yield admission is requested
- **THEN** exact declaration and specialization identities close the recursive graph while the unproved graph receives no recoverability authority, irrespective of callable names or Result return spelling

### Requirement: Checked clones and outer publication retain distinct authority
Checked lowering SHALL emit a dedicated source-specialized clone closure whose direct source calls target only members of the same current executable proof. A checked clone SHALL require a live valid domain scope before parameter root admission. Actual root admission, managed record/enum/array construction, UTF8 construction and helper-call exhaustion SHALL branch to a private failure exit before managed dereferences, writes or publication. That exit SHALL release every admitted parameter, local, snapshot and construction root without consuming the successful edge's compile-time ownership state. Private zero-bit child returns SHALL NOT become source-visible null values or stand in for typed failure results.

Checked managed local destinations SHALL be admitted before initializer and call-argument evaluation, and successful binding SHALL reuse that exact root without another registration. Checked append snapshot roots SHALL participate in enclosing failure cleanup while their element expressions execute; local transaction cleanup SHALL remove them before enclosing sticky failure propagation.

Canonical synchronous provider leaves for managed identity, exact FloatBits operations, array length and UTF8 length/slicing/byte conversion MAY participate only through their exact current source-capability-issued service witness. Native scratch allocation in those UTF8 operations SHALL retain exhaustion in the current checked scope while preserving ordinary null behavior outside it. Native scratch failure handling SHALL NOT relabel collector root-stack exhaustion or grant ownership to a same-name provider.

An outer checked invocation SHALL consume an already rooted exact immutable failure result and an already registered current-heap caller destination. Before entry it SHALL verify the canonical specialized Result and AllocationFailure descriptors and variants. It SHALL restore the previous scope before caller-visible publication and SHALL store the selected complete success or reserved failure into the admitted caller root without allocating a new result, root or error. A missing destination lease SHALL reject entry before computation. The private root-slot registration probe SHALL compare only current-heap stored root addresses, perform no allocation or caller-address dereference and SHALL NOT expose a source-level pointer ownership service. Private checked clone emission alone SHALL NOT qualify an outer public callable, Mod transport or encoder cleanup/publication contract.

#### Scenario: Checked element expression exhausts (SER-ALLOC-07)
- **GIVEN** checked append has admitted owner snapshots and allocation during its element expression exhausts
- **WHEN** the enclosing checked clone exits
- **THEN** all admitted snapshots are released, owner contents remain unchanged and no false/null child result reaches a managed store

#### Scenario: Exact outer destination is required (SER-ALLOC-08)
- **GIVEN** an exact reserved failure handle and either a registered caller destination or an unregistered/foreign address
- **WHEN** private checked invocation entry is attempted
- **THEN** only the registered destination receives a complete typed result and the other entry is rejected before body evaluation or address dereference

### Requirement: Concrete nonallocating publication and rollback authority

The compiler SHALL issue publication and rollback eligibility only from the exact current specialized executable body and its closed reachable source callgraph. An Encoder contract declaration, nominal name, implementation marker, or no-yield eligibility alone SHALL NOT issue this stronger eligibility. The proof SHALL reject reachable managed construction, string literal materialization, string concatenation, collection growth, unproved intrinsics, callbacks, and providers without independently verified nonallocating semantics. The dedicated executable closure SHALL use the exact specialized callees and SHALL NOT register or unregister runtime roots during execution; the admitted caller SHALL retain the receiver, arguments, unpublished transaction, and result roots for the entire closure. Rollback SHALL remain executable after sticky allocation failure and SHALL NOT poll that failure as an early return before performing rollback.

#### Scenario: SER-ALLOC-09 concrete allocating commit is rejected
- **WHEN** an Encoder Commit body constructs a fresh Result or concatenates a string, despite satisfying the no-yield closure requirement
- **THEN** the compiler rejects nonallocating publication eligibility for that specialization
- **AND** an existing rooted result returned by a verified allocation-free body can be published without a new wrapper allocation

#### Scenario: SER-ALLOC-10 rooted caller destination and teardown ordering
- **WHEN** a privately issued native checked domain admits its immutable failure specialization
- **THEN** the loader retains its canonical root handle before publishing the callable and retains the provider and descriptor image through root teardown
- **AND** each invocation admits a stable null destination root before argument evaluation, retains the address through invocation and marshaling, and unregisters it before releasing the domain and host
- **AND** destination admission exhaustion prevents argument evaluation and checked execution without releasing the domain's existing reserved failure root

#### Scenario: SER-ALLOC-11 sticky failure invokes concrete rollback
- **WHEN** checked canonical Encode fails during fallible work before its source match arms can execute
- **THEN** its outer publication boundary invokes the exact current applied Encoder Abort implementation through the independently proven nonallocating executable closure
- **AND** rollback is safe for an unopened transaction, does not allocate replacement buffers, and completes before the prior checked scope link is restored and the reserved failure Result is published
- **AND** Commit only transfers already prepared publication state and returns an existing typed status wrapper; formatting, validation, and new wrapper allocation occur before publication

### Requirement: Invocation-retained exact catchall field eligibility

Unknown typed fields SHALL be admitted only through a privately issued catchall proof for an explicitly selected current record field and its exact applied canonical Foundation `Map<string,V>` type. The issuer SHALL verify the record's prepare-owned package identity, field declaration/source/span/generation, the Foundation Map's exact embedded source and trusted Corelib package origin, and the bounded instantiated V shape closure. A boolean metadata flag, field spelling, ShapeId, copied Map implementation, or public semantic DTO SHALL NOT grant eligibility. Pointer, function, never, and canonical opaque runtime resource identities without explicit serialization eligibility SHALL reject; ordinary numeric word and zero-field user records SHALL NOT be classified as resources solely from their representation.

The concrete semantic provider SHALL retain the non-deserializable proof for the trusted active invocation and issue an opaque globally unique correspondence token. Object-safe capture/lookup/validation MAY expose readonly owner, field, applied map, and value facts, but SHALL validate them against that retained proof and current registered package/source generation. Closing or consuming the invocation SHALL delete its retained proofs. A foreign authority SHALL explicitly refuse unsupported issuance. Native transport SHALL use the host's current invocation identity rather than a source-selected nonce.

#### Scenario: SER-EXTRAS-01 exact source application authorizes catchall
- **WHEN** the Mod explicitly selects a current field whose resolved type is the actual prepared Foundation Map with string key and serializable V
- **THEN** the issuer retains the exact declaration/application proof until contribution emission and the codec preserves unknown fields through that field using the same V metadata and duplicate/order policies
- **AND** a same-name user Map or copied Foundation source with Path provenance is rejected

#### Scenario: SER-EXTRAS-02 closed or altered claim cannot authorize emission
- **WHEN** a callback supplies a token from another invocation, changes its owner/field/map/value facts, or reuses a token after invocation consumption
- **THEN** current proof validation rejects the claim before codec contribution emission
- **AND** shape descriptions remain inspectable without granting catchall eligibility when prepare-owned record provenance is absent

An owned compiled catchall contribution SHALL carry a non-serialized concrete private issuer binding captured before invocation consumption. Artifact emission SHALL revalidate its exact declarations, applied generic identities and immutable registered package/source-generation closure; informational descriptions or arbitrary carrier payloads SHALL NOT grant eligibility.

#### Scenario: SER-EXTRAS-03 owned compiled contribution survives scope closure safely
- **WHEN** a current invocation compiles an exact validated catchall claim into a typed contribution
- **THEN** the host attaches an owned non-serialized compiler metadata carrier containing the private issuer binding to that contribution before consuming the invocation
- **AND** the binding captures the exact target and field declarations, applied Map and value identities, and immutable prepare-owned package/source-generation closure rather than retaining a live callback token
- **AND** artifact emission recognizes only the concrete private issuer payload and revalidates its current registered source trees, generic application and package closure; arbitrary carrier payloads and modified informational descriptions cannot issue eligibility

### Requirement: Shared source-issued stable shape graph encoding

Serialization and managed Dynamic portable shape identity SHALL use one compiler-issued canonical graph signature. Version 1 SHALL encode each token as its UTF-8 byte length in minimal unsigned decimal ASCII, followed by `:`, followed by the token bytes. The signature SHALL begin with tokens `beskid.shape/1`, the explicit schema version, root index `0`, and node count. Graph indices SHALL be assigned by deterministic depth-first first encounter of the actual instantiated source identity, visiting generic arguments before ordered fields and enum variants/payloads. Repeated and recursive identities SHALL reference their existing node index; they SHALL NOT recursively hash an unfinished child or omit its body.

A scalar node SHALL encode `scalar`, its canonical primitive name and managed flag (`0` or `1`). An array node SHALL encode `array` and its element index. Record and enum nodes SHALL encode their kind, verified package source kind/name/exact version/source digest, registry identity and artifact digest (empty tokens for non-registry origins), package-relative source path, lexical declaration component count/components, generic argument count/indices, and their ordered structural body. A record body SHALL encode field count and each field's source name, type node index and managed flag. An enum body SHALL encode variant count and each variant's source name, minimal decimal ordinal, payload field count and the same ordered field encoding. The signature SHALL NOT include a lookup alias, absolute file path, source span, AST node ID, syntax generation, callback token or Pack factory declaration. SHA-256 SHALL hash these exact UTF-8 signature bytes.

The issuer SHALL obtain all nodes, declarations and applied arguments from current registered semantic projection and prepare-owned immutable package provenance, and SHALL reject absent/stale/foreign provenance, malformed graph references and checked graph/signature work limits. A caller-supplied graph, canonical-looking signature or ShapeId SHALL NOT authorize a typed adapter, Dynamic packing or catchall binding.

#### Scenario: SER-ID-01 recursive identity is finite and alias independent
- **GIVEN** a current prepared generic enum recursively references its applied identity and has ordered record payloads
- **WHEN** the same locked source is imported under different dependency aliases or copied to another verified project location
- **THEN** both issuers produce identical version-1 signature bytes and digest, with finite graph backreferences and the complete ordered payload bodies
- **AND** changing a payload type, variant ordinal, locked package version, source digest or applied argument changes the signature

#### Scenario: SER-ID-02 portable description cannot issue authority
- **WHEN** a caller submits a matching digest/signature or an AST-like graph without the current registered source and prepare-owned package closure
- **THEN** typed shape issuance rejects rather than treating the description as compiler authority
- **AND** scalar and array nodes retain their precise semantic kind rather than inheriting eligibility from pointer width or a nominal name

### Requirement: Exact typed contribution target correspondence

A native serialization generator SHALL bind each claimed typed contribution index to a current invocation-issued semantic target handle. The host SHALL decode and bound that contribution into the real typed AST before private issuance, reject duplicate/out-of-range bindings and foreign/stale targets, and retain the exact owned typed contribution with the target's original instantiated body and prepare-owned package closure. Raw JSON, source IDs, hashes and annotation spellings SHALL NOT reconstruct the proof.

This pre-expansion capture SHALL NOT grant conformance or codegen eligibility. After the compiler-owned merge and current typed assembly registration, the issuer SHALL verify the preserved target source/body/application and exact generated contribution correspondence, then reissue current canonical applied Serializable/Encoder/Decoder signatures and method implementation keys before artifact emission. A contribution's receiver or typed Decoder result SHALL resolve to the claimed target; an unrelated generated method or equal-spelling declaration SHALL reject. Metadata carried into a new generation SHALL remain ineligible until this private correspondence succeeds.

#### Scenario: SER-MOD-03 checked target survives a legitimate typed merge
- **WHEN** a generator contributes a decoded typed impl for its current target and the compiler appends that exact contribution without changing the original target's ordered body
- **THEN** the post-merge issuer rebinds through the same verified package/declaration identity and validates the concrete applied canonical contracts/methods in the current generation
- **AND** native serialization emission consumes only that reissued private proof

#### Scenario: SER-MOD-04 foreign or modified contribution is rejected
- **WHEN** a binding points outside the decoded contribution list, repeats an index, selects a foreign target or the merged contribution/target differs from its captured typed AST
- **THEN** correspondence rejects before descriptor, codec or managed mapping publication
- **AND** preserving the old opaque metadata carrier alone cannot authorize a new generation

### Requirement: Shared host format-neutral value model
The Rust host and generated binary peers SHALL use the shared `beskid_serialization` owned value model and bounded adapter contracts. Signed and unsigned values SHALL retain their declared 8, 16, 32 or 64 bit width. Float values SHALL retain exact 32 or 64 bit IEEE bits, including NaN payloads, infinities and signed zero, without JSON or BSOL numeric coercion. Owned records, maps, sequences, variants and optionals SHALL preserve their distinct kinds and ordered children. Validation SHALL reject invalid widths/ranges, duplicate record or map names and invalid optional payload cardinality before output publication. Wire-carried shape digests SHALL remain descriptive and SHALL NOT issue compiled shape or catchall authority.

#### Scenario: Binary peer retains nonfinite payload bits
- **GIVEN** a typed float value contains a NaN payload or negative zero
- **WHEN** a binary peer passes it through the shared host value model
- **THEN** the complete declared-width IEEE bit pattern remains unchanged
- **AND** no numeric text conversion is required

#### Scenario: Host adapter validates one aggregate budget
- **GIVEN** nested UTF8 names, strings, bytes and containers share explicit limits
- **WHEN** the value exceeds total bytes, scalar bytes, nodes or depth
- **THEN** validation rejects it using one aggregate checked budget before output publication
- **AND** pending traversal bookkeeping is bounded by the remaining node budget

#### Scenario: Descriptive digest cannot authorize extras
- **GIVEN** a host value contains a valid shape digest and additional map fields
- **WHEN** no current private compiled catchall binding exists
- **THEN** the digest cannot grant extras or reconstruct a metadata witness

### Requirement: Canonical typed serialization contribution correspondence
A retained generated contribution SHALL be admitted only after the exact owned typed implementation has been appended once to the preserved source entry and the target declaration, applied arguments and prepared package closure have been revalidated in the current generation. An Encoder contribution SHALL implement the exact canonical `Serializable<E>` on that target application and E SHALL implement the exact canonical Encoder methods. A Decoder contribution MAY use a distinct generated receiver but SHALL implement the exact canonical `Decoder<T>` where T equals the issued target declaration and applied arguments. Receiver substitutions SHALL be derived from the retained target generic environment and actual contribution AST, never ABI widths or caller-selected nominal strings. Encoder and Decoder contributions SHALL have distinct closed kinds and each target/kind SHALL be unique.

#### Scenario: Generated decoder receiver differs from output
- **GIVEN** a prepared Counter target and an owned Reader implementation of canonical Decoder<Counter>
- **WHEN** the exact typed contribution is merged and its current methods are checked
- **THEN** the distinct Reader receiver is accepted with Counter as its exact typed output

#### Scenario: Generated decoder claims a foreign output
- **GIVEN** an issued Counter target paired with a contribution implementing Decoder<Reader>
- **WHEN** current contribution correspondence is checked
- **THEN** the foreign output cannot authorize Counter serialization metadata

### Requirement: Sealed compiled shape and extras metadata
`CompiledShape<T>` SHALL return a managed descriptor only through the exact canonical source bridge, an admitted retained typed contribution and current immutable metadata policy. Descriptive booleans SHALL NOT grant extras. Extras metadata SHALL use a canonical sealed managed ExtrasBinding issued from the retained exact field and canonical Map<string,V> application; ordinary empty construction, public token setters and deserialized witness reconstruction SHALL reject. Copied catchall metadata SHALL be rebased only alongside the independently admitted target, unchanged prepared source and exact original field correspondence, and SHALL reissue canonical map/value eligibility. Duplicate and orphaned catchall claims SHALL reject. The constructor and getter SHALL use the sole source-issued descriptor/array layout authority and SHALL NOT publish object-file static pointers as managed objects.

#### Scenario: Copied catchall owner changed
- **GIVEN** retained catchall metadata whose original target field or prepared source changed
- **WHEN** a later generated target attempts to reuse it
- **THEN** fresh correspondence and eligibility fail before descriptor publication

#### Scenario: Ordinary source constructs a sealed extras binding
- **GIVEN** ordinary source spells the canonical ExtrasBinding type or copies its empty declaration
- **WHEN** it attempts to construct metadata granting extras
- **THEN** no ordinary aggregate constructor or copied declaration grants the compiler-issued binding

### Requirement: Canonical logical container identities
The shared shape graph SHALL distinguish Foundation List<T>, Map<K,V> and Option<T> only through their exact current compiler-issued canonical source declarations and argument arity. It SHALL retain their complete source declaration, applied arguments and ordered physical field or variant bodies for independent layout verification. The version-1 canonical signature SHALL use `record.list`, `record.map` and `enum.optional` tags for these declarations, while ordinary records and enums retain `record` and `enum`. A copied declaration, equal name or matching field layout SHALL NOT issue a canonical container marker. Runtime serialization SHALL use these logical kinds and exact child shape identities rather than serialize backing storage/count implementation fields as user data.

#### Scenario: User-defined List lookalike remains a record
- **GIVEN** ordinary source declares a List-shaped record with storage and count fields
- **WHEN** the shared shape graph is projected
- **THEN** it retains ordinary record identity and receives no canonical List marker

#### Scenario: Container projection does not manufacture layout
- **GIVEN** a canonical applied Map<string,V> logical graph
- **WHEN** its serialization and Dynamic metadata are compiled
- **THEN** both consume the same canonical graph signature
- **AND** physical construction and tracing continue to use the sole current source-issued aggregate plans

### Requirement: Complete compiled descriptor graph and sealed backing construction
The canonical compiled metadata getters SHALL construct fresh managed descriptors through registered source factories and SHALL expose the complete issued descriptor closure for atomic registry admission. The compiler SHALL retain exact target/field/map/value correspondence before emitting a sealed ExtrasBinding constructor call. Only the unchanged canonical private constructor AST SHALL allocate its private backing record; ordinary source literals, identical copied source, deserialized signatures and public ShapeId values SHALL NOT grant construction. Its immutable backing SHALL identify the target, selected source member, canonical map and value shapes and complete issued binding signature. Equality of independently constructed bindings SHALL compare these complete facts rather than managed address identity. Emitted graph and literal values SHALL remain rooted across every subsequent allocation and be resolved before source constructor calls.

#### Scenario: Repeated compiled getter has the same binding
- **WHEN** two getters independently construct descriptors for the same current compiled target and catchall
- **THEN** complete immutable backing facts compare equal and duplicate registration does not conflict solely because their managed addresses differ

#### Scenario: Unknown field uses a binding from another target
- **GIVEN** a descriptor retaining a sealed binding issued for a different target or map/value application
- **WHEN** the codec validates its descriptor graph
- **THEN** validation rejects the mismatched binding before unknown-field decoding or output publication

#### Scenario: Descriptor closure admission fails
- **WHEN** any nested descriptor, reference, signature or sealed binding fails validation during closure admission
- **THEN** the existing registry remains unchanged and the new closure is not partially published


### Requirement: Source-resolved typed defaults and skipped input fields
A generated default SHALL resolve a declared zero-argument source factory in the current registered source and package closure. Its specialized return type SHALL equal the current field type, including canonical nominal identity and every generic substitution. The retained contribution SHALL preserve the exact factory declaration and current specialization correspondence; a name, annotation string, copied signature or caller-supplied ShapeId SHALL NOT grant invocation. A default SHALL run only when its input field is absent. A present invalid value SHALL report its typed input error rather than invoke the default. A field skipped during decoding SHALL have an admitted typed default or another explicitly specified typed construction rule; otherwise generation SHALL reject. Generation SHALL NOT fabricate zero, empty, null or universal boxed values for omitted fields.

#### Scenario: Generic factory has the wrong return application
- **GIVEN** a field of Box<i32> and a zero-argument factory returning Box<u32>
- **WHEN** its default metadata is compiled
- **THEN** exact specialized return correspondence rejects the default before contribution admission

#### Scenario: Present malformed value does not use a default
- **GIVEN** a required numeric field with an admitted default factory
- **WHEN** the input supplies an invalid numeric value
- **THEN** decoding reports the value location and typed failure without calling the factory

#### Scenario: Skipped field lacks construction authority
- **WHEN** decoding generation skips a field without an admitted default or specified typed construction rule
- **THEN** generation rejects rather than manufacturing its value

### Requirement: Bounds follow generated field operations
Generated serialization and deserialization bounds SHALL derive independently from the actual retained field operations and defaults in each direction. An unused or phantom generic parameter SHALL NOT receive a blanket Serializable or decoding bound solely because it is declared on the receiver. An explicit bound override SHALL resolve canonical source contracts and SHALL satisfy the exact generated operations under the current implementation specialization. A generic template SHALL retain these obligations without granting a concrete application; each concrete specialization SHALL revalidate its receiver arguments, field types, default factories and directional contract applications before emission.

#### Scenario: Phantom parameter does not need serialization
- **GIVEN** a generic record whose parameter is absent from every serialized field operation
- **WHEN** its serialization implementation is generated
- **THEN** that parameter receives no unsupported blanket serialization bound

#### Scenario: Field use requires a concrete bound
- **GIVEN** a generated field operation using T with encoder E
- **WHEN** its generic implementation is specialized
- **THEN** the exact current T and E application must satisfy that operation's canonical contract

### Requirement: Typed field decoder factory correspondence
Generated decoding SHALL use a typed `FieldDecoder<T,R>` binding for abstract field types, where T is the exact current field application and R is the admitted format Reader. A generated adapter SHALL retain direction-specific applied bounds and receive concrete binding instances through exact current compiler-issued factory correspondence. The issuer SHALL validate the actual source factory, specialized output, receiver arguments, package provenance and implementation contribution before publication. A template, field name, factory string, pointer ABI or universal DataValue SHALL NOT substitute for this correspondence. Binding constructors SHALL preserve the typed reader and decoder ownership; fresh target publication SHALL occur only after all fields and Reader.Finish succeed. Encoding SHALL continue to require the original T:Serializable<E> receiver.

#### Scenario: Abstract field has a concrete typed decoder
- **GIVEN** a generated generic record adapter whose field is T
- **WHEN** its current specialization supplies a factory for FieldDecoder<T,R>
- **THEN** the retained source and applied contracts are checked and its Read call constructs T directly

#### Scenario: Factory returns another field application
- **WHEN** a factory for FieldDecoder<Box<u32>,R> is claimed for a Box<i32> field
- **THEN** exact output correspondence rejects before target construction

#### Scenario: Reader finalization rejects trailing input
- **WHEN** a typed binding constructs a target but Reader.Finish reports trailing or incomplete input
- **THEN** the adapter returns the typed failure and does not publish the target

### Requirement: Source-typed serialization field policy
The Serialization Mod SHALL structurally declare Serialize with a string Version parameter defaulting to `1` and SerializeField with named Name, SkipSerialize, SkipDeserialize, Default, WordWidth and Bytes parameters. Field policy SHALL use the original source name when Name is absent, retain separate encoding and decoding skip decisions, reject conflicting effective wire names in each direction and preserve declared word width. Bytes SHALL require exactly u8[] and SHALL select byte operations rather than sequence operations. A present Default SHALL name a qualified source factory; the private contribution issuer SHALL independently validate its exact zero-argument callable, current return type and generic substitutions before publication. A skipped decoding field SHALL require that valid typed default. Unknown, repeated, interpolated, malformed or incorrectly typed policy arguments SHALL reject; parsing descriptive policy syntax SHALL NOT grant semantic authority. Defaults SHALL apply only to absent fields, never to a malformed present field. Generated generic bounds SHALL exclude fields skipped in that direction and phantom parameters that no actual operation requires.

#### Scenario: Directional skip retains opposite operation
- **WHEN** a field has SkipSerialize true and SkipDeserialize false
- **THEN** encoding omits it from the declared field count and operations
- **AND** decoding still reads and validates its declared type

#### Scenario: Typed byte policy rejects a wider array
- **WHEN** Bytes true is applied to u16[]
- **THEN** generation rejects before publishing an adapter

#### Scenario: Renamed fields conflict in one direction
- **WHEN** two active fields claim the same effective wire name for encoding or decoding
- **THEN** generation rejects with a field-policy diagnostic
