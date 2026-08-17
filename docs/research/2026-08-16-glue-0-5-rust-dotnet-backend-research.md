# Research: Beskid.Glue 0.5 Rust-source & .NET-project backends

**Date:** 2026-08-16
**Scope:** Inform the 0.5 implementation of `Beskid.Glue` — the `RustSource` backend
(Rust crate source emission) and the `DotNetProject` backend (.NET project
emission via `dotscope` signature read/write), plus the stdio-bridge runtime and
the `GlueTag` host typed-tag-object pattern.
**Status:** Research only. No code changes. Cited against primary sources and the
existing 0.4 OpenSpec change
(`openspec/changes/add-beskid-glue-0-4/`) plus corelib
(`compiler/corelib/packages/glue/`).

---

## 0. Where 0.4 leaves 0.5

From `add-beskid-glue-0-4/design.md` and the corelib `.bd` files, 0.4 fixes the
contracts and **fails closed** on generation:

- `Backend` trait + `BackendKind { Clif, RustSource, DotnetProject }` at the
  `CodegenInput` boundary. Selection via `--backend`, **not** a mod contract
  (D-GLUE-0001). Backends operate *after* `lower.ready`; mod contracts operate
  *before* it. Different seams, different inputs.
- `Interop.Contracts` is the **single source of truth** for foreign-boundary
  type shapes, instantiated as typed Rust in `beskid_abi::interop`:
  `TypeShapeClass`, `TypeShape`, `OwnershipClass`, `CallShapeClass`,
  `InteropParameter`, `InteropReturn`, `InteropSignature` (with `validate()`),
  `ConformanceEnvelope` (pinned to `BESKID_RUNTIME_ABI_VERSION` +
  `BESKID_USER_FFI_LAYOUT_BAND`). Glue **consumes** it, never redefines it
  (D-GLUE-0002).
- Seven atomized glue mod contracts in `SDK_MOD_CONTRACTS`:
  `TypeMapping.MapType`, `SymbolEmission.EmitSymbol`,
  `LinkArgs.ResolveLinkArgs`, `SignatureReader.ReadSignatures`,
  `SignatureWriter.WriteSignatures`, `ToolchainProbe.ResolveTool`(+`ValidateTool`),
  `StdioBridge.GenerateBridge`. Discovered by the same scan as the six compiler
  mod contracts.
- `mod.glue` phase id ordered between `mod.rewrite` and `lower.ready`.
- Corelib `Core.Interop` package: `CStringView`, `CBuffer`, `CArrayView`
  matching ABI-v5 `BeskidStr`/`BeskidArray` layouts.
- Corelib `Core.Glue` package: `[Glue]`, `[GlueImport]`, `[GlueExport]`,
  `GlueTag` (opaque `i64 handle`), `StdioBridgeMessage` (`GlueTag` + `u8[] payload`).
- `ToolchainProbe` scaffold in `beskid_abi::toolchain` (`ToolSpec`,
  `ResolvedTool`, atomized `ToolchainError`), modeled on ABI-v5 kit
  discovery/validation, **fail-closed** until 0.5 fills resolution.

0.5 obligations (from `design.md` Goals/Non-Goals + Risks):

1. Language-specific Rust crate emission.
2. .NET project emission via `dotscope` signature read/write.
3. stdio-protocol runtime implementation (wire format + fiber).
4. Corelib glue runtime implementations.
5. `ToolchainProbe` resolution logic (rustc, cargo, dotnet, linker, dotscope).

The research below maps each obligation to proven external patterns and ends
with concrete architecture recommendations.

---

## 1. Can a compiler emit Rust *source* as a backend target?

### 1a. `mrustc` — Rust compiler in C++

`mrustc` (github.com/thepowersub/mrustc, historically thephd/mrustc) is an
alternate Rust compiler written in C++ that lowers Rust to MIR/HIR and emits
**LLVM IR** (and previously C/`--emit c`), then hands off to a stock LLVM. It
does **not** emit Rust source; it emits object code via LLVM. Its value to
Beskid.Glue is **not** as a source emitter but as a reference for: how MIR is
shaped, how `extern "C"`/`#[no_mangle]` are tracked through lowering, and how
crate-level metadata (name, edition, crate-type) is represented independently of
`rustc`. We should not copy its backend; we emit text.

### 1b. `cranelift-module` — no source emission

`cranelift-module` (docs.rs/cranelift-module) is the `Module` trait for
collecting `FunctionDeclaration`/`DataDeclaration` with `Linkage` and emitting
**object code** via `cranelift-object`/`cranelift-jit`/`cranelift-faerie`. Its
`Linkage` enum (`Import`/`Local`/`Export`/`Preemptible`/`Hidden`/`Exported`) and
`FuncId`/`DataId` declaration-then-define model is conceptually useful for
Beskid's `SymbolEmission` contract, but it emits machine code, **not** source.
**Do not** model the Rust source backend on `cranelift-module`; model the
*declaration/definition separation* on it.

### 1c. Real "Rust source as a backend target" precedents

True source-emission backends are rare because Rust is hard to pretty-print
correctly (borrow checker, lifetime elision, macro hygiene). The precedents
that exist all build a **typed `syn`-like AST and pretty-print it** rather than
emitting strings:

