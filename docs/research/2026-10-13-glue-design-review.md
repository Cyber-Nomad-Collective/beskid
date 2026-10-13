# Rust Glue design review against the 0.6 release tree

Date: 2026-10-13. Scope: read-only review of the Glue layer as it exists in the
v0.6 release worktree, compared with how other languages connect to foreign
code. No builds or tests were run for this review; test evidence is taken from
the logs already in `.build/`.

## Baseline

| Item | Identity |
|---|---|
| Root worktree | `/Users/mikserek/.codex/worktrees/v06-release/beskid`, branch `release/v0.6.0` |
| Compiler submodule | `release/v0.6.0`, commit `2192c1e9` ("close the rc28 workspace, Bsol and glue-owned failures") |
| Change under review | `openspec/changes/v06-rust-glue-integration/` (0 of 24 tasks checked) |
| Latest full run | `.build/rc29.log`, 2026-10-13 07:50: interop crate 14 passed, 7 failed; everything else green; release eligible: false |

An earlier review in this series graded the `main` checkout at
`/Users/mikserek/Projects/beskid`. That tree still carries the 0.4 scaffold
(147 lines of declarations, backends failing closed). Its conclusions do not
describe the release tree and are superseded by this document.

## What the release tree actually contains

Glue is now two layers that share a vocabulary but not a transport.

### Layer A: native owned path (the delivered one)

This is what the 18 tests in
`compiler/crates/beskid_tests_interop/src/interop/glue_owned.rs` exercise and
what `beskid build --backend glue-rust` produces.

- The user writes an ordinary `[Extern(Abi:"C", Library:"glue_manual")]`
  contract in Beskid, optionally marking methods `[RustOwner(Fallible:true)]`
  and opaque types `[GlueHandle(Library:.., Nullable:..)]` plus
  `[RustOwner(Path:"implementation::ManualOwned")]`
  (`fixtures/glue/manual/owned/ManualImport.bd`, `ManualTypes.bd`).
- The Rust side is plain safe Rust in `implementation.rs`:
  `fn glue_utf8(value: &str) -> Result<String, i32>`. No `extern "C"`, no
  `unsafe`, no manual marshalling.
- The manifest declares the owner: `glue "glue_manual" { backend = rust path = "rust" }`.
- The compiler derives generation-bound binding facts
  (`beskid_queries/src/semantic_contract/glue.rs`: `GlueBindingFact`,
  `GlueLogicalType`, `GlueHandleBrand`, `GlueRustOwnerCallable`), emits a
  checked C ABI on both sides (status code plus out-parameter; strings and
  bytes travel as `OwnedView { pointer, length, token }`), emits the Rust
  client and owner wrappers (`beskid_codegen/src/glue/rust.rs`), lowers the
  Beskid bodies with Cranelift (`glue/native.rs`), and builds the owner crate
  through a hermetic Cargo invocation (`beskid_aot/src/api/glue/rust_owner.rs`:
  `--offline --locked`, inherited `CARGO_*`/`RUSTFLAGS`/`RUSTC*`/`RUSTUP_TOOLCHAIN`
  removed, ancestor `.cargo/config*` and `rust-toolchain*` rejected).
- Both images carry an admission record; the host pins the consumer image by a
  digest printed by the build and the consumer record pins every owner image
  (`glue/published.rs`, Gate WEB-GLUE03). Loading goes through `GlueProcess`
  (`glue/loader.rs`), which rechecks packet, payload and provider before any
  address is dereferenced.
- Tools are explicit: `--rust-toolchain` or `--cargo` plus `--rustc`, and
  `--linker`. `PATH` is never consulted (`beskid_cli/src/commands/build/glue_rust.rs`).

The export direction exists at the C ABI level: `ManualExport.bd` exports
Beskid functions with `[Export(Abi:"C", Symbol:..)]` and `export_caller.rs`
is a real Rust binary that links the Beskid shared library.

### Layer B: stdio peer protocol (specified, partially built, not delivered)

- Corelib `packages/glue/src/Core/Glue/{Envelope,BinaryCodec,Pump,Session}.bd`
  (about 950 lines of Beskid) implement the version-one envelope, a bounded
  binary value codec over `DataValue`, a frame pump and a cooperative session
  with cancellation and a five-second shutdown budget.
