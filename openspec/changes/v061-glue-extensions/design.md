## Context

Rust Glue 0.6 (`v06-rust-glue-integration`) is one in-process call path: a Beskid consumer image calls Rust owner images through checked C ABI status/out-parameter wrappers. The admitted forms are fixed-width scalars, f32/f64, Bool, Unicode scalars, `word`, UTF-8 and byte views, `unit` results and branded opaque handles (`GlueHandle`). The 2026-10-13 design review (`docs/research/2026-10-13-glue-design-review.md`) lists the gaps this change closes: records by value, callbacks, enums, a generated Rust consumer of Beskid exports, and the second boundary vocabulary.

Baseline: compiler `5b859b18`, root `47ea0cbf`. Host seams: `beskid_queries/src/semantic_contract/glue.rs` (`GlueLogicalType`, `logical_type`), `beskid_abi/src/interop` (`TypeShape`, `InteropSignature`, `CAbiProfile`), `beskid_codegen/src/glue` (packet, C adapters, Rust client, Cranelift handle transports), `beskid_aot/src/api/glue` (owner build, loader, published records) and `beskid_tests_interop`.

## Goals / Non-Goals

Goals: admit records by value, fieldless enums and call-scoped callbacks in Rust Glue imports and exports where stated below; let Rust owner code call Beskid exports through a generated module; make `TypeShape`/`InteropSignature` the single boundary vocabulary of Glue.

Non-goals: tagged (data-carrying) enum variants, nested records, records with view or handle fields, foreign function pointers as Beskid values, callbacks that outlive the import call, callbacks on foreign threads, variadics, foreign-thread entry into Beskid, and the stdio bridge (`v06-glue-stdio-bridge-provisional`).

## Decisions

### 1. One boundary vocabulary: Glue lowers to Interop.Contracts (task 1.2)

Ruling: `GlueLogicalType` lowers to `TypeShape` in one function, and a Glue binding fact lowers to `InteropSignature` in one function, both in `beskid_queries::semantic_contract::glue` (`glue_type_shape`, `glue_interop_signature`). Interop.Contracts is not retired from the Glue text.

Reasons. The Interop.Contracts hub requires that profiles bind its primitives and do not redefine them (D-LMETA-IC-0001, D-LMETA-IC-0002), and its conformance envelope names type-shape classes as the compatibility vocabulary (D-LMETA-IC-0003). Records by value need a layout authority: the C ABI profile is the specified owner of "symbols, layouts, linking" (D-LMETA-IC-0002), and its delivery bands already plan "`CLayout` primitive structs" and "enum ABI" (D-LMETA-CABI-0005). Retiring Interop.Contracts would leave records without a profile owner and keep two vocabularies that nothing checks against each other (review, question 2). Lowering instead makes `CAbiProfile` compute record size, alignment and offsets once, and every Glue emitter reads the same numbers.

Vocabulary changes in `beskid_abi::interop`:

- `ScalarShape` gains a `domain` (`raw`, `bool`, `unicode_scalar`, `native_word`). Bool is `u8` in the `bool` domain, char is `u32` in the `unicode_scalar` domain, `word` is `usize` in the `native_word` domain. The surface primitive mapping of the user C profile uses the same domains, so Bool is `u8`/`bool` there too (it was `i8`).
- New shapes: `BrandedHandle { identity, nullable, arguments }` (a `GlueHandle` token, class `opaque_handle`), `Record { identity, fields, size, alignment }`, `Enumeration { identity, variants }` (class `scalar`, carried as `u32`) and `Callback { parameters, result }`.
- `TypeShapeClass` gains `record` and `callback`.

The round trip is `glue_logical_form(glue_type_shape(t)) == GlueLogicalForm::of(t)` for every admitted form. `GlueLogicalForm` is `GlueLogicalType` with declaration keys replaced by their stable qualified identity, because a key is a generation-bound database fact that a boundary shape cannot carry. Generic positions are not admitted forms: an unspecialized generic binding fails before lowering, as it fails before emission today.