- **`prost-build`** (docs.rs/prost-build): `.proto` → Rust. It parses with
  `protoc` into a `FileDescriptorSet`, builds `Service`/`Method` descriptors,
  then emits Rust via **`prettyplease`** (a `syn`-based pretty-printer) when the
  `format` feature is on. The `ServiceGenerator` trait is the seam: a service
  descriptor in → Rust `TokenStream` out. Build-script writes
  `OUT_DIR/.../snazzy.items.rs`, consumed via `include!(concat!(env!("OUT_DIR"),
  ...))`. **This is the closest architectural match for `RustSource`.**
- **`wasm-bindgen`** (`#[wasm_bindgen]` macro + `wasm-bindgen` CLI): the macro
  emits a Rust `TokenStream` describing the FFI surface into a custom section;
  the CLI post-processes the `.wasm` and **emits a JS/TS module** as the foreign
  binding. It is a *macro+post-processor* split, not pure source emission, but
  the "describe-once, render-to-target" shape is directly relevant.
- **`bindgen`** (C/C++ → Rust): parses C headers via libclang, emits Rust
  `TokenStream` (via `syn`/`proc-macro2`), pretty-prints. The pattern is the
  inverse direction of `RustSource` but the same technique: foreign IR →
  `TokenStream` → formatted Rust text.
- **`cbindgen`** (Rust → C/C++): the *reverse* of `RustSource`'s export side.
  It reads a Rust crate (via `syn`), finds `#[no_mangle] pub extern "C"` items,
  maps Rust types to C ABI types, and **emits C/C++ header text**. Its
  annotation model (`/// # Cbindgen` doc directives, `cbindgen.toml`) is the
  reference for how `SymbolEmission` should expose per-symbol knobs without
  polluting the source language.

**Takeaway:** No mainstream compiler emits Rust source from a high-level IR as
its *primary* path; the proven approach is **build a typed Rust AST (`syn`/
`proc-macro2` `TokenStream`) and pretty-print with `prettyplease`**. Beskid's
`RustSource` backend should be a `CodegenInput → proc_macro2::TokenStream →
String` pipeline, not a string-template pipeline.

---

## 2. Languages with a "Rust target"

### 2a. `maturin` / `pyo3` — the build+packaging shell

`maturin` (github.com/PyO3/maturin) **does not generate Rust**. The user writes
the Rust crate by hand using `pyo3` macros (`#[pymodule]`, `#[pyfunction]`,
`#[pyclass]`); `pyo3`'s proc-macros expand into the Python C-API shim. `maturin`
compiles the crate (`cargo build`) into a `cdylib`, then wraps it as a Python
wheel (`manylinux`/`auditwheel` compliance). For `cffi` and `uniffi` bindings,
`maturin` invokes the binding generator (e.g. `uniffi-bindgen` cffi header) as
a build step. **Lesson for Glue:** the Rust-source backend should emit a *plain
hand-compilable crate* that a downstream `cargo`/`dotnet` build can consume;
Glue is the *generator*, not the *packager*. Packaging (link args, wheel/nuget)
belongs to the `LinkArgs` contract + the host toolchain, mirroring
`maturin`'s separation.

### 2b. `wasm-bindgen` — describe → two-sided render

Architecture: a Rust crate annotated `#[wasm_bindgen]` is compiled to wasm. The
macro records an "externref"-style description of the import/export surface
into a custom wasm section. The `wasm-bindgen` CLI reads that section and
**generates the JS/TS foreign bindings** (and rewrites the wasm to remove the
shim where the host supports externref). Type mapping: Rust `&str`/`String`
↔ JS `string`; `Vec<T>` ↔ JS `Array`; `Result<T, E>` ↔ JS `throw`. Ownership:
JS owns the JS side; Rust owns the Rust side; handles cross via opaque
`JsValue` indices into a per-instance table.

**Relevance to Glue:** the "one description, render to *both* sides" model is
exactly what `[Glue]`/`[GlueImport]`/`[GlueExport]` + `Interop.Contracts`
already encode. `wasm-bindgen`'s `JsValue` table is a concrete instance of the
**host typed tag object** pattern (§7).

### 2c. `uniffi` — the closest analog (detailed in §4)

### 2d. `prost` / `tonic` — protobuf→Rust codegen pattern

`prost-build` is the canonical "IDL → Rust `TokenStream`" pipeline (see §1c).
`tonic-build` extends it: after `prost` generates message structs, `tonic`
adds a `ServiceGenerator` that emits a `trait` + client + server scaffolding per
`.proto` `service`. The seam is `prost_build::ServiceGenerator` — a **trait
with a `generate_method(&mut self, service, Method, &mut BytesMut)` hook**.
Buffer framing for `tonic` gRPC is length-prefixed HTTP/2, not stdio, but the
*codegen seam* is the lesson: **one trait, per-item hook, write to a buffer,
collect into a module**. This is a clean shape for `SymbolEmission.EmitSymbol`.

---

## 3. What a Rust crate emission pipeline must produce

### 3a. Minimal crate layout

A minimal compilable Rust crate is:

```
<crate>/
  Cargo.toml
  src/
    lib.rs    # for a lib crate (crate-type = ["cdylib"] or ["rlib"])
    main.rs   # for a binary crate (optional)
```

`Cargo.toml` requires at least `[package]` (`name`, `version`, `edition`) and,
for an FFI-exported library, `[lib]` with `crate-type = ["cdylib"]` (or
`["staticlib"]`). `src/lib.rs` is the crate root; `mod` declarations pull in
submodules. Beskid's `RustSource` backend must emit at minimum `Cargo.toml` +
`src/lib.rs` and can decompose per-symbol into `src/<mod>.rs`.

