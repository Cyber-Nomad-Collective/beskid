## ADDED Requirements

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

The acceptance evidence for this requirement SHALL be every `#[test]` function in these files of `compiler/crates/beskid_tests_interop`, and no others:
- `src/interop/glue_owned.rs`: the owned path, driver admission, CLI build, published-image admission, manual and generated equivalence, borrow and foreign-thread release, owner abort, packet identity, closed boundary metadata, tool selection, hermetic Cargo and rebuild tests (27 functions in the current tree);
- `src/interop/export.rs`: the C ABI export metadata, export table and non-public export rejection tests (3 functions in the current tree).

The fixtures are `fixtures/glue/manual/owned/` and `fixtures/glue/manual/export_caller.rs`. An acceptance record SHALL state the test count for each named file and SHALL give the suite total as the sum of these counts (30 in the current tree). A total without the file names SHALL NOT satisfy acceptance. Every named test SHALL pass; a skipped, ignored or compile-only test SHALL count as a failure.

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
- **GIVEN** an acceptance record that states a total Glue test count without the per-file counts for `glue_owned.rs` and `export.rs`
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
