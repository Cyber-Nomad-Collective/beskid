# language-meta--interop--beskid-glue Specification

## Purpose
This specification defines Rust Glue: the in-process, checked C ABI path through which Beskid code and Rust code call each other, the Rust owner mappings that Beskid source declares, and the evidence that qualifies a Glue release.
## Requirements
### Requirement: Rust Glue manual and generated equivalence
Rust Glue 0.6 SHALL deliver, through the in-process checked C ABI owned path, both import and export directions for the entire required primitive/ownership profile. A hand-written Rust/Beskid C ABI fixture and boundary manifest SHALL establish observable results, errors and ownership first; generated adapters SHALL compile, link and execute equivalently, including failure rules. Qualification SHALL execute the same required manifest natively on Linux x86_64, macOS aarch64 and Windows x86_64 against installed candidate bytes. Emitted text, compile-only cross builds or scalar-only subsets SHALL NOT count as delivery. Missing/skipped/timeout/mixed-source evidence SHALL fail required acceptance.

#### Scenario: Manual and generated match
- **GIVEN** complete manual/generated import/export fixture matrix and installed candidate
- **WHEN** native qualification executes
- **THEN** results/errors/releases and all target cells pass with exact source/tool/runtime/package/input/output identities (R4-CALL-01..04)

#### Scenario: Partial implementation rejected
- **GIVEN** only integers emit or one direction/target is unexecuted
- **WHEN** release evidence is validated
- **THEN** required Glue completion is rejected

### Requirement: Delivered Rust Glue is the in-process checked C ABI owned path
Delivered Rust Glue calls SHALL run inside one process through the checked C ABI. `beskid build --backend glue-rust` SHALL produce one Beskid consumer image and one Rust owner image for each referenced manifest `glue` block. Beskid source SHALL declare the boundary only with `[Extern(Abi:"C", Library:..)]` contracts, `[Export(Abi:"C", Symbol:..)]` functions, `[GlueHandle(Library:.., Nullable:..)]` opaque types and `[RustOwner(Path:.., Fallible:..)]` mappings. The compiler SHALL derive the binding facts from generation-bound source facts, emit the checked status/out-parameter wrappers for the consumer and the owner, and build each owner through the hermetic owner Cargo invocation. UTF-8 strings and byte arrays SHALL cross as owned views. Opaque values SHALL cross only as branded checked tokens.

Each image SHALL contain an admission record. The host SHALL admit the consumer by the digest that the build prints. The consumer record SHALL pin the digest of every owner image. The loader SHALL recheck the packet, the payload and the provider before it dereferences an address from an image.

A stdio bridge or another process transport SHALL NOT be necessary for delivered Rust Glue, and evidence from such a transport SHALL NOT qualify it. Glue generation SHALL NOT invoke Mod contracts. The compiler SHALL NOT have a `mod.glue` pipeline phase. Corelib SHALL NOT declare Glue Mod contracts or `[Glue]`, `[GlueImport]` or `[GlueExport]` attributes.

The acceptance evidence for this requirement SHALL be every `#[test]` function in these files, and no others:
- `compiler/crates/beskid_tests_release/tests/glue_owned.rs`: the owned path, driver admission, CLI build, published-image admission, manual and generated equivalence, borrow and foreign-thread release, owner abort, packet identity, closed boundary metadata, tool selection, hermetic Cargo, rebuild and shared native test object tests (28 functions in the current tree);
- `compiler/crates/beskid_tests_release/tests/glue_owned/extensions.rs`: the manual C ABI, owned and CLI round trips of records, enums and callbacks (3 functions in the current tree);
- `compiler/crates/beskid_tests_interop/src/interop/export.rs`: the C ABI export metadata, export table and non-public export rejection tests (3 functions in the current tree).

The fixture is `compiler/crates/beskid_tests_release/fixtures/glue/manual/owned/`. An acceptance record SHALL state the test count for each named file and SHALL give the suite total as the sum of these counts (34 in the current tree). A total without the file names SHALL NOT satisfy acceptance. Every named test SHALL pass; a skipped, ignored or compile-only test SHALL count as a failure.