### 3b. `extern "C"` + `#[no_mangle]` for FFI export

The ABI-export idiom is:

```rust
#[unsafe(no_mangle)]   // or #[no_mangle] on older toolchains
pub extern "C" fn beskid_<symbol>(...) -> ... { ... }
```

`extern "C"` selects the platform C calling convention. `#[no_mangle]` (now
spelled `#[unsafe(no_mangle)]` under the 2024 edition's unsafe-attribute lint)
suppresses Rust symbol mangling so the linker exposes a stable name. For data
exports: `#[unsafe(no_mangle)] pub static FOO: i32 = 42;`. For re-exporting a
Rust `struct` across FFI you must give it `#[repr(C)]` (or `#[repr(C, packed)]`)
so the layout is the C layout; otherwise the layout is unspecified.

`cbindgen` reads exactly these items (`#[no_mangle] pub extern "C"` + `#[repr(C)]`
records/enums) to produce headers — confirming this is the canonical surface.
`Beskid.Glue` `SymbolEmission` must emit `#[repr(C)]` on every exported
aggregate and `#[unsafe(no_mangle)] pub extern "C"` on every exported function.

### 3c. Rust → C ABI type mapping

The mapping that `cbindgen`, `bindgen`, and `uniffi` converge on:

| Rust          | C ABI (FFI)                          | Notes |
|---------------|--------------------------------------|-------|
| `i8..i64`, `u8..u64`, `f32`, `f64` | same-width C int/float | direct |
| `bool`        | `int8_t` (0/1) or C99 `_Bool`        | `cbindgen`/`uniffi` both use 0/1 |
| `String`/`&str` | `*const u8` + `usize` len (view) **or** `RustBuffer{ptr,len,cap}` (owned) | view vs owned is an `OwnershipClass` decision — exactly what `Interop.Contracts` models |
| `Vec<T>`      | `RustBuffer{ptr: *mut T, len, cap}` (owned, Rust frees) | the `uniffi` `RustBuffer` pattern |
| `&[T]`        | `*const T` + `usize`                  | view |
| `Option<T>`   | tag byte + payload, or sentinel null for pointer types | `uniffi` serializes to a `RustBuffer` for non-pointer `T` |
| `Result<T,E>` | **out error code + return value**, or `RustBuffer`-serialized | see §4 uniffi error pattern |
| `Box<T>`/`Arc<T>` | opaque `*mut T` / `u64` handle      | handle table, see §4/§7 |
| `()` (unit)   | `void`                                | |

This is precisely the territory `Interop.Contracts` already normatizes
(`TypeShapeClass`: Scalar/OpaqueHandle/Buffer/StringLike/Never;
`OwnershipClass`: Borrow/Transfer/OpaqueBorrow; `CallShapeClass`:
Direct/ByReference/View). **The Rust ABI profile `bind()`s these — Glue must
not re-derive the table above; it must consult the profile.**

### 3d. `cbindgen` annotation model

`cbindgen` uses a mix of `cbindgen.toml` (crate-level: `language`, `include`,
`sys_includes`, `no_includes`, `style`, `pragma`) and inline doc-directives in
triple-slash comments: `/// # Cbindgen: no_alias`, `/// # Cbindgen:
prefix=...`. It also reads `#[repr(C)]`, `#[no_mangle]`, and `pub` visibility
directly from the AST. **Lesson:** keep per-symbol knobs out of the *language*
and in a *side channel* (toml + doc directives) so the source stays clean. For
Beskid, the side channel is the `[Glue]` attribute + per-symbol glue rules in
the mod package — already the design.

---

## 4. UniFFI in depth — the closest analog

Sources: `mozilla/uniffi-rs` README + user guide (Internals: lifting/lowering,
object references, bindings IR pipeline).

### 4a. Architecture

```
UDL / #[uniffi] proc-macro  →  metadata (uniffi_meta)
                            →  Rust scaffolding (in-crate, repr(C) FFI fns)
                            →  Bindings IR pipeline (general → language-specific)
                            →  foreign-language bindings (Kotlin/Swift/Python/Ruby)
```

Two-sided generation: **Rust scaffolding** (compiled *into* the user's Rust
crate, exposing `uniffi_fn_<ns>_<name>` `extern "C"` functions) and **foreign
bindings** (a separate `.kt`/`.swift`/`.py` file the consumer imports). Both
sides are generated from one metadata source. This is the shape Beskid.Glue
0.5 should mirror: `RustSource` emits the Rust scaffolding side; a future
foreign-binding generator (or `DotNetProject`) emits the consumer side.

### 4b. Type mapping — lifting/lowering + RustBuffer

UniFFI's C FFI uses only primitive ints/floats and a `RustBuffer{ptr,len,cap}`
struct. **Lowering** = language value → FFI primitive; **lifting** = FFI
primitive → language value. Scalars lower by cast. Everything non-trivial
(string, sequence, record, enum, optional, dictionary) lowers to a
`RustBuffer` containing an **ad-hoc big-endian fixed-width serialization**:
lengths as `i32` (signed, for JVM compat), ints big-endian, `Option` as
bool-tag + payload, sequences as `i32` count + items, enums as `i32` variant
index (1-based) + fields, records as field values in declaration order.
Interfaces lower to a `u64` handle (§4c).

**Relevance:** UniFFI's serialization is internal and version-locked between
the Rust scaffolding and the matching foreign binding — both sides are
generated together, so the format is never a public contract. Beskid.Glue's
`StdioBridgeMessage` payload has the **same property**: the wire format is
internal to one Glue generation, so it can be a self-describing binary format
(`postcard`/`bincode`) rather than a stable ABI. The `Interop.Contracts`
*conformance envelope* (`BESKID_RUNTIME_ABI_VERSION` +
`BESKID_USER_FFI_LAYOUT_BAND`) is the only cross-version contract, and it
governs the in-process C/Rust ABI, not the stdio payload.

### 4c. Object handles / opaque pointers

Interfaces lower to `u64` handles (`0` = invalid/null). The "arc-to-pointer
dance": constructor returns `Arc::into_raw(arc) as u64` (leaks one strong ref
to the foreign side); a generated `clone` FFI does
`Arc::increment_strong_count` and returns the same `u64`; a generated `free`
FFI does `Arc::from_raw` + drop. All objects must be `Send+Sync` (foreign
threads call in). For trait objects (`dyn Trait`, a wide pointer) UniFFI wraps
in `Arc<Arc<dyn Trait>>` to get a thin pointer, and **tags the low bit = 1** to
distinguish foreign-generated handles from Rust-generated ones (Rust raw
pointers are alignment-≥2, so the low bit is free). Foreign side typically uses
a **handle map** (`u64 → object`, keys start at 1 and increment by 2).

