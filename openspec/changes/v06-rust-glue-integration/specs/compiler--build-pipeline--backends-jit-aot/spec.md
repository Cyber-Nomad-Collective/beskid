## ADDED Requirements

### Requirement: Glue deterministic artifact closure
Rust Glue emission SHALL produce a versioned structured artifact containing backend, target/ABI/layout band, sorted binding identities, relative generated files and content digests, portable tool identities, declared link inputs and expected outputs; actual build results SHALL record output digests/status. Equivalent inputs SHALL emit identical files/manifests independent of discovery order, machine-local paths and timestamps. Materialization SHALL reject absolute paths, parent escape, duplicates, symlink escape and digest mismatch before effects, and promote complete output atomically. Ordinary Beskid code SHALL remain canonical CLIF/AOT; Glue SHALL emit adapters and build metadata rather than translate arbitrary Beskid method bodies into Rust. .NET SHALL remain unavailable until its separate profile/acceptance passes.

#### Scenario: Stable and confined artifacts
- **GIVEN** reordered equivalent bindings or escaping generated paths
- **WHEN** emission/materialization runs
- **THEN** equivalent output is byte-identical and escaping/duplicate/digest-invalid files are rejected (R4-GEN-01..03)

#### Scenario: Ordinary build independent
- **GIVEN** a CLIF Beskid project without Glue and no Rust/.NET tools
- **WHEN** it builds
- **THEN** no Glue external tooling is required

### Requirement: Bounded explicit Glue tool validation
Glue external builds SHALL resolve tools only from explicit path XOR prefix, never search-path/nearest-tool fallback. Each required tool SHALL be executable and interrogated with direct argv,10 s deadline and 1 MiB output cap; malformed/old version, unavailable target compilation/ABI proof, mismatched hash pin or absent tool SHALL fail before external build. Observed version, target evidence and executable sha256 SHALL always be recorded, and executable identity SHALL be rechecked immediately before spawn. C integer/float layout evidence and actual requested target compile/link capability SHALL be validated; host version/triple alone SHALL NOT prove target support.

#### Scenario: Tool failures bounded
- **GIVEN** missing/conflicting configuration, nonexecutable/drifted tool or a probe exceeding limits
- **WHEN** tool validation runs
- **THEN** typed failure prevents build without fallback and timed-out child is terminated/reaped (R4-TOOL-01..08)

#### Scenario: Target proof required
- **GIVEN** a host compiler exists but lacks requested target/link capability
- **WHEN** Glue validates the toolchain
- **THEN** it rejects before adapter build

#### Scenario: Tool changes after probe
- **GIVEN** tool bytes change after successful validation
- **WHEN** build is about to spawn
- **THEN** the recheck rejects changed identity before execution

### Requirement: Compiler owned external driver identity
Rust owner builds SHALL use the independently built compiler-owned native tool driver from the actual running executable's installed prefix. The compiler SHALL embed the driver's exact binary identity through the trusted build pipeline, bound to the complete current driver source inventory, Cargo package, target and successful executable artifact. Runtime sidecars, caller-selected wrapper paths and self-reported source digests SHALL NOT mint driver authority. Complete toolchain bundles SHALL include that exact executable. Each Rustc and native linker child invocation SHALL issue a bounded receipt of its actual canonical executable, unchanged SHA256, arguments and successful exit within the retained parent execution enclosure; configured executable hashes alone SHALL NOT count as observed invocations.

#### Scenario: Unqualified or replaced driver rejected
- **GIVEN** an unqualified compiler build, a missing bundled driver or replaced driver bytes
- **WHEN** an owning Rust image is built
- **THEN** the build rejects before invoking user Rust source without selecting an alternate wrapper

#### Scenario: Nested compilation retains cancellation authority
- **GIVEN** the owned driver has launched a native compiler descendant inside the producer enclosure
- **WHEN** the producer is cancelled or its absolute deadline expires
- **THEN** the compiler and its descendants are terminated and reaped through the shared execution service and no successful image admission is issued