#### Scenario: Owned fixture round trips in process
- **GIVEN** the manual owned fixture built by `beskid build --backend glue-rust` with explicit Rust tools and linker
- **WHEN** the host admits the published consumer image by its printed digest and calls each binding
- **THEN** every representation round trips through the checked C ABI in the host process, and the Glue calls start no peer process (`v06_glue_owned_roundtrip_all_representations`, `v06_glue_cli_builds_owned_fixture_alone`)

#### Scenario: Substituted image is refused before code runs
- **GIVEN** a published consumer or owner image with a changed code byte, a swapped owner, a foreign consumer record, a missing or duplicate owner, or a malformed pin
- **WHEN** the host admits the images
- **THEN** admission fails before the loader dereferences an address from the image (`v06_glue_cli_published_images_fail_closed_on_substitution`)

#### Scenario: Stdio evidence does not qualify Rust Glue
- **GIVEN** passing stdio bridge codec, envelope or session tests and no passing owned-path test
- **WHEN** Rust Glue acceptance is evaluated
- **THEN** acceptance is rejected

#### Scenario: Acceptance names every evidence file
- **GIVEN** an acceptance record that states a total Glue test count without the per-file counts for `glue_owned.rs`, `glue_owned/extensions.rs` and `export.rs`
- **WHEN** the release evidence is validated
- **THEN** the record is rejected

### Requirement: Loader-issued native descriptor and callback closure
The private producer and loader SHALL admit every Dynamic payload/cell descriptor and constructor, reader or transform callback through an exact source-qualified signature, source digest, image role and verified symbol-address owner before provider registration. The provider SHALL retain the admitted closure in the canonical traced owner record chain, bound to the process issuer, session, library and generation, and SHALL test membership before descriptor dereference or callback invocation. Closure publication SHALL be once-only, bounded to 4096 rows and included in the aggregate 16 MiB owner budget. Native addresses SHALL remain private compiler transport and SHALL NOT appear in serialized values or portable artifact authority. A public shape or mapping registration SHALL NOT extend this closure. The process lease SHALL retain every owning image through heap destruction, and close SHALL invalidate membership and clear retained closure payloads before image release.

#### Scenario: Invalid pointer rejects before memory access
- **GIVEN** a live admitted library and a shape DTO containing an unadmitted descriptor or callback address
- **WHEN** registration is requested
- **THEN** registration fails before dereferencing the descriptor, calling the callback or allocating a shape record

#### Scenario: Valid bytes do not grant image authority
- **GIVEN** a rehashed signature packet with descriptor or callback addresses belonging to another image
- **WHEN** the private loader compares the current source and pinned symbol owners
- **THEN** it rejects closure publication and exposes no usable shape or mapping tag

#### Scenario: Closed library cannot reuse admitted addresses
- **GIVEN** a library with an admitted closure that has been closed and a subsequent library reusing an address
- **WHEN** an old generation requests registration or invocation
- **THEN** the old issuer/session/library/generation fails and the process lease keeps descriptor images pinned until the heap is destroyed

### Requirement: Rust owner mappings are declared in Beskid source
Rust owner mappings SHALL come from a closed source attribute `RustOwner` on the canonical Glue declaration, read through generation-bound binding facts.

On a `GlueHandle` type whose `Library` names a manifest Rust glue owner, `[RustOwner(Path:"<rust path>")]` SHALL be required. It SHALL map that type's complete owner brand to the Rust type.

On a method of an `Extern` contract whose `Library` names a Rust glue owner, `[RustOwner(Path:"<rust path>", Fallible:<bool>)]` SHALL be optional. Absent arguments SHALL default to `Path` = `implementation::<symbol>` and `Fallible` = `false`. The mapping SHALL be keyed by the exact binding identity.

A Rust path SHALL be `::`-separated ASCII identifiers whose first segment is `implementation`. `crate`, `self`, `super`, `std`, `core`, raw identifiers and generic arguments SHALL be rejected. The attribute SHALL be rejected in each of these cases:
- duplicated;
- with unknown or repeated arguments;
- `Fallible` on a type;
- placed on any other declaration;
- naming a library that has no Rust glue block.

`Fallible:true` SHALL require the Rust callable to return `Result<T, i32>`. A nonzero error SHALL be the owner status of the call. A Beskid caller SHALL observe that status only through the checked invocation of an export whose body reaches the import; every other failure path SHALL trap.