This is the concrete recipe for `GlueTag` (§7) and for `RustSource`'s exported
object types.

### 4d. Error handling — Result → error code + out param

UniFFI represents `Result<T, E>` across the FFI as: the scaffolding function
returns the `T` lowered form (or a sentinel for the error case) **plus** an
out-error argument and a call-status struct (`0` success, `1` error, `2`
panic). On the foreign side, a non-success status is lifted into a thrown
exception. The error type itself is serialized through the same
`RustBuffer` machinery as a tagged enum. **Lesson for Glue:** the
`InteropSignature` must model a return slot for status + an out-param for the
error payload; the Rust ABI profile's `bind()` should map `Result` to the
`(return, *mut error_out, status)` triple. Never `panic` across FFI —
`catch_unwind` at the scaffolding boundary (also what `jni-rs` does, §7).

### 4e. Async / futures

UniFFI async: a future is represented as a handle to a polling function. The
scaffolding stores the `Future` in a box, returns a handle, and exposes a
`poll` FFI (returns `Poll`-like status + buffer). The foreign side drives the
poll loop (or bridges to its own async runtime). 0.5 should treat async as
**out of scope for the in-process C ABI** but **natural over the stdio bridge**:
the stdio message protocol is request/response (and can be multiplexed by
request id), so async = "don't block the fiber waiting for a reply; park the
continuation on the reply." See §6.

### 4f. Memory ownership

Three classes map exactly to `OwnershipClass`:
- **Borrow** (`&T`, `&[T]`): foreign retains ownership; Rust must not free;
  lifetime bounded by the call.
- **Transfer** (`String`, `Vec<T>`, `Box<T>`): ownership crosses; receiver
  frees with the Rust allocator (scaffolding exposes a `_free` FFI per type).
- **OpaqueBorrow** (handle): refcount-managed via clone/free FFIs (§4c).

Every owned Rust type that crosses FFI **must** have a paired `_free` (or
`Arc` clone/free) export, or it leaks. `SymbolEmission` must emit these
destructors alongside each owned-returning symbol.

### 4g. Bindings IR pipeline (note: experimental)

UniFFI's newer pipeline is `metadata → initial IR → general IR →
language-specific IR`, with `Node`/`MapNode` traits and `#[derive(MapNode)]`
to auto-generate IR-to-IR passes, each pass carrying a `Context`. This is a
sophisticated multi-IR design. **For 0.5 Beskid does not need this** — Glue's
IR is already `CodegenInput` + `InteropSignature`s. Adopt the *idea* of a
typed, walkable node tree + a single `Context` for per-symbol rename/type-map
state, but do not import UniFFI's pipeline crate.

---

## 5. `dotscope` — .NET metadata read/write for the `DotNetProject` backend

Source: docs.rs/dotscope (v0.9.0).

### 5a. What it is

`dotscope` is a pure-Rust, cross-platform **ECMA-335 (6th ed.)** .NET PE
parser/emitter: `CilObject` is the entry point (`from_path` / `from_mem`,
configurable `ValidationConfig`). Layers: File, Metadata, Assembly (CIL
disassembly **and** assembly), Analysis (SSA/CFG/DFG/callgraph), Compiler
(SSA→CIL codegen + pass scheduling), Deobfuscation, Emulation. All public types
`Send+Sync`.

### 5b. Reading signatures (ECMA-335 blobs)

Method signatures live in the `#Blob` heap as compressed
`MethodSig`/`MethodRefSig` blobs (ECMA-335 II.23.2.1: calling convention byte,
generic param count if generic, param count, return type, param types).
`dotscope` exposes:
- `CilObject::methods()` → all methods; `assembly.imports()` / `exports()` for
  the import/export tables (`ModuleRef`, `MemberRef`, `MethodImpl`,
  `ExportedType`).
- `metadata::query::{MethodQuery, TypeQuery}` for indexed lookup.
- `assembly::decode_instruction` + `Parser` for CIL bodies; `InstructionAssembler`
  for the inverse.