### 2. Records by value

- Declaration: `[GlueRecord]` on a non-generic `type` with 1 to 64 fields. Each field is an admitted scalar form: `i8`..`i64`, `u8`..`u64`, `f32`, `f64`, `bool`, `char` or `word`. Views, handles, records, enums, arrays and function types are rejected as record fields in this change.
- Layout: the C profile computes the C struct layout in declaration order. Each field is placed at the next offset aligned to its natural alignment; the record alignment is the largest field alignment; the size is the end offset rounded up to that alignment. This is the aggregate rule of the System V AMD64 psABI (section 3.1.2, "Aggregates and Unions"), of AAPCS64 ("Composite Types"; Apple arm64 follows it for these fields) and of the Microsoft x64 ABI ("Types and storage", struct alignment), and it is the algorithm of Rust `#[repr(C)]` (The Rust Reference, "Type layout", "The C Representation"). All three supported targets are 64-bit, so `word` is 8 bytes on each.
- Physical transport: the record crosses the C ABI by value as a generated `typedef struct` (`GlueRecord_<digest>`) in parameters, and as a `GlueRecord_<digest> *` out parameter for results, under the existing status/out-parameter convention. The digest is the SHA-256 of the record's qualified identity and its field list.
- Beskid side: a record value is a managed object. A generated Cranelift reader copies the fields of a live object into the C struct, and a generated constructor allocates a new object and copies the fields in. Fields are copied, never aliased: a change on one side never reaches the other. The reader does not compare the object descriptor, because ordinary record literals have their own descriptors; the static type is the authority.
- Validation: a `bool` field outside 0/1 or a `char` field outside the Unicode scalar values that comes from the foreign side is a checked failure (status 1) before any managed object is constructed.
- Rust owner: `[RustOwner(Path:"implementation::T")]` on the record type names the Rust type. It is the third closed `RustOwner` placement (`RecordType`) and is required when a Rust owner import uses the record. The generated owner shell checks at compile time that the Rust type has the profile size and alignment and that each named field has the profile offset (`core::mem::offset_of!`) and type.

### 3. Fieldless enums as checked discriminants; tagged variants evaluated

- Declaration: `[GlueEnum]` on a non-generic `enum` with 1 to 4096 variants, none of which has fields.
- Discriminant: the source-order variant index as `uint32_t`. Rust `#[repr(u32)]` and C `uint32_t` carry it identically. The receiving side checks the value against the variant count and reports status 1 for a value that names no variant, before an enum value is produced.
- Beskid side: a generated reader loads the `i32` tag of the managed enum object and a generated constructor allocates an object with that tag, from the canonical enum layout (`EnumLayoutFact::scalar_payload_object_layout`).
- Rust owner: `[RustOwner(Path:"implementation::E")]` on the enum names the Rust type. The owner shell converts with exhaustive `match` expressions over the Beskid variant names, so the Rust compiler rejects an owner enum whose variant names differ.
- Tagged variants: evaluated and not admitted. A data-carrying enum would cross as the `repr(C, u32)` layout of Rust RFC 2195 (a `u32` tag followed by a `repr(C)` union of `repr(C)` payload structs). That needs records as variant payloads and union layout in the C profile; it is recorded as follow-up work, and a `[GlueEnum]` with a payload variant is rejected before generation.

### 4. Callbacks: call-scoped Beskid function values in import parameters

