## ADDED Requirements

### Requirement: Rust Glue required primitive and ownership profile
The required Rust Glue profile SHALL support both directions for i8/i16/i32/i64/u8/u16/u32/u64 mapped to exact intN_t/uintN_t, f32/f64 to C float/double, Bool to u8 restricted to 0/1, char to u32 restricted to Unicode scalars, unit to void return only, UTF-8 and bytes to borrowed pointer plus target-usize length inputs and managed returns to signed-i32 status with a checked GlueOwnedView out parameter (pointer, target-usize length, u64 canonical owner token), checked opaque handles to u64 slot/generation tokens, and word to selected-target uintptr_t. It SHALL preserve IEEE bits including NaN, infinities and signed zero on its wire adapter. Null view pointer SHALL be accepted only for zero length; embedded NUL SHALL be ordinary bounded UTF-8 data, invalid UTF-8 and overflowing lengths SHALL reject before memory access. Borrowed views SHALL remain rooted/owned during call, copied to bounded wire values and not escape owners. Transfer buffers SHALL carry an explicit owner/release operation with exactly-once release on success, decode error, cancellation and close; allocator substitution SHALL be rejected. Handles SHALL validate library, session, type/shape, generation and declared nullability, and never encode addresses. Native-width values SHALL record selected-target width and reject wrong-target/range conversion. Raw pointer/never signatures, callbacks, variadics, arbitrary GC records and foreign-thread entry SHALL fail before generation in this profile.

#### Scenario: Complete primitive matrix
- **GIVEN** manual and generated fixtures for every required row and both directions
- **WHEN** they execute natively on Linux x86_64/macOS aarch64/Windows x86_64
- **THEN** integer extrema/zero, float bit patterns, bool 0/1, Unicode limits, views, unit, checked handles and word match (R4-ABI-01..12)

#### Scenario: Invalid view and scalar rejected
- **GIVEN** bool 2/255, surrogate/out-of-range char, invalid UTF-8, null nonempty or overflow view
- **WHEN** an adapter validates the value
- **THEN** it rejects before dereference/allocation/foreign call

#### Scenario: Transfer and stale handles
- **GIVEN** a transferred buffer and a closed or reused handle slot
- **WHEN** completion/error/cancel/close and later handle call occur
- **THEN** buffer release runs exactly once and stale handle fails without dispatch

#### Scenario: Unsupported signature
- **GIVEN** a raw pointer, callback or variadic Glue signature
- **WHEN** binding validation runs
- **THEN** it emits terminal unsupported-form diagnostic before materialization
### Requirement: Checked invocation transport preserves failure separately from values
The generated Rust client SHALL additionally expose a source-qualified checked invocation entry for each export, using an i32 status and explicit out parameter for non-unit results. Its symbol SHALL include the full canonical binding identity digest. Direct scalar C entries SHALL remain the physical unsafe ABI basis; managed-input scalar-result entries SHALL use only the checked transport. Checked entries SHALL zero result outputs before validation, check live owning-library and compiled-shape membership before effects, reject invalid bool and Unicode scalar representations, retain managed input roots through invocation, and resolve moved inputs from those roots after all input allocations. Failures SHALL leave outputs zero and release all acquired input roots. Unit checked invocation SHALL return status without a value output. This transport SHALL NOT claim to catch panic or allocation failure until the separately required checked-effect or process boundary has been admitted.

#### Scenario: Invalid checked argument rejects before body effects
- **GIVEN** an admitted binding with bool, Unicode scalar or managed-view parameters
- **WHEN** a checked entry receives an invalid representation or a revoked owner domain
- **THEN** the body has no effects, status reports failure, outputs remain zero and retained roots are released

#### Scenario: Managed argument survives later argument allocation
- **GIVEN** a binding with two managed borrowed input views
- **WHEN** allocation of the second input moves the first managed object
- **THEN** the body receives both values resolved from current canonical root handles and each root is released after invocation

### Requirement: Canonical native kit resolves only proved internal provider symbols
Canonical native kit emission SHALL resolve a C ABI import declaring the reserved runtime library from its own native object closure only when the current compiler-owned corpus is proved, the exact symbol is an ABI manifest export, and the compiled additional objects actually define that symbol. Required-export labels alone SHALL NOT establish ownership. Ordinary host library emission SHALL retain external-library admission and SHALL NOT acquire this canonical exception. The final native image SHALL satisfy the existing export and provenance audits.

#### Scenario: Owned Dynamic bridge in the current kit
- **WHEN** the canonical Dynamic source calls map_owned and the current compiled canonical provider object defines its manifest C export
- **THEN** the kit SHALL link that import to its own provider object without requiring a second runtime library

#### Scenario: Missing or uncontracted producer
- **WHEN** a declared runtime import lacks an actual object definition or lacks its exact manifest export
- **THEN** emission SHALL reject unresolved ownership before linking

#### Scenario: Ordinary library cannot claim canonical ownership
- **WHEN** an ordinary artifact spells the reserved runtime library name
- **THEN** actual same-named object symbols alone SHALL NOT bypass its external-library admission