- Heaps (`Strings`, `Blob`, `Guid`, `UserStrings`) with indexed `get()` + `iter()`.
- `tables()` / `TablesHeader` for raw metadata-table access with the
  `dispatch_table_type!` / `impl_table_access!` macros.

So `SignatureReader.ReadSignatures` maps to: open the assembly with
`CilObject::from_path_with_validation(path, ValidationConfig::minimal())`,
walk `methods()` / `imports()` / `exports()`, and decode each method's
`Signature` blob into Beskid's `InteropSignature` via the ECMA-335 element-type
table (ELEMENT_TYPE_VOID…VOID, I4, STRING, SZARRAY, GENERICINST, etc.).

### 5c. Writing / generating signatures and method bodies

`dotscope` is **not** read-only. It exposes:
- `CilAssembly` — "Mutable assembly for editing and modification operations."
- `MethodBuilder` and `MethodBodyBuilder` — build new methods + CIL bodies.
- `assembly::InstructionAssembler` — chained `.ldarg_0().add().ret()` builder
  returning `(bytecode, max_stack, handlers)`.
- `CleanupRequest`, `LastWriteWinsResolver`, `ChangeRefKind` — for applying
  edits to an existing assembly.

So `SignatureWriter.WriteSignatures` can: take a Beskid `InteropSignature`,
construct a `MethodBuilder` + `MethodBodyBuilder` + `InstructionAssembler`,
emit the CIL prologue/epilogue that marshals between .NET managed types and
the interop view types, write the new `MethodSig` blob, and add the row to the
appropriate table.

### 5d. Can it emit a whole .NET *project* (csproj + cs)?

**No.** `dotscope` operates at the **assembly/metadata** level — it can
produce/modify a `.dll`/`.exe` (PE + ECMA-335 metadata + CIL). It does **not**
emit C# source text, `csproj` files, or MSBuild project layout. So the
`DotNetProject` backend has **two distinct sub-paths**, and 0.5 must pick:

- **Path A — source project (`csproj` + `.cs`):** emit text (a `<Project
  Sdk="Microsoft.NET.Sdk">` csproj + C# files with `[DllImport]` externs and
  P/Invoke marshalling, or a source generator). This is the
  `maturin`-for-.NET shape. `dotscope` is **not** used here (no assembly to
  read); it's only used on the *import* side when reading an existing
  foreign .NET library's signatures. **Recommend this for 0.5 `DotNetProject`
  export**, because it composes with the normal `dotnet build` toolchain that
  `ToolchainProbe` already must discover.
- **Path B — direct assembly emission:** use `dotscope`'s `CilAssembly` +
  builders to emit a `.dll` directly, bypassing `dotnet build`. Lower friction
  at runtime but no source artifact, harder to debug, and couples Beskid to
  `dotscope`'s metadata correctness. **Use only for `SignatureWriter`
  round-trip tests**, not as the primary export.

So: **`DotNetProject` = source-project emitter (Path A) for export +
`dotscope` for `SignatureReader` (import) and `SignatureWriter` (round-trip
tests / in-place assembly patching).** This matches the 0.4 design's
"filesystem/process I/O for dotscope/rustc/dotnet is Rust" seam: `dotscope`
calls stay in the Rust host; the *project text* is emitted by the backend.

---

## 6. The stdio message-bridge pattern

### 6a. LSP base protocol — the canonical framing

LSP (microsoft/language-server-protocol, 3.17 spec) frames messages as:

```
Content-Length: <n>\r\n
Content-Type: application/vscode-jsonrpc; charset=utf-8\r\n
\r\n
< n bytes of JSON-RPC payload >
```

- Header fields are ASCII, `Name: Value`, `\r\n`-terminated, blank `\r\n` ends
  the header. **`Content-Length` is mandatory** and counts *bytes* of the
  payload, not characters.
- Payload is JSON-RPC 2.0: `Request{id, method, params}`,
  `Response{id, result|error}`, `Notification{method, params}`. Requests
  carry integer-or-string ids; responses are matched by id; notifications
  have no id and no response. `$/cancelRequest` and `$/progress` are the
  built-in control notifications.
- Ordering: responses should be returned in roughly request order, but
  parallel execution is allowed as long as correctness holds.

This `Content-Length` framing is the **right default for `StdioBridgeMessage`**
because it is trivially debuggable (text), length-prefix framing is
unambiguous over a pipe, and every LSP server in existence proves it scales.
The only change for Glue: the *payload encoding* need not be JSON-RPC.

### 6b. Binary framing — `msgpack` / `bincode` / `postcard` over stdio

When the payload is binary (Glue's `StdioBridgeMessage.payload: u8[]` is
already bytes), the pattern is: keep LSP's `Content-Length` framing for the
*envelope*, replace the JSON-RPC body with a length-prefixed binary frame:

```
Content-Length: <n>\r\n\r\n
< n bytes: [u32 BE tag_id][u32 BE msg_id][u32 BE op][u32 BE payload_len][payload bytes] >
```

- `postcard` (serde, no-std, varint, self-describing-enough, used by
  `probe-rs`/embedded) is the best default for the **inner payload** — compact,
  no header needed, serde-derive on a `StdioBridgeMessage`-equivalent enum.
- `bincode` is faster but not self-describing and fixed-width by default.
- `msgpack` adds a schema layer (good if the foreign side is dynamic-typed,
  e.g. Python/Ruby). For .NET and Rust (both typed), `postcard` is enough.