- Admitted form: a function type `(P1, ..., Pn) => R` as a parameter of an `Extern` import, with 0 to 16 parameters. Each `Pi` is an admitted scalar form; `R` is an admitted scalar form or `unit`. A function type in an export, in a result, in a record field or nested in another function type is rejected before generation.
- Physical transport: two C slots. The first is `int32_t (*)(uint64_t context, P1, ..., Pn, R *out)` (no `out` for `unit`); the second is the `uint64_t context` token. This is the function-pointer-plus-context form that C libraries and the Rust Nomicon ("FFI", callbacks from C code to Rust functions) use for callbacks; the token is not an address.
- GC root: the import adapter roots the closure record before the foreign call and unroots it after the call returns. Each invocation resolves the record from the root, so a moving collection during the call is safe.
- Lifetime: the callback is valid only while the import call runs. The adapter links a callback frame into a per-thread list for the duration of the call. An invocation whose token names no live frame of the calling thread returns status 2 and does not run Beskid code. This also covers a retained token used after the import returned.
- Thread: only the thread that made the import call may invoke the callback. The per-thread frame list enforces it: another thread sees no frame for the token and gets status 2. Beskid code never starts on a foreign thread (foreign-thread entry remains out of scope).
- Panic: a Beskid trap inside the callback ends the process through the runtime trap path and does not unwind. Invalid Bool or char arguments from the foreign side return status 1 before Beskid code runs. In the Rust owner, the generated callback closure turns a nonzero status into a Rust unwind that the owner shell catches at the C boundary (`catch_unwind`), and the import reports that status as its checked failure. No unwind crosses a C frame; this matches the Rust rule that a panic unwinding out of an `extern "C"` function aborts the process (The Rust Reference, "Functions", "Unwinding") and the .NET rule that callbacks must not throw across native frames.
- Rust owner signature: the callback parameter becomes `&mut dyn FnMut(P1, ..., Pn) -> R`.
- Foreign function pointers as Beskid callables: evaluated and not admitted. A foreign function value needs an owner-scoped lifetime, a Beskid representation that is not a closure record, and the same thread rule in reverse. It is recorded as follow-up work and stays rejected.

### 5. Generated Rust consumer of Beskid exports through the owner build

Ruling: the Rust owner build generates a `beskid` module in the owner crate. It has one safe function per export of the consumer packet, named after the export symbol, with the checked status/out-parameter transport behind it. The loader binds the addresses of the consumer's checked export invocations into the owner image (`beskid_glue_rust_owner_v1_bind_exports`), in the same way that it binds owner addresses into the consumer for imports. Owner code calls `crate::beskid::<symbol>(...)`; no hand-linked consumer and no second runtime initialization are needed, because the consumer image is already admitted in the same process.

Rules: an export call from owner code is admitted only on a thread that is inside a Beskid-to-owner import call (the owner shell tracks this per thread); any other call returns `GlueError::ForeignThread` without entering Beskid code. Export results and failures use the generated client types (`GlueError`, records, enums).

The hand-linked `export_caller.rs` fixture is kept: it tests the plain `[Export(Abi:"C")]` profile of a standalone Beskid shared library (`language-meta--interop--export-and-callbacks`), not Glue. Task 3.1 deletes it only if the plain C export profile gains its own generated caller.

### 6. Manual first

The hand-written C ABI fixture `beskid_tests_interop/fixtures/glue/manual/extensions/` comes first: a C header whose static assertions fix the record layout of the C ABI profile, a hand-written Rust `extern "C"` library, and a hand-written consumer that does what the generated adapters do (discriminant and Bool/`char` checks, per-thread callback frames). Test `v061_glue_extensions_manual_c_abi` builds it with the explicit tools. The generated fixture `fixtures/glue/extensions/owned` and test `v061_glue_extensions_owned_roundtrip` then run the same behaviour through the owner build, the consumer image and `GlueProcess`.

## Risks / Trade-offs

- The record reader trusts the static type instead of the descriptor. A forged object would need unsafe code that Beskid does not have; handles keep their descriptor check because a handle token is an authority.
- Callback frames on the adapter stack bound nesting by stack depth only; the frame list walk is linear in the nesting depth, which is small in practice.
- The ScalarShape domain is a vocabulary change: Bool in the user C profile moves from `i8` to `u8`. Both are one byte with the same C call classification, so no generated code changes.

## Rollback

Remove the admission of a form and its fixtures; unadmitted forms keep failing before generation.