The owner build SHALL derive its type and callable inputs only from these facts. Caller-supplied brand or identity tables SHALL NOT be accepted. The mapping text SHALL be part of the owner source inventory digest. A Rust implementation whose signature disagrees with the declared mapping or fallibility SHALL fail the owner compilation, not be adapted at runtime.

#### Scenario: Declared mappings drive the owner build
- **GIVEN** the manual owned fixture with `[RustOwner(Path:"implementation::ManualOwned")]` on `ManualOpaque` and `Fallible:true` on `glue_utf8`, `glue_bytes`, `make_manual_owned`, `check_manual_owned`, `glue_failure`, `glue_utf8_exact` and `glue_bytes_exact`
- **WHEN** the Rust owner build input is formed
- **THEN** it contains exactly one type mapping for the `ManualOpaque` brand and one callable mapping per imported binding identity, with the declared or default paths and fallibility

#### Scenario: Missing or misplaced mappings fail before generation
- **GIVEN** a `GlueHandle` type without `RustOwner`, a duplicate `RustOwner`, `RustOwner` on an Export function, or a path such as `std::process::abort`
- **WHEN** the Glue binding facts are queried
- **THEN** the query rejects the declaration with its source span before any owner source is generated

#### Scenario: Mapping change changes owner identity
- **GIVEN** two otherwise identical builds that differ only in one `RustOwner` path or `Fallible` value
- **WHEN** both owner source inventories are formed
- **THEN** their source digests differ

### Requirement: Glue admits repr(C) records by value
Rust Glue SHALL admit a type declared `[GlueRecord]` as a by-value parameter and as a by-value result of Glue imports and exports. A `[GlueRecord]` type SHALL be non-generic and SHALL have 1 to 64 fields. Each field SHALL be one of `i8`, `i16`, `i32`, `i64`, `u8`, `u16`, `u32`, `u64`, `f32`, `f64`, `bool`, `char` or `word`. The record SHALL cross the C ABI by value in parameters and through a checked out parameter for results, with the layout that the C ABI profile computes. Field values SHALL be copied in both directions; a record value SHALL NOT alias managed storage on the foreign side. A `bool` field outside 0 and 1 or a `char` field that is not a Unicode scalar value, received from the foreign side, SHALL cause a checked failure before a managed record is constructed. A `[GlueRecord]` type with a field of another type, with no fields, with more than 64 fields, or with generic parameters SHALL be rejected before adapter generation. Admission SHALL be established by a hand-written C ABI fixture before a generated adapter claims equivalence.

#### Scenario: Record round trip
- **GIVEN** a Rust Glue import that takes and returns a `[GlueRecord]` of two `i64` fields and one `f64` field
- **WHEN** Beskid code calls the import with a record value
- **THEN** the foreign side receives the field values unchanged and the Beskid caller receives a new record with the returned field values unchanged

#### Scenario: Record with an unadmitted field
- **GIVEN** a `[GlueRecord]` type that has a `string` field
- **WHEN** a Glue declaration that uses it is checked
- **THEN** the compiler rejects the declaration before generating an adapter

#### Scenario: Invalid Bool field from the foreign side
- **GIVEN** a Rust Glue export that takes a `[GlueRecord]` with a `bool` field
- **WHEN** the foreign caller passes the value 2 in that field
- **THEN** the checked invocation reports status 1 and the export body does not run

### Requirement: Rust owner types for records and enums
A `[GlueRecord]` type or a `[GlueEnum]` type that a Rust owner import uses SHALL carry `[RustOwner(Path:"implementation::...")]`, which names the Rust type of the owner crate. `Fallible` SHALL be rejected on these placements. The generated owner shell SHALL verify at compile time that a record's Rust type has the profile size and alignment and that each field has the profile offset and type, and SHALL convert enum discriminants by exhaustive matches over the Beskid variant names. A Rust owner type whose layout or variant names differ SHALL fail the owner build.

#### Scenario: Owner record layout differs
- **GIVEN** a `[GlueRecord]` with fields `i64 x` and `i64 y` and a Rust owner type that declares `y` before `x`
- **WHEN** the owner build runs
- **THEN** the build fails before an owner image is published