- **Framing rule:** never send raw `postcard` without a length prefix over a
  pipe — you cannot recover the message boundary. Always
  `Content-Length`-prefix (or a fixed-width `u32 BE` length) the whole frame.

Node/Deno/Bun subprocess IPC: Node uses `process.send` over a private IPC
channel (not stdio) for parent↔child; for arbitrary subprocesses over stdio
they use line-delimited JSON (`readline`) or `Content-Length` framing (the
`vscode-jsonrpc` node lib does exactly this). Deno/Bun inherit the same
patterns. **None of them invent a new framing** — `Content-Length` or
newline-delimited are the two real options, and `Content-Length` is correct
for binary payloads.

### 6c. Recommendation for Glue's stdio protocol

- **Envelope:** LSP base protocol (`Content-Length` header, ASCII, `\r\n\r\n`).
- **Frame (inside the length):** a small fixed header — `u32 BE tag_id` (which
  `GlueTag`/imported library), `u32 BE msg_id` (request id for multiplexing +
  reply matching), `u32 BE op` (call/return/error/cancel/progress), `u32 BE
  status`, `u32 BE payload_len` — then `payload_len` bytes of `postcard`-encoded
  `InteropSignature`-typed arguments/results.
- **Direction:** bidirectional on one pipe (stdout for replies/notifications
  from foreign→Beskid, stdin for calls Beskid→foreign; or one duplex pipe per
  direction — pick one and document it). Import = Beskid calls foreign (Beskid
  writes calls to child stdin, reads replies from child stdout). Export =
  foreign calls Beskid (Beskid reads calls from a peer, writes replies).
- **Async:** do not block the fiber on a single reply. Park the continuation
  keyed by `msg_id`; when the reply frame arrives, resume. This is exactly
  LSP's request/reply matching, generalized to binary.
- **Versioning:** the `ConformanceEnvelope` (`BESKID_RUNTIME_ABI_VERSION` +
  `BESKID_USER_FFI_LAYOUT_BAND`) is exchanged in a handshake frame at bridge
  startup (like LSP `initialize`). Mismatch = fail closed.
- **Why a fiber, not a thread:** the 0.4 design pins this (D-GLUE-0004) — the
  stdio bridge is a Beskid fiber so it integrates with Beskid's cooperative
  scheduler and GC, decoupling Beskid memory from foreign memory. Keep it.

---

## 7. The host typed-tag-object pattern

The pattern: a host runtime that imports a foreign library represents each
foreign value as an **opaque handle + a per-handle type tag owned by the
host**. The Beskid side holds/returns the handle but does not inspect its
layout (already the `GlueTag` contract: `i64 handle`, "opaque"). Downcasting
is safe only via the host's type registry.

### 7a. `PyO3` — `PyObject`/`Py<T>` handles

`PyO3` wraps a CPython `*mut PyObject` in `Py<T>` (an owned reference) /
`&Bound<PyAny>` (borrowed). The type tag is the CPython type object
(`PyAny::is_instance::<T>()`, `Py::<T>` is a typed strong reference). Handles
are reference-counted via the Python C-API (`Py_INCREF`/`Py_DECREF`); `Drop`
  decrements. Conversion traits (`FromPyObject`, `IntoPyObject`) are the
  lift/lower seam. `#[pymodule]`/`#[pyfunction]` macros generate the
  registration + the C shim. Errors map `Result<T, PyErr>` → Python
  exceptions (never panic across FFI; `PyO3` wraps in `catch_unwind`).

### 7b. `napi-rs` (Node-API) — `napi_value` handles

`napi-rs` wraps Node's Node-API `napi_value` (an opaque C handle to a JS
value). Type info is queried via `napi_typeof`/`napi_instanceof`; typed
wrappers (`JsObject`, `JsFunction`, `Env`) attach the `Env` (per-thread
context) to every handle so the host can downcast safely. Reference counting
via `napi_reference` for long-lived handles. `#[napi]` macro generates the
registration table. Same shape as PyO3: opaque handle + per-thread context +
typed wrapper + macro-generated shim.

### 7c. `jni-rs` — `JObject`/`JString`/`JValue` handles

`jni-rs` (docs.rs/jni) wraps raw `jobject`/`jstring`/`jclass` in
lifetime-tagged newtypes (`JObject<'local>`, `JString<'local>`, `JClass<'local>`).
The lifetime ties the local reference to the current JNI stack frame so it
auto-frees when the frame pops; `Global`/`Auto` refs escape a frame
explicitly. The `Env` (per-thread attachment to the `JavaVM`) is the
type-registry + call surface; downcast is `JObject::is_instance_of` /
`Env::get_object_class`. Native methods are `extern "system"` with a stable
mangled name (`Java_<class>_<method>`) or registered at runtime via
`Env::register_native_methods`. **Critically: `jni-rs` wraps the whole native
method body in `catch_unwind` + an `ErrorPolicy`** — never let a Rust panic
cross the FFI into the JVM. `EnvOutcome`/`Outcome` encode success/error/panic
explicitly so the policy maps them to thrown Java exceptions.

### 7d. Cross-cutting lessons for `GlueTag`

All three converge on the same design:

1. **Handle = opaque integer/pointer** the foreign/Beskid side carries
   without inspecting. (`GlueTag.handle: i64` — already this.)