### Requirement: Canonical closed Glue declaration facts
Rust Glue emission SHALL consume generation-bound registered Salsa binding/signature facts, preserving logical primitive, array-element, unit-return-only and owner-brand identities separately from physical C transport. String metadata SHALL use the canonical literal decoder and existing import/export authority. Duplicate attributes, duplicate or unknown metadata arguments, decoded NUL, unsupported raw-pointer/callback forms and unresolved nominal types SHALL fail before emission. Type closure SHALL be bounded across the complete signature (maximum depth64, aggregate1024 type nodes,256 parameters/generic binders), not only each recursive branch. Generic references SHALL retain issuing callable declaration and binder position; handle brands SHALL retain canonical qualified type declaration, applied arguments, library and nullability, rather than treating ordinary u64 or a spelling as ownership authority. The explicit `GlueHandle(Library, Nullable)` marker SHALL apply to a uniquely resolved nominal token declaration with exactly one u64 field; actual runtime owner validation SHALL remain mandatory and the marker SHALL never grant a caller-created token validity.

#### Scenario: Metadata cannot change ownership by ambiguity
- **GIVEN** duplicate or unknown Export/Extern/GlueHandle metadata, or decoded NUL
- **WHEN** the canonical binding query is requested
- **THEN** it rejects the declaration before artifacts or effects are produced

#### Scenario: Wide signatures obey the aggregate bound
- **GIVEN** individually shallow parameter types whose combined closure exceeds1024 nodes
- **WHEN** binding normalization runs
- **THEN** it rejects before allocating an unbounded normalized closure

#### Scenario: Generic and branded identity is preserved
- **GIVEN** a registered generic callable and an applied explicitly branded token type
- **WHEN** its binding fact is projected
- **THEN** binder owner/position and canonical qualified nominal/type-argument provenance are retained, and no ordinary u64 identity is accepted as a checked owner token

### Requirement: Canonical managed field classification for emitted descriptors

The compiler SHALL preserve managed-reference classification in generation-bound aggregate and applied generic field shapes independently of physical pointer ABI storage. Descriptor emission SHALL trace managed arrays and nominal references and SHALL exclude native pointer fields. Unknown specialized reference classification SHALL fail closed.

#### Scenario: Mixed native and managed fields
- **GIVEN** a registered aggregate containing a native pointer, managed array, nominal managed reference, and scalar word
- **WHEN** its canonical allocation descriptor is emitted
- **THEN** only the managed array and nominal reference slots appear in the pointer map
- **AND** native pointer storage retains its pointer ABI without being traced

### Requirement: Producer and loader issued Glue initialization

The native Glue producer SHALL emit a versioned initialization entry and SHALL verify its presence in the actual linked image. The loader SHALL pin the independently validated canonical shared provider before the artifact image and SHALL check both payload digests before and after loading. Initialization SHALL consume a borrowed synchronous host admission table issued from the private producer witness, compare the complete bounded compiled source and shape closure, and obtain a nonzero canonical library token. Generated images SHALL NOT authorize registration from their own JSON, rehashed metadata, raw token, or guessed source generation. Checked wrappers SHALL reject calls before successful initialization. Failed initialization SHALL publish no library token and SHALL release provisional roots and handles exactly once.

#### Scenario: Uninitialized image cannot publish managed output
- **GIVEN** a generated native image whose private producer witness has not been admitted by the loader
- **WHEN** a checked managed wrapper is called
- **THEN** it returns a declared failure with a zero output view and publishes no owner record

#### Scenario: Substituted closure fails host admission
- **GIVEN** a private producer witness for one complete source and shape closure
- **WHEN** initialization presents a substituted source digest or shape list, including self-consistent rehashed JSON
- **THEN** the host rejects initialization before calling generated code or publishing a library token

#### Scenario: Failed initialization may be retried without partial state
- **GIVEN** an initialization callback that returns failure after provisional setup
- **WHEN** the loader rolls back setup and subsequently attempts valid initialization
- **THEN** the previous attempt leaves no ready state or usable library token, releases provisional owned buffers, and valid initialization can establish the exact admitted closure; descriptor images already referenced by the process heap remain pinned until canonical heap destruction

### Requirement: Canonical library owner shape domain

The loader SHALL bind each canonical owner library exactly once to the complete admitted set of nonzero shape identities. The hidden bind transport SHALL accept at most 65,536 strictly increasing unsigned 64-bit identities and SHALL reject empty, duplicate, unsorted, stale, foreign, or repeated bindings before mutation. The domain SHALL reside in the source-defined library owner's traced payload and SHALL be published through canonical typed field assignment and its write barrier. Owned output admission SHALL prove domain membership before allocating or publishing a buffer. The process-wide 16 MiB owner budget SHALL include live library shape-domain bytes and outstanding owned buffer allocations, computed from the canonical rooted owner chain with checked addition; released domains and buffers SHALL contribute zero. Repeated bindings and budget exhaustion SHALL be rejected before temporary or managed allocation. This correlation domain SHALL NOT substitute for full compiled signature, source identity, descriptor, callback-address, and pinned-image validation.