- Rust `crates/beskid_glue` (861 lines) is the reciprocal peer:
  `peer::serve_stdio`, wire, codec, pump, session.
- The Rust emitter generates a `Service` trait and `dispatch`/`serve`
  functions that drive that peer (`glue/rust.rs` lines 600 to 660).
- Tests: six unit tests in `crates/beskid_glue/tests/stdio_peer.rs` that feed
  frames to an in-memory peer, and two corelib test files
  (`BinaryCodecTests.bd`, `ControlEnvelopeTests.bd`). No test spawns a Rust
  peer process from Beskid and completes a call. No code outside the glue
  package and its tests opens a `Session`. Tasks 3.5 and 3.6 (handshake,
  pump, checked tags, binding stdio values to admitted owners) are unchecked.

### Layer C: the 0.4 scaffold, still present

- The seven mod contracts (`Contracts/TypeMapping.bd` and siblings) are
  unchanged 8-line stubs with `string` in and `string` out.
- `beskid_analysis/src/mod_host/glue.rs` still logs "no glue contracts invoked
  (0.4)" and returns the program unchanged (line 138). The delivered path does
  not go through it at all; it goes through `beskid_queries` facts straight to
  codegen and AOT.
- `[Glue]`, `[GlueImport]` and `[GlueExport]` are declared in
  `StdioBridge.bd` and used by nothing outside the glue package. The delivered
  path uses `[Extern]`, `[Export]`, `[GlueHandle]` and `[RustOwner]`.
- `GlueTag` and its raw `i64` constructor are gone, as the spec delta requires.

## Answers to the four questions

### 1. Does the design still fuse bindgen-style generation with a stdio bridge?

Yes, and the fusion is now written into normative text. The spec delta
`specs/language-meta--interop--beskid-glue/spec.md` says:

> Delivered Glue calls between Beskid and Rust services SHALL use one stdio
> transport. Local wrappers SHALL use C ABI and exported Beskid bodies SHALL
> remain canonical AOT.

The design document (decision 1) reads this as: C ABI wrappers are local to a
process, stdio is what connects two processes. But every passing end-to-end
test loads the owner image into the Beskid process and calls through the
checked C ABI. Nothing qualified crosses stdio. So the sentence that defines
what "delivered" means names the transport that is not delivered, and the
transport that is delivered is described only as "local wrappers".

The two layers also solve different problems. Layer A is FFI: in-process,
typed, zero-copy views, nanosecond calls. Layer B is a plugin protocol in the
style of Erlang ports or Terraform providers: process isolation, serialization
on every call, a shutdown state machine. Both are legitimate. Treating them as
one capability means the 0.6 acceptance text can be satisfied by neither
alone, and a reader cannot tell which one `[GlueImport]` would select.

Recommendation: split the capability. Name Layer A "Rust Glue" and make it
the 0.6 obligation, with the spec sentence rewritten to say C ABI is the
delivered call path. Move Layer B to its own capability (for example
`language-meta--interop--glue-service-transport`), keep its envelope and
codec requirements as written, and mark it provisional until a process
round trip is tested. Delete Layer C or make task 3.2 real; a spec that
requires invoking seven contracts the compiler never calls is a standing
drift.

### 2. Is the vocabulary typed?

Typed, but it is a new vocabulary rather than the one the spec names.

- `GlueLogicalType` is a real sum type: primitives, arrays, generic positions
  and branded handles. `GlueBindingFact` carries direction, symbol, library,
  generics, parameters, result and the Rust owner mapping. Codegen consumes
  `GlueBindingManifest` and `GluePhysicalType`. Digests are 32-byte values,
  not hex strings, at the point of use.
- `TypeShape` and `InteropSignature` from `beskid_abi::interop` appear zero
  times under `beskid_codegen/src/glue`, `beskid_aot/src/api/glue` or
  `semantic_contract/glue.rs`. They are used by the native Mod callback path
  (`native_mod/producer.rs`, `mod_host/callback_transport.rs`), not by Glue.
- The proposal says "Interop.Contracts remains boundary vocabulary". In the
  tree it is a parallel vocabulary. Nothing checks that `GlueLogicalType`
  and `TypeShape` agree on, say, what a UTF-8 view is.
- The seven mod contracts remain `string MapType(string)`.