2. **Per-thread/per-call context** carries the live environment (`PyO3`
   Python interpreter, `napi` `Env`, `jni` `Env`/`JavaVM`). For Glue this is
   the stdio bridge fiber's channel + the `GlueTag` registry (one tag per
   imported library — already in `StdioBridge.bd`).
3. **Lifetime-tagged wrappers** prevent use-after-free (jni `JObject<'a>`).
   Glue should tag `GlueTag` with the owning bridge/fiber lifetime in the
   Rust host model, even though the Beskid-side type is a plain `i64`.
4. **Type info lives in the host**, queried by id/class, not embedded in the
   handle bits (except UniFFI's low-bit trick for a 1-bit foreign/native
   discriminator, §4c — adopt this for `GlueTag` to distinguish
   host-created vs foreign-created tags).
5. **Never panic across the boundary.** Mirror `jni-rs`'s
   `ErrorPolicy`/`Outcome`: the host seam converts `Result` →
   `(status, error_out)` at the FFI edge and wraps the body in
   `catch_unwind`. This is the runtime side of the `Result` mapping in §4d.
6. **Macro/declaration-generated shim**, hand-written business logic.
   `PyO3`/`napi-rs`/`jni-rs` all generate the C shim from annotations; the
   user writes only the typed Rust. `Beskid.Glue` already does this:
   `[GlueImport]`/`[GlueExport]` are the annotations; the glue mod
   generates the stdio bridge shim; the host seam (Rust) dispatches.

---

## 8. Concrete architecture recommendations for 0.5

### 8.1 `RustSource` backend

- **Pipeline:** `CodegenInput → typed Rust node tree (proc_macro2::TokenStream)
  → prettyplease → String → write Cargo.toml + src/lib.rs + src/<mod>.rs**.
  Do **not** string-template. Depend on `proc-macro2`, `syn` (parsing only, for
  any host-side validation), `prettyplease` (or `quote!` + `prettyplease`).
  This is the `prost-build`/`bindgen`/`cbindgen` proven approach.
- **Emit, per `[GlueExport]` symbol:** a `#[repr(C)]` record for each exported
  aggregate, a `#[unsafe(no_mangle)] pub extern "C" fn beskid_<symbol>(...)`
  scaffolding function that lifts args from the C ABI, calls the typed Beskid
  entry, lowers the return, and a paired `beskid_<type>_free` for every
  owned/Transfer return type. Errors map to the `(return, *mut error_out,
  status)` triple (§4d).
- **Type mapping:** delegate to `beskid_abi::interop`'s Rust ABI profile
  `bind()`. Never re-derive the §3c table inside the backend.