#### Scenario: Unbound or unknown shape cannot allocate output
- **GIVEN** an unbound library or an admitted library whose domain does not contain the requested shape
- **WHEN** a managed output is requested
- **THEN** the provider rejects the request before allocation and returns a zero output view

#### Scenario: High unsigned shape identity remains exact
- **GIVEN** a validated library domain containing the maximum unsigned 64-bit identity
- **WHEN** an output request uses that exact identity
- **THEN** membership preserves all bits and succeeds without a signed reinterpretation

#### Scenario: Stale library cannot bind a fresh session
- **GIVEN** a library token issued before process shutdown
- **WHEN** a new process session attempts to bind that old token
- **THEN** the provider rejects it without changing the new session's owner domain

### Requirement: Checked library closure and allocation-free reclamation

The canonical provider SHALL close an admitted library only after validating its process, session, generation, and complete bounded owner chain. Closure SHALL revoke that library and release its owned buffers using the session's preadmitted traced empty payload and canonical typed write barrier, without allocating replacement managed payloads. Released records SHALL retain no managed buffer contents or native allocation size. Library closure SHALL NOT unload descriptor or callback images that may remain referenced by the process heap. Process shutdown SHALL validate the full chain before release and SHALL retain image owners through canonical heap destruction.

#### Scenario: Closed library cannot admit another owned output
- **GIVEN** a library owning live managed output buffers
- **WHEN** the private loader closes its exact library generation
- **THEN** the provider releases those buffers exactly once and rejects subsequent output or release attempts using that closed token

#### Scenario: Allocation failure does not prevent payload reclamation
- **GIVEN** a live admitted library and the session's rooted empty payload
- **WHEN** library closure occurs while no new managed allocation is available
- **THEN** closure uses the already admitted empty payload, clears retained payload contents through the canonical barrier, and requires no allocation

### Requirement: Consumer-branded opaque release follows privately admitted owner domains

The canonical shared provider SHALL expose a hidden checked consumer release transport `beskid_glue_v1_owner_release_consumer_opaque(u64 consumerLibrary, pointer completeBrand32, u64 token) -> i32`. It SHALL resolve the complete brand only through that consumer's live, once-bound loader-issued owner-domain closure and SHALL verify the actual owning library, generation, process, session, token kind, and complete owning brand before release. The caller SHALL NOT supply an owning library identity or destructor address. The provider SHALL retain no managed record pointer across an unlocked foreign callback; an internally copied scalar owner tuple SHALL be revalidated by the existing owning-library release operation. Revocation racing with release SHALL fail closed. Successful release SHALL tombstone the token before the actual admitted owning-image destructor executes exactly once. Foreign panic or failure SHALL return a checked status and SHALL NOT make the token reusable.

#### Scenario: Consumer releases a foreign-owned token through its exact brand
- **GIVEN** an actual compiled Rust owner image and a consumer image are admitted into one canonical process with an exact full-brand owner-domain binding
- **WHEN** the consumer releases a live token through that binding
- **THEN** the owning library's checked release runs its admitted destructor exactly once and all aliases of the token become stale (R4-OWN-12)

#### Scenario: Wrong brand and revoked owner deny consumer release before effects
- **GIVEN** a token with a different complete brand, a foreign session, or an owner revoked after consumer-domain lookup
- **WHEN** the hidden consumer release transport is invoked
- **THEN** it returns a checked failure without invoking a foreign destructor or accepting caller-supplied ownership metadata (R4-OWN-13)

### Requirement: Opaque Rust payload borrows retain a canonical owner lease
Generated Rust owner invocation SHALL obtain a nonzero process-issued borrow lease bound to the exact owning library, generation, full compiled brand, and live token before exposing a typed Rust reference. The provider SHALL publish that lease as an ordinary canonical traced OwnerRecord before returning the foreign payload address. Active leases SHALL make token release and library close return Busy without invoking the destructor. Borrow end SHALL validate the same full domain and consume the lease allocation-free using the preadmitted empty payload and canonical publication barrier. Generated invocation SHALL end the lease after success, typed error, or caught panic, and SHALL retain the provider and owning image through cleanup. Unpinned opaque resolve SHALL NOT remain an admitted invocation transport.