Recommendation: either make `GlueLogicalType` lower to `TypeShape` in one
function with a test that round trips every admitted form, or amend the spec
to name `GlueLogicalType` as the boundary vocabulary and retire
`Interop.Contracts` from the Glue text. One of the two must give way before
the type matrix grows.

### 3. Where does it sit against Rust cxx, Swift and .NET LibraryImport?

| Aspect | Rust `cxx` | Swift C++ interop | .NET `LibraryImport` | Beskid Rust Glue (Layer A) |
|---|---|---|---|---|
| Declaration site | `#[cxx::bridge]` module, both sides in one place | Compiler imports Clang module | C# `partial` method with attributes | Beskid `[Extern]` contract plus manifest `glue` block; Rust side is unannotated |
| Who writes the foreign side | User writes ordinary Rust and C++ | User writes ordinary C++ | User writes the native library | User writes ordinary safe Rust; the compiler emits the `extern "C"` shell |
| Scalars, strings, bytes | Yes | Yes | Yes | Yes, full fixed-width set, bit-preserving floats, UTF-8 and bytes as owned views |
| Records / structs by value | Shared `struct` in the bridge | Yes | Blittable structs | No; a nominal type is admitted only as a `GlueHandle` brand with one `u64` token |
| Opaque handles | `UniquePtr<T>`, `Box<T>` | Yes | `SafeHandle` | Yes, branded, nullable or not, generic over Beskid type arguments, with release symbol |
| Callbacks / function pointers | Yes | Yes | Delegates and `delegate* unmanaged` | No; `Type::Function` is rejected at `semantic_contract/glue.rs` line 106 |
| Errors across the boundary | `Result<T>` becomes C++ exception or Rust error | Throws | `SetLastError`, exceptions | `Result<T, i32>` becomes status plus out-parameter; panics caught and reported |
| Build integration | User's Cargo and CMake | Xcode and SwiftPM | MSBuild | Compiler runs Cargo itself, hermetically, with explicit tool paths |
| Artifact trust | None beyond the linker | Codesign | Strong names are identity only | Digest-pinned consumer and owner images, admission record checked before any code runs |
| Process model | In-process | In-process | In-process | In-process (Layer A); stdio service (Layer B, not delivered) |

The closest relatives are UniFFI and napi-rs: the compiler owns the foreign
build, the user writes idiomatic Rust, and a manifest names the library. The
part none of the comparison targets has is the admission model. No other
language's FFI refuses to load a wrapper because the host's recorded digest
differs from the file. That is an unusual strength and a real cost: every
build needs an explicit toolchain path, there is no `cargo` on `PATH`
fallback, and a rebuilt owner is a new identity.

Where it is clearly behind: records and callbacks. `cxx` and LibraryImport
both let a struct cross by value and both let the foreign side call back.
Beskid admits only scalars, views and tokens. Any Rust API that takes a
config struct or a progress callback has to be wrapped by hand on the Rust
side first.

### 4. What is genuinely missing

- **repr(C) records.** `Type::Complex` resolves only to `GlueHandle` brands
  (`semantic_contract/glue.rs` lines 215 to 300). Plain records are rejected.
  The C profile (`beskid_abi/src/interop/c_profile.rs`) widened its scalar
  set to `I16`, `U16`, `U32`, `U64` and gained optional extern contracts with
  a compiler-supplied `Available()` query, but still has no record shape.
- **Callbacks and function pointers.** Rejected at line 106. The design
  non-goals list callbacks, variadics and foreign-thread entry, so this is
  deliberate for 0.6, but it is the single biggest gap against every
  comparison target.
- **Exports over the glue layer.** C ABI exports work and are tested by a
  real Rust caller. `[GlueExport]` as a glue-driven export does nothing.
  There is no path for Rust to call Beskid through the owner build; the
  export fixture is a hand-linked consumer.
- **Stdio round trip.** Layer B has codec and framing tests but no test that
  spawns a Rust peer and completes a request. Tasks 3.5 and 3.6 are open.
- **Enums and variants in the native path.** The binary codec has a variant
  tag; the native path has no enum admission.
- **.NET.** Correctly absent and marked unavailable.
- **Test count.** `glue_owned.rs` declares 18 `#[test]` functions; the latest
  interop run reports 21 tests (14 passed, 7 failed). The extra three come
  from other files in the crate. Any acceptance text that says "21 glue tests"
  should name the files.