#### Scenario: Missing Rust owner type
- **GIVEN** a Rust owner import that takes a `[GlueRecord]` without `RustOwner(Path:..)`
- **WHEN** the owner tables are formed
- **THEN** the build fails and names the record declaration

### Requirement: Glue admits fieldless enums as checked discriminants
Rust Glue SHALL admit a non-generic enum declared `[GlueEnum]` with 1 to 4096 variants, none of which has fields, as a parameter and result of Glue imports and exports. The discriminant SHALL be the source-order variant index as `uint32_t`. The receiving side SHALL check each discriminant against the variant count and SHALL report a checked failure, status 1, for a value that names no variant. A `[GlueEnum]` with a variant that has fields SHALL be rejected before adapter generation.

#### Scenario: Unknown discriminant
- **GIVEN** a foreign function that returns the discriminant 7 for a `[GlueEnum]` with three variants
- **WHEN** the Beskid caller receives the value
- **THEN** the call reports a checked failure and does not produce an enum value

#### Scenario: Tagged variant rejected
- **GIVEN** a `[GlueEnum]` with a variant `Some(i64 value)`
- **WHEN** a Glue declaration that uses it is checked
- **THEN** the compiler rejects the declaration before generating an adapter

### Requirement: Glue admits call-scoped callbacks with explicit lifetime rules
Rust Glue SHALL admit a function type `(P1, ..., Pn) => R` with 0 to 16 parameters as a parameter of a Glue import. Each `Pi` SHALL be an admitted scalar form and `R` SHALL be an admitted scalar form or `unit`. The callback SHALL cross as a C function pointer `int32_t (*)(uint64_t context, P1, ..., Pn, R *out)` (without `out` for `unit`) and a `uint64_t` context token. The import adapter SHALL root the function value from before the foreign call until after the foreign call returns. The callback SHALL be invocable only during the import call and only on the thread that made the import call; any other invocation SHALL return status 2 without running Beskid code. Invalid `bool` or `char` arguments SHALL return status 1 without running Beskid code. A trap in Beskid code that the callback runs SHALL end the process without unwinding. No unwind SHALL cross a C frame. A function type in a Glue export, in a Glue result, in a record field, or nested in another function type, and a foreign function pointer used as a Beskid value, SHALL be rejected before adapter generation.

#### Scenario: Foreign code calls a Beskid callback
- **GIVEN** a Rust Glue import that accepts a callback and calls it once before it returns
- **WHEN** Beskid code passes a function value to the import
- **THEN** the function value runs once with the arguments the foreign side supplied and stays rooted until the import returns

#### Scenario: Retained callback after the call
- **GIVEN** a foreign function that stores the callback context token and returns
- **WHEN** foreign code later invokes the stored callback
- **THEN** the invocation returns status 2 and no Beskid code runs

#### Scenario: Callback failure does not unwind through foreign frames
- **GIVEN** a Rust owner import whose callback invocation returns a nonzero status
- **WHEN** the generated Rust callback closure observes the status
- **THEN** the owner shell catches the resulting unwind at the C boundary and the import reports that status as its checked failure

#### Scenario: Callback in an export rejected
- **GIVEN** a Glue export with a function-typed parameter
- **WHEN** the Glue binding facts are queried
- **THEN** the query rejects the declaration before generation

### Requirement: Glue generates the Rust consumer for Beskid exports
The Rust owner build SHALL generate a `beskid` module in the owner crate with one function per export of the consumer packet, named after the export symbol. Each function SHALL call the checked export invocation of the admitted consumer image and SHALL return the export result or a `GlueError`. The loader SHALL bind the checked export invocation addresses into the owner image before owner code can call them. A call SHALL be admitted only on a thread that is inside a Beskid-to-owner import call; any other call SHALL return `GlueError::ForeignThread` without entering Beskid code.

#### Scenario: Generated export consumer
- **GIVEN** a Beskid project that declares a C ABI export and a Rust owner import whose implementation calls `crate::beskid::<symbol>`
- **WHEN** the owner build runs and Beskid code calls the import
- **THEN** the owner code calls the export through the generated module and receives its checked result without a hand-written link step

#### Scenario: Export call outside an import call
- **GIVEN** owner code that calls a generated export function on a thread that is not inside an import call
- **WHEN** the call runs
- **THEN** it returns `GlueError::ForeignThread` and no Beskid code runs