- **`Cargo.toml`:** `[package]` (name from library identity, edition pinned by
  `ToolchainProbe`'s rustc), `[lib] crate-type = ["cdylib"]`, dependencies from
  the `LinkArgs` contract. `crate-type` chosen per `CallShapeClass`.
- **`ToolchainProbe`:** resolve `rustc`/`cargo` by the ABI-v5 kit discipline
  (exact installed-prefix discovery, hash-verified, fail-closed on
  mismatch/tamper) — reuse the same machinery as the runtime kit. 0.4's
  scaffold defines `ToolSpec`/`ResolvedTool`/`ToolchainError`; 0.5 fills
  `ResolveTool`/`ValidateTool`.
- **No new mod contract kind** (D-GLUE-0001): the backend is selected by
  `--backend rust`, dispatched via `BackendKind` enum match in the host, not
  by invoking a mod contract per symbol.

### 8.2 `DotNetProject` backend

- **Export path = source project (Path A, §5d):** emit `<lib>.csproj`
  (`<Project Sdk="Microsoft.NET.Sdk">`, `<TargetFramework>` from
  `ToolchainProbe`'s dotnet, `<AllowUnsafeBlocks>` if the marshalling needs
  it) + `.cs` files containing `[DllImport("beskid_<lib>")] extern` P/Invoke
  declarations and managed wrapper methods that marshal between .NET types
  and the interop view types (`CStringView`→`string`/`ReadOnlySpan<char>`,
  `CBuffer`→`byte[]`/`Span<byte>`, `CArrayView<T>`→`T[]`). This composes with
  the `dotnet build` toolchain `ToolchainProbe` already must discover, and
  yields debuggable artifacts.
- **Import path = `dotscope` `SignatureReader`:** open the foreign assembly
  with `CilObject::from_path_with_validation(path, ValidationConfig::minimal())`,
  walk `methods()`/`imports()`/`exports()`, decode each `MethodSig` blob per
  ECMA-335 II.23.2.1 into a Beskid `InteropSignature`. `dotscope` stays in the
  Rust host (the 0.4 "filesystem/process I/O is Rust" seam).
- **`SignatureWriter` = round-trip / patch:** use `dotscope`'s `CilAssembly` +
  `MethodBuilder` + `MethodBodyBuilder` + `InstructionAssembler` only for (a)
  round-trip tests proving read-then-write fidelity, and (b) optional in-place
  assembly patching when no source rebuild is wanted. Not the default export.
- **`ToolchainProbe`:** resolve `dotnet` SDK + the C# compiler the same way;
  fail closed on missing/mismatched SDK. `dotscope` itself is a Rust crate
  dependency of the host, not a discovered tool.

### 8.3 Stdio bridge runtime (0.5 obligation #3)

- **Envelope:** LSP base protocol (`Content-Length`, ASCII header, `\r\n\r\n`).
- **Frame:** fixed header (`u32 BE tag_id`, `u32 BE msg_id`, `u32 BE op`,
  `u32 BE status`, `u32 BE payload_len`) + `postcard` payload (serde-derive
  on a `StdioFrame` enum mirroring `StdioBridgeMessage`). Binary, length-
  prefixed, recoverable boundaries (§6).
- **Lifecycle:** a `$/initialize`-style handshake exchanging
  `ConformanceEnvelope` (`BESKID_RUNTIME_ABI_VERSION` +
  `BESKID_USER_FFI_LAYOUT_BAND`); mismatch = fail closed, close the pipe.
- **Async:** park continuations keyed by `msg_id` in the fiber; resume on
  reply frame. The bridge is a Beskid fiber (D-GLUE-0004) — keep it.
- **`GlueTag` registry:** one tag per imported library, owned by the host
  (Rust), opaque `i64` on the Beskid side. Use UniFFI's low-bit trick
  (low bit = 1 for foreign-created tags) to distinguish host vs foreign
  handles safely (§4c, §7).

### 8.4 Corelib glue runtime (obligation #4)

- Implement the runtime side of `[GlueImport]`/`[GlueExport]` in
  `Core.Glue`: the fiber that owns the `GlueTag` registry, reads
  `StdioBridgeMessage` from the channel, frames/writes to the child pipe,
  reads replies, demuxes by `msg_id`, and resumes continuations. The
  `GlueTag`/`StdioBridgeMessage` types are already declared in
  `StdioBridge.bd`/`GlueTag.bd`; 0.5 adds the *behavior*.
- Error policy mirrors `jni-rs` (§7c): the host seam converts `Result` →
  `(status, error_out)` and wraps foreign-call bodies in `catch_unwind` so a
  panic never crosses the bridge.

### 8.5 `ToolchainProbe` (obligation #5)

- Fill `ResolveTool`/`ValidateTool` for rustc, cargo, dotnet, linker,
  dotscope using the ABI-v5 kit discipline (exact installed-prefix
  discovery, hash verification, fail-closed on missing/mismatched/tampered).
  This is the gate the 0.4 scaffold declared fail-closed pending.

### 8.6 What to *avoid* (drift prevention)

- Do **not** re-derive a Rust→C ABI type table inside `RustSource`; use the
  `Interop.Contracts` Rust ABI profile `bind()` (D-GLUE-0002).
- Do **not** add a seventh mod contract kind for backends (D-GLUE-0001);
  backends are `--backend`-selected, dispatched by `BackendKind` enum.
- Do **not** use `dotscope` to emit C# source — it emits assemblies. Source
  emission is the backend's own text emitter (Path A).
- Do **not** invent a new wire format; LSP `Content-Length` + `postcard`
  payload (§6) covers binary, multiplexed, versioned.
- Do **not** string-template Rust; build a `TokenStream` and pretty-print
  (§1c/§2d). String-template Rust drifts from edition/macro changes.
- Do **not** let panics cross the bridge (§7c).

---

## 9. Source index

- UniFFI README + user guide — github.com/mozilla/uniffi-rs,
  mozilla.github.io/uniffi-rs/latest/ (Internals: lifting_and_lowering,
  object_references, bindings_ir_pipeline).
- `cbindgen` — github.com/mozilla/cbindgen (README, docs.md).
- `wasm-bindgen` — github.com/wasm-bindgen/wasm-bindgen (README).
- `maturin` — github.com/PyO3/maturin (README), maturin.rs.
- `prost-build` — docs.rs/prost-build (crate doc, `ServiceGenerator`).
- `cranelift-module` — docs.rs/cranelift-module (`Module` trait, `Linkage`).
- `dotscope` — docs.rs/dotscope (`CilObject`, `CilAssembly`, `MethodBuilder`,
  `MethodBodyBuilder`, `InstructionAssembler`, `metadata::query`).
- LSP 3.17 — microsoft.github.io/language-server-protocol (Base Protocol:
  Header Part, Content-Length, JSON-RPC framing).
- `jni-rs` — docs.rs/jni (`Env`, `JObject`/`JString`, `EnvOutcome`/`Outcome`,
  `ErrorPolicy`, `register_native_methods`, `#[jni_mangle]`).
- Beskid 0.4 — `openspec/changes/add-beskid-glue-0-4/{proposal,design,tasks,
  specs/...}`, `compiler/corelib/packages/glue/src/Core/Glue/{GlueTag,
  StdioBridge}.bd`.

## 10. Open questions for the user

1. Confirm `DotNetProject` export = **source project** (Path A) and
   `dotscope` is import-only + round-trip-test. (Path B direct assembly
   emission is available but not recommended as default.)
2. Confirm stdio payload = `postcard` (typed, no-std) vs `msgpack` (dynamic
   typed, heavier). Recommend `postcard` since both sides are typed
   (Rust/.NET); `msgpack` only if a dynamic-typed foreign target (Python/
   Ruby) is in 0.5 scope.
3. Confirm bridge direction model: one duplex pipe (calls + replies on same
   fd) vs two pipes (calls on stdin, replies on stdout). Two-pipe is simpler
   to debug and matches the LSP/`Content-Length` precedent; recommend it.
4. Should async-over-stdio (park-on-`msg_id`) be in 0.5 scope, or deferred to
   0.6 with synchronous request/response only? Recommend defer.