## Verified carry-overs from the earlier review

**Thread.bd out-parameter bug stands.**
`compiler/corelib/packages/foundation/src/Core/Threading/Thread.bd`:

- Line 13 declares `i32 pthread_create(i64 threadOut, i64 attr, i64 startRoutine, i64 arg)`.
- Line 27 sets `i64 threadOut = 0;` and line 28 passes it by value. The C
  function receives a null `pthread_t*` and writes through it. On glibc this
  is a segmentation fault; on macOS the same.
- Line 35 returns `Thread { handle: threadOut }`, which is always zero even if
  the call somehow returned.
- Lines 40 to 48 repeat the pattern for `pthread_join` with `valueOut`.
- There is no address-of operation in corelib to fix this with. The four
  `AddressOf(` hits in the tree are an unrelated helper in
  `packages/http3/src/Http3/H3Quic.bd` line 330 that builds a `SocketAddress`.
- `Thread.Spawn` has no callers in corelib or the compiler, so the bug is
  latent. Either delete the type until pointers to locals exist, or give the
  C profile an out-parameter form the way the Glue checked ABI already does
  for strings.
- The Linux-then-Darwin retry (lines 28 to 31) can now be replaced by an
  `[Extern(..., Optional:true)]` contract and its `Available()` query, which
  the release tree supports.

**C profile.** Scalar set widened, optional contracts added. Records and
function pointers are still absent, as above.

## Rating

Scores are for the release tree only. The earlier scores for the `main`
checkout are withdrawn.

| Dimension | Score | Evidence |
|---|---|---|
| Beskid calling Rust, in process | 7/10 | Full scalar matrix, strings, bytes, arrays, branded generic handles, fallible calls; 14 of 21 interop tests passing on 2026-10-13 |
| Rust calling Beskid | 5/10 | C ABI exports linked by a real Rust binary; no generated Rust-side consumer |
| Binding generation | 7/10 | Rust client, owner shell, C header and checked wrappers all generated from source facts; user Rust stays idiomatic |
| Build and artifact integrity | 9/10 | Hermetic Cargo, explicit tools, digest-pinned admission; stronger than any comparison target |
| Type coverage | 4/10 | No records, callbacks, enums or raw pointers; handles cover the opaque case well |
| Stdio service transport | 3/10 | Envelope, codec, pump and session exist with unit tests; no process round trip; not used by anything |
| Spec coherence | 4/10 | Delivered transport contradicts the "one stdio transport" sentence; seven dead mod contracts; two boundary vocabularies; 0 of 24 tasks checked |
| Legacy C `[Extern]` surface | 5/10 | Wider scalars and optional contracts; still integer-as-pointer with a live null-pointer bug in `Thread.bd` |

Overall: a 6/10 Rust integration with a 9/10 trust model and a 4/10 spec. In
plain terms, the connection works for scalar and buffer APIs and opaque
objects, is built more safely than its peers, and is described by a
specification that still promises a different mechanism.

## Recommendations, in order

1. Rewrite the "Canonical stdio transport" requirement so that the checked C
   ABI is the delivered Rust Glue call path, and move the stdio transport to
   its own provisional capability. Do this before freezing 0.6 acceptance
   text, because today the text cannot be satisfied by the code that passes.
2. Decide the fate of the seven mod contracts and `[Glue*]` attributes. Either
   task 3.2 implements them or task 4.1 deletes them. Shipping both the
   requirement and the unchanged scaffold is the worst option.
3. Pick one boundary vocabulary. Lower `GlueLogicalType` to `TypeShape` with
   a round-trip test, or retire `Interop.Contracts` from the Glue spec.
4. Fix or remove `Thread.bd` lines 27 to 48. Prefer removing until the C
   profile has an out-parameter form.
5. Plan records and callbacks for 0.7 with the same manual-then-generated
   discipline. Records by value are what unlock most real Rust crates; the
   checked ABI already has the out-parameter shape to carry them.
6. Add one end-to-end stdio test (Beskid spawns the generated Rust peer,
   handshake, one call, cancel, shutdown) before any text calls Layer B
   delivered, or drop Layer B from 0.6 entirely.