#### Scenario: R4-OWN-14 Reentrant release cannot invalidate an active borrow
- **GIVEN** an actual privately admitted Rust owner factory and typed invocation with a live borrow lease
- **WHEN** the invocation attempts token release or owning-library close
- **THEN** the provider returns Busy, no destructor runs, and the reference remains valid until borrow end

#### Scenario: R4-OWN-15 Borrow end rejects stale and foreign domains
- **GIVEN** an ended lease, a different library, or a different full brand
- **WHEN** borrow end is attempted
- **THEN** it fails closed without releasing another borrow or invoking a destructor

#### Scenario: R4-OWN-16 Borrow admission failure exposes no pointer
- **GIVEN** forced canonical record/root admission failure or an exhausted process identity
- **WHEN** borrow begin is attempted
- **THEN** both output pointer and lease are zero, no Rust reference is constructed, and token ownership remains unchanged

#### Scenario: R4-OWN-17 Panic completes the borrow before image teardown
- **GIVEN** an admitted typed Rust invocation that panics while holding a borrow
- **WHEN** its generated wrapper catches the panic
- **THEN** the wrapper ends the lease before returning a failure, keeps the provider/image pinned through end, and subsequent valid release invokes the destructor exactly once

### Requirement: Native Rust imports use a privately issued checked dispatch closure
Native Rust import adapters SHALL call only the exact checked status/out-parameter entry whose full binding identity and physical signature were issued by the current compiler and actual Rust-owner producer. The retained private loader SHALL validate the actual pinned image symbol owner, owning library, generation, and binding shape before issuing a once-bound import table. A public artifact packet, a source label, a rehashed file inventory, or an original raw scalar symbol SHALL NOT substitute for that closure. The adapter SHALL propagate nonzero status without publishing a result and SHALL release managed return transfers through the actual admitted owning library. The loader SHALL deny callable publication until every required import and opaque-owner domain has been admitted. Hidden function addresses SHALL remain native loader transport and SHALL NOT enter portable values or stdio frames.

#### Scenario: R4-ABI-18 Checked scalar failure cannot become success
- **GIVEN** a current source-issued scalar import and actual Rust checked entry
- **WHEN** the foreign entry reports a typed error or caught panic
- **THEN** the adapter preserves failure and publishes no scalar result

#### Scenario: R4-ART-12 Missing or foreign import image denies publication
- **GIVEN** an import whose full binding identity has no unique privately produced owning image
- **WHEN** the loader prepares the consumer callable
- **THEN** it denies publication before any source or foreign callable effect

#### Scenario: R4-OWN-18 Managed imports release through their actual owner
- **GIVEN** a managed output transferred from an admitted Rust-owner image
- **WHEN** the adapter copies or rejects the output
- **THEN** it attempts exactly one checked release through that actual owning library and never substitutes a consumer-library token domain

### Requirement: Rust owner builds exclude ambient Cargo configuration
The Rust owner producer SHALL invoke Cargo only with its generated manifest and lock, `--offline --locked`, an explicit `--target` and `--target-dir`, and the Beskid-set `RUSTC`, wrapper and encoded flag values. Before spawning Cargo, it SHALL remove every inherited `CARGO_*`, `RUSTFLAGS`, `RUSTDOCFLAGS`, `RUSTC*` and `RUSTUP_TOOLCHAIN` variable from the child environment. It SHALL then set `CARGO_HOME` to an empty directory inside its staging area. The producer SHALL reject the build when any ancestor of the staging directory contains `.cargo/config`, `.cargo/config.toml`, `rust-toolchain` or `rust-toolchain.toml`. Cargo merges ancestor configuration, and such files cannot be removed through `--config`. The probe and the build SHALL use the same working directory and environment.

#### Scenario: Inherited Cargo settings have no effect
- **GIVEN** inherited `RUSTC`, `RUSTFLAGS`, `CARGO_BUILD_RUSTFLAGS` and `CARGO_TARGET_DIR` values
- **WHEN** a Rust owner image is built
- **THEN** the receipts show only the explicitly selected rustc and linker, and the recorded Cargo arguments, encoded flags, target directory and tool identities equal those of a build without those variables

#### Scenario: Ancestor configuration fails closed
- **GIVEN** a `.cargo/config.toml` or `rust-toolchain.toml` in an ancestor of the staging directory
- **WHEN** a Rust owner image is built
- **THEN** the producer rejects the build and names the file before Cargo runs
