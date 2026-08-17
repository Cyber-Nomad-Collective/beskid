# .NET interop from Rust: dotscope, NativeAOT, and the Beskid.Glue 0.5 DotNetProject backend

Date: 2026-08-16

Repository baseline: beskid working tree, `compiler/crates/beskid_codegen/src/backend.rs` (`DotNetProjectBackend`, 0.4 fail-closed), `compiler/crates/beskid_abi/src/interop.rs` (`Interop.Contracts` vocabulary), `compiler/corelib/packages/glue/` (seven glue contracts).

Primary sources: docs.rs/dotscope 0.9.0 (published 2026-08-15), github.com/ATRAPSLLC/dotscope README, Microsoft Learn — “Write a custom .NET runtime host”, “Native AOT deployment overview”, “Native code interop with Native AOT”, `UnmanagedCallersOnlyAttribute` reference, “Native interoperability best practices”.

This is research only. No code is changed.

## TL;DR decision

For the Beskid.Glue 0.5 `DotNetProject` backend: **emit an SDK-style `.csproj` + `.cs` sources whose foreign boundary uses `[UnmanagedCallersOnly]` exports (.NET→Rust direction) and `[LibraryImport]`/`[DllImport]` against the host `beskid_runtime` native library (Rust→.NET direction), compiled with NativeAOT (`<PublishAot>true</PublishAot>`, `dotnet publish -r <rid>`) into a self-contained native library that the Beskid host `dlopen`s.** Use **dotscope as the *reader*** (`SignatureReader` contract — decode ECMA-335 blobs from imported foreign assemblies) and as an optional *post-build validator/patcher*, **not** as the primary emitter. `dotnet` (publish) is the builder; `dotscope` is the reader. This split is already the one the repo declares.

This is “Option B/D” from the brief. Option C (emit a binary `.dll` directly via dotscope) is **not viable at v0.9** for from-scratch generation — see §1.6.

## 1. dotscope (ATRAPSLLC/dotscope v0.9)

### 1.1 What it is

Pure-Rust, cross-platform framework for **analyzing, reverse-engineering, and modifying** .NET PE executables, ECMA-335 (6th ed.) compliant. Apache-2.0. Published 2026-08-15. 214 commits, 25 stars, 3 forks. 100% documented on docs.rs. `>90%` coverage target, fuzzed (`cargo-fuzz` with a committed crash corpus). All public types `Send + Sync` (except `CilAssembly`/`MethodBuilder`, which are `!Send`/`!Sync` — single-thread editing).

Three layers:
- `CilAssemblyView` — raw, read-only, memory-mapped: PE headers, metadata streams/heaps, raw table rows.
- `CilObject` — high-level analysis: resolved methods, types, generics, imports/exports, method bodies.
- `CilAssembly` — mutable, copy-on-write editing layer on top of a `CilAssemblyView`; writes back via `to_file`/`to_memory`.

Crate root: `dotscope = "0.9"`; `use dotscope::prelude::*;`.

### 1.2 Reading ECMA-335 method signatures

```rust
use dotscope::prelude::*;
let assembly = CilObject::from_path("MyAssembly.dll".as_ref())?;
let methods = assembly.methods();            // resolved methods with type info
let imports  = assembly.imports();
let exports  = assembly.exports();
if let Some(tables) = assembly.tables() { /* raw ECMA-335 tables */ }
if let Some(strings) = assembly.strings() { /* #Strings heap */ }
```

- `MethodQuery` / `TypeQuery` (`dotscope::metadata::query`) — typed queries across the assembly.
- `SignatureParser` decodes binary signature blobs into `TypeSignature` / `SignatureMethod` / `SignaturePointer` / `SignatureArray` / `SignatureSzArray` / `CustomModifier`.
- `TypeSignature` enum (39 variants) maps 1:1 to ECMA-335 `ELEMENT_TYPE_*` — see §4.

### 1.3 Writing / generating signatures and metadata

`CilAssembly` is the editor. Heap primitives:

```rust
let mut assembly = CilAssembly::new(view);     // or ::from_path / ::from_bytes
let s  = assembly.string_add("Namespace.Foo")?;          // #Strings (UTF-8 on disk)
let us = assembly.userstring_add("literal")?;            // #US (UTF-16 + len prefix)
let b  = assembly.blob_add(&[0x00, 0x08, 0x08])?;          // #Blob (e.g. a method sig blob)
let g  = assembly.guid_add(&[0u8;16])?;                    // #GUID
```

Signature/table helpers on `CilAssembly`:

- `add_method_signature`, `add_field_signature`, `add_property_signature`, `add_typespec_signature`, `add_local_var_signature`
- `table_row_add(table_id, TableDataOwned)`, `table_row_update`, `table_row_remove` (returns a `ChangeRefRc` whose `.placeholder()` resolves to the final RID/token at write time)
- `store_method_body`, `store_field_data`, `resource_data_add`

Native PE import/export tables (relevant for P/Invoke stubs and unmanaged exports):

- `add_native_import_dll`, `add_native_import_function`, `add_native_import_function_by_ordinal`
- `add_native_export_function`, `add_native_export_function_by_ordinal`, `add_native_export_forwarder`

Output: `to_file(path)` / `to_memory()` / `to_file_with_config(.., GeneratorConfig)`.

### 1.4 `MethodBuilder` / `TypeSignature` API

`MethodBuilder` is a fluent builder that composes `MethodDefBuilder` + `MethodBodyBuilder` + signature builders and orchestrates them through `CilAssembly`:

```rust
use dotscope::prelude::*;
use dotscope::MethodBuilder;

// A managed static method with a CIL body
let tok = MethodBuilder::new("Add")
    .public().static_method()
    .parameter("a", TypeSignature::I4)
    .parameter("b", TypeSignature::I4)
    .returns(TypeSignature::I4)
    .implementation(|body| body.implementation(|asm| {
        asm.ldarg_0()?.ldarg_1()?.add()?.ret()?; Ok(())
    }))
    .build(&mut assembly)?;

// A P/Invoke-style extern stub (no IL) with a stdcall calling convention
let pinvoke = MethodBuilder::new("GetLastError")
    .public().static_method()
    .calling_convention_stdcall()
    .returns(TypeSignature::I4)
    .extern_method()                       // no IL body — implemented externally
    .build(&mut assembly)?;
```

`MethodBuilder` API surface:
- Constructors: `new(name)`, `constructor()`, `static_constructor()`, `property_getter(name, ret)`, `property_setter(name, val)`, `event_add(name, delegate)`, `event_remove(name, delegate)`.
- Access: `.public() .private() .protected() .internal()`.
- Kind: `.static_method() .virtual_method() .abstract_method() .sealed() .special_name() .rtspecial_name()`.
- Calling convention: `.calling_convention_default() .calling_convention_vararg() .calling_convention_cdecl() .calling_convention_stdcall() .calling_convention_thiscall() .calling_convention_fastcall() .explicit_this()`.
- Signature: `.returns(TypeSignature)`, `.parameter(name, TypeSignature)`.
- Body: `.implementation(|body| …)` (closure over `MethodBodyBuilder` → CIL `InstructionAssembler`), or `.extern_method()` for no-IL extern stubs.
- Terminal: `.build(&mut CilAssembly) -> Result<ChangeRefRc>`.

`TypeSignature` variants (full ECMA-335 coverage): `Void Boolean Char I1 U1 I2 U2 I4 U4 I8 U8 R4 R8 String Object I U` (primitives), `Ptr(SignaturePointer) ByRef(Box<TypeSignature>) Pinned(Box<TypeSignature>)` (indirection), `ValueType(Token) Class(Token)` (OO), `Array(SignatureArray) SzArray(SignatureSzArray)` (arrays), `GenericInst(Box<TypeSignature>, Vec<TypeSignature>)` (`List<int>`, GENERICINST=0x15), `GenericParamType(u32)` (VAR=0x13) / `GenericParamMethod(u32)` (MVAR=0x1E), `FnPtr(Box<SignatureMethod>)` (FNPTR=0x1B), `ModifiedRequired(Vec<CustomModifier>)` (CMOD_REQD=0x1F) / `ModifiedOptional(Vec<CustomModifier>)` (CMOD_OPT=0x20), plus `TypedByRef Internal Modifier Sentinel Type Boxed Field Reserved Unknown`.

### 1.5 `MemberRef` / `MethodSpec` / generic instantiations

Supported. `TypeSignature::GenericInst(Box<TypeSignature>, Vec<TypeSignature>)` decodes/encodes `ELEMENT_TYPE_GENERICINST` (0x15) — generic type instantiations (`List<int>`). `FnPtr(Box<SignatureMethod>)` covers function-pointer signatures. `Class(Token)` / `ValueType(Token)` carry the `TypeDef`/`TypeRef`/`TypeSpec` token, so `MemberRef`-style references resolve through the token system, and `MethodSpec` (generic method instantiation) is reachable via the metadata tables (`table_row_add(TableId::MethodSpec, …)`). The `add_typespec_signature` helper exists for `TypeSpec` rows used by generic instantiations.

### 1.6 Can it create a new assembly from scratch? (the critical gap)

**No — not at v0.9.** Every `CilAssembly` constructor requires an existing assembly:

- `CilAssembly::new(view: CilAssemblyView)` — wraps a view of an existing PE.
- `CilAssembly::from_path(path)` / `from_bytes(bytes)` — parse an existing PE.
- There is **no `CilAssembly::empty()` / `::new_empty()` / “create from scratch” constructor** in the public API.

`CilAssembly` is a **copy-on-write modifier** of an existing assembly. The README and crate docs describe it as “editing and modification operations”, “adding new methods, classes, and metadata to **existing** assemblies”, and “creating **modified** assemblies”. `MethodBuilder::build` adds a method to a *given* `CilAssembly`; it does not synthesize an assembly. The example `examples/injectcode.rs` is titled “Injecting new methods into existing assemblies”.

Consequence: Option C (dotscope emits a binary `.dll` directly from the compiler’s IR, no source) would require the backend to **clone a shipped template/stub assembly, inject types/methods/imports/exports into it, and write it out**. That is:
- fragile (depends on a hand-maintained template that must stay ECMA-335-valid after each injection),
- still produces CIL that needs a CLR to execute or an AOT pass to compile (NativeAOT compiles C#/*valid* IL to native; arbitrary dotscope-injected IL must survive the AOT trimmer/analyzer),
- and buys little over just emitting `.cs` and letting `dotnet` produce a verified, AOT-trimmed native lib.

### 1.7 Source emission?

**No.** dotscope emits **binary PE + metadata + CIL**, never `.cs`/`.csproj`. `to_file`/`to_memory` produce PE bytes. The `assembly::InstructionAssembler` emits CIL bytecode, not C#.

### 1.8 License and maturity

Apache-2.0, © 2025-2026 ATRAPS LLC. Responsible-use policy in the README restricts use to security research / malware analysis / education / defensive tooling — **but the license itself is OSI/Apache-2.0**, so embedding it as a dependency is license-clean; the “responsible use” clause is a policy statement, not a license term. v0.9 is days old at time of writing, small user base (25★), but well-tested for *analysis* (the deobfuscation/emulation/SSA path is the mature core). The *modification/generation* path (`CilAssembly` + `MethodBuilder`) is younger and is exactly the path Option C would lean on. For **reading** (the `SignatureReader` contract) it is a good fit; for **from-scratch generation** the maturity risk is real.

## 2. Rust → .NET interop approaches

### 2.1 nethost / hostfxr / CoreCLR hosting

A native program hosts the .NET runtime and calls a managed static method. API (from `nethost.h` / `hostfxr.h` / `coreclr_delegates.h`):

1. `get_hostfxr_path(buffer, &size, nullptr)` (nethost) — locate `hostfxr`.
2. Load `hostfxr` and resolve: `hostfxr_initialize_for_runtime_config`, `hostfxr_get_runtime_delegate`, `hostfxr_close`.
3. `hostfxr_initialize_for_runtime_config(config_path, nullptr, &cxt)` — init host context from a `.runtimeconfig.json`.
4. `hostfxr_get_runtime_delegate(cxt, hdt_load_assembly_and_get_function_pointer, &ptr)` — get the load delegate.
5. `load_assembly_and_get_function_pointer(asm_path, type_name, method_name, delegate_type_name, nullptr, &fn_ptr)` — load a managed `.dll` and get a function pointer to a **static** method.

Default managed signature (when `delegate_type_name = nullptr`):
```csharp
public delegate int ComponentEntryPoint(IntPtr args, int sizeBytes);
```
i.e. arguments are marshalled through a single pinned struct pointer. A custom assembly-qualified `delegate_type_name` yields a different signature.

Constraints (important for Beskid):
- **Only one CLR per process.** A second `hostfxr_initialize_for_runtime_config` reuses the existing runtime if compatible, else fails.
- **Framework-dependent deployments only.** Self-contained deployments are stand-alone exes; the hosting API does not target them.
- This path is *runtime-JIT*: the managed `.dll` is IL, JIT-compiled on first call. This contradicts Beskid’s AOT-only stance (see §7).

### 2.2 COM interop from Rust

`windows-rs` / `windows` crate lets Rust consume COM interfaces (including those authored in .NET). Heavy, Windows-leaning, requires COM registration / RoActivateFactory / `IInspectable`. Beskid is cross-platform and AOT-only; COM is explicitly **not supported under NativeAOT on Windows** (“Windows: No built-in COM” — Native AOT limitations). Not aligned.

### 2.3 C ABI via P/Invoke (Rust `extern "C"` ← .NET)

Rust exposes `extern "C"` functions; .NET calls them via `[LibraryImport]` (preferred on .NET 7+, source-generated) or `[DllImport]`. This is the .NET→native direction and the cleanest cross-platform boundary.

```rust
#[no_mangle]
pub extern "C" fn beskid_glue_add(a: i32, b: i32) -> i32 { a + b }
```
```csharp
internal static partial class BeskidGlue {
    [LibraryImport("beskid_glue", StringMarshalling = StringMarshalling.Utf8)]
    internal static partial int beskid_glue_add(int a, int b);
}
```

Marshalling story:
- **Blittable** (no conversion): `byte, sbyte, short, ushort, int, uint, long, ulong, float, double, nint, nuint`, unmanaged pointers, `[StructLayout(Sequential|Explicit)]` structs of blittable fields. Passed by value or pinned when passed `ref/in/out`.
- **Not blittable:** `bool` (maps to 1/2/4-byte `BOOL`), `string` (depends on `CharSet`), `object`, managed arrays.
- **Sometimes blittable:** `char` (blittable in 1-D arrays or under `CharSet.Unicode`), `string` (blittable when passed by value with `Utf16`/`LPWSTR`/`CharSet.Unicode` — pinned, not copied).
- Strings: `[LibraryImport(StringMarshalling = StringMarshalling.Utf8)]` gives UTF-8 on Unix; `Utf16` pins the `string`. Prefer passing `(byte* ptr, nuint len)` views — matches Beskid’s `CStringView`/`BeskidStr`.
- Arrays: pin via `fixed`/`GCHandle.Alloc(Pinned)`; or pass `Span<T>`/`Memory<T>` over `ref` for zero-copy.
- Callbacks: prefer `delegate* unmanaged<...>` (C# 9 function pointers) + `[UnmanagedCallersOnly]` over `Delegate`/`GetFunctionPointerForDelegate` (avoids the GC-rooting trap the best-practices doc calls out).

### 2.4 NativeAOT (the AOT-only path)

.NET compiles IL → native at **publish** time (`<PublishAot>true</PublishAot>` + `dotnet publish -r <rid> -c Release`). Output is self-contained native code, no JIT at runtime, runs without the .NET runtime installed. This is the **only** .NET deployment model that produces a dlopen-able native library with C exports.

Exports: `[UnmanagedCallersOnly(EntryPoint = "name", CallConvs = new[]{ typeof(CallConvCdecl) })]` on a `static` method emits a public C entry point. Restrictions (from the reference doc):
- must be `static`,
- only **blittable** arguments,
- no generic type parameters, not contained in a generic class,
- not callable from managed code.

Only methods marked `UnmanagedCallersOnly` **in the published assembly** are exported (project references / NuGet packages are not). See the `NativeLibrary` sample.

Reverse direction (.NET calling native) under AOT: `<DirectPInvoke Include="module" />` makes P/Invoke calls direct/bound at startup (better steady-state perf, allows static linking); `<NativeLibrary Include="file.lib|.a" />` statically links a native lib; `<DirectPInvoke Include="__Internal" />` replicates Mono-AOT “direct calls into the same image”. This is how a NativeAOT glue lib would call back into the Beskid host when statically linked, or via `[LibraryImport("beskid_runtime", …)]` when dynamically linked.

NativeAOT limitations to plan around: no `Assembly.LoadFile`, no `Reflection.Emit`, no C++/CLI, no built-in Windows COM, trimming required (so the emitted C# must be trim/AOT-compatible — avoid reflection-heavy patterns), single-file, larger binary, pre-generated generic instantiations.

## 3. .NET → Rust interop approaches

The boundary is symmetric to §2.3/§2.4 — same C ABI — but the marshalling *intent* differs by direction.

- `[DllImport("beskid_glue")]` / `[LibraryImport("beskid_glue", StringMarshalling = …)]` P/Invoke into the Rust `extern "C"` surface. Blittable scalars pass directly; `bool` is a 4-byte `BOOL` by default (use `[MarshalAs(U1)] bool` or `byte` for a 1-byte C `_Bool`).
- String out: `Marshal.StringToHGlobalAnsi` / `Marshal.StringToCoTaskMemUTF8` → Rust copies into `String`, .NET frees (`Marshal.FreeHGlobal`/`FreeCoTaskMem`). This is a **Borrow on the .NET side, copy on the Rust side**.
- String in: pass `(byte* ptr, nuint len)` view; Rust lends the `BeskidStr`/`CStringView`; .NET constructs `string` from the span. **Borrow**.
- Arrays: `int[]` is not blittable to `*mut i32` without pinning (`fixed` block or `GCHandle.Alloc(Pinned)`); or pass `Span<T>`/`Memory<T>` (`ref` + `ref` for `Memory<T>`’s managed/lifetime pair). **Borrow** while pinned.
- Function pointers: `delegate* unmanaged<T1,T2,Ret>` in C# 9 — direct C function pointer, no delegate allocation, no GC rooting trap. For .NET→Rust callbacks: Rust passes a `extern "C"` fn pointer; .NET stores it as `delegate* unmanaged<…>` and calls it. For Rust→.NET callbacks: .NET marks the callback `static` with `[UnmanagedCallersOnly]` and Rust takes its address (exported C symbol).

## 4. ECMA-335 method-signature blob format

Layout: `calling_conv_byte | compressed_int(param_count) | return_type_blob | param_type_blob*`.

Calling-convention flags (bitwise OR of):
- `0x00` DEFAULT, `0x05` VARARG, `0x10` GENERIC (generic method — `param_count` is the generic arity), `0x20` HASTHIS, `0x80` EXPLICITTHIS`.

Element types:
- `0x01` VOID, `0x02` BOOLEAN, `0x03` CHAR, `0x04` I1, `0x05` U1, `0x06` I2, `0x07` U2, `0x08` I4, `0x09` U4, `0x0A` I8, `0x0B` U8, `0x0C` R4, `0x0D` R8, `0x0E` STRING, `0x1C` OBJECT.
- `0x0F` PTR (`T*`), `0x10` BYREF (`ref T`), `0x45` PINNED.
- `0x11` VALUETYPE (token), `0x12` CLASS (token).
- `0x13` VAR (type generic param, index), `0x1E` MVAR (method generic param, index).
- `0x14` ARRAY (multi-dim), `0x1D` SZARRAY (1-D 0-based), `0x15` GENERICINST (`generic_def, arg_count, type_arg*` — mangled).
- `0x1B` FNPTR (method signature), `0x16` TYPEDBYREF, `0x18` I (`IntPtr`), `0x19` U (`UIntPtr`), `0x1F` CMOD_REQD, `0x20` CMOD_OPT, `0x41` SENTINEL (vararg separator), `0x21` INTERNAL.

A `List<int>.Add(int)` method sig is roughly: `0x20|0x00` (HASTHIS|DEFAULT) `0x01` (1 param) `0x01` (VOID ret) `0x15 0x12 <List token> 0x01 0x08` (GENERICINST CLASS List<> [I4]) `0x08` (I4 param) — the generic instantiation is the receiver type.

dotscope decodes via `SignatureParser` → `TypeSignature`/`SignatureMethod` and encodes via the `CilAssembly::add_*_signature` helpers + heap writes. `TypeSignature::GenericInst(Box<TypeSignature>, Vec<TypeSignature>)` is the Rust shape for `0x15`; `FnPtr(Box<SignatureMethod>)` for `0x1B`; `Class(Token)`/`ValueType(Token)` carry the `0x12`/`0x11` token.

## 5. .NET project emission — what a minimal class library needs

- **`.csproj`** (SDK-style):
  ```xml
  <Project Sdk="Microsoft.NET.Sdk">
    <PropertyGroup>
      <TargetFramework>net8.0</TargetFramework>
      <PublishAot>true</PublishAot>            <!-- NativeAOT -->
      <IsAotCompatible>true</IsAotCompatible>
      <InvariantGlobalization>true</InvariantGlobalization>
    </PropertyGroup>
  </Project>
  ```
- **`.cs`** sources: `namespace`, `internal static partial class`, `[LibraryImport("beskid_runtime", …)]` for Rust→.NET calls, `[UnmanagedCallersOnly(EntryPoint="beskid_glue_…", CallConvs=new[]{typeof(CallConvCdecl)})]` for .NET→Rust exports.
- Compile: `dotnet publish -r <rid> -c Release` → a native lib (`beskid_glue.<rid>.dll`/`.so`/`.dylib`) with C exports, dlopen-able. No `.runtimeconfig.json` needed for the AOT lib (it’s self-contained).

Can a generator emit `.csproj + .cs` that compiles to a `.dll` Rust loads via hostfxr? **Yes** — that’s Option A (JIT, framework-dependent, one-CLR-per-process). Can it emit a `.dll` Rust `dlopen`s directly? **Yes** — that’s Option B/D (NativeAOT). The latter is the AOT-only, native-direction match.

## 6. String / ownership semantics at the Rust↔.NET boundary

Mapped to the repo’s `Interop.Contracts` ownership classes (`beskid_abi/src/interop.rs:90-98`):

| Direction | Type-shape | Marshalling | Ownership class |
|---|---|---|---|
| Rust `String` → .NET | `StringLike` | pass `(ptr, len)` UTF-8 view; .NET builds `string` | **Borrow** (caller retains; callee copies) |
| .NET `string` → Rust | `StringLike` | .NET `Marshal.StringToHGlobalUTF8`/`CoTaskMemUTF8`; Rust copies to `String`; .NET frees | **Borrow** (.NET owns, lends; Rust copies) — or **Transfer** if .NET hands the allocation and Rust frees with the matching allocator |
| `byte[]`/`int[]` → Rust | `Buffer` | pin (`fixed`/`GCHandle.Pinned`); Rust reads/writes in place | **Borrow** (pinned for the call) |
| Rust `&[T]` → .NET | `Buffer` | pass `(ptr, len)`; .NET wraps `Span<T>` (no copy) or copies | **Borrow** |
| Opaque lib handle | `OpaqueHandle` | `i64`/`nint` token | **OpaqueBorrow** — exactly `GlueTag { i64 handle }` (`GlueTag.bd:5-7`) |
| Ownership handoff (e.g. Rust gives .NET a boxed value to free) | `Buffer`/`StringLike` | `Transfer` requires `Direct` or `View` call-shape (enforced by `c_profile.rs:81-85`) | **Transfer** |

Allocator discipline (from best-practices doc): never mix `malloc/free` with `CoTaskMemAlloc/Free` or `Marshal.FreeHGlobal`; match the producing side’s free function. For a Rust-owned string handed to .NET, the safest contract is **Borrow**: Rust keeps the `String`, passes `(ptr, len)`, .NET copies. For a .NET-produced string handed to Rust, .NET marshals to HGlobal UTF-8, Rust copies, .NET frees — **Borrow** both ways, no cross-allocator frees. `Span<T>`/`Memory<T>` give zero-copy array passing under pinning.

## 7. Recommended architecture for the DotNetProject backend

### 7.1 The four options

- **A.** Emit `.csproj`+`.cs` with `[DllImport]` for Rust↔.NET; `dotnet build`; load via hostfxr (JIT). ✗ runtime CLR dependency, one-CLR-per-process, JIT — contradicts AOT-only.
- **B.** Emit `.csproj`+`.cs` with `[UnmanagedCallersOnly]` exports; NativeAOT; `dlopen`. ✓ AOT, native lib, no runtime dependency.
- **C.** Use dotscope to emit a binary `.dll` directly; `dlopen`. ✗ dotscope v0.9 cannot create an assembly from scratch (§1.6); CIL still needs a CLR or an AOT pass; fragile template-clone-and-inject.
- **D.** Emit `.csproj`+`.cs`; `dotnet publish /p:PublishAot=true`; `dlopen` the native lib. ✓ Same as B (B is the project shape of D).

### 7.2 Recommendation: B/D, with dotscope as reader/validator

Emit SDK-style `.csproj` + `.cs` and build with NativeAOT to a self-contained native library the host `dlopen`s. The boundary is the C ABI profile the repo already defines.

Concrete shape:

```csharp
// Beskid.Glue.<mod>.cs
using System.Runtime.InteropServices;
using System.Runtime.CompilerServices;

internal static partial class BeskidGlue {
    // Rust → .NET: the host calls these exported C entry points.
    [UnmanagedCallersOnly(EntryPoint = "beskid_glue_mod_init",
                          CallConvs = new[] { typeof(CallConvCdecl) })]
    public static nint ModInit(nint ctxHandle) { /* … */ return 0; }

    // .NET → Rust: call back into the beskid_runtime native lib.
    [LibraryImport("beskid_runtime", StringMarshalling = StringMarshalling.Utf8)]
    private static partial nint beskid_rt_v5_dispatch(nint tag, byte* msgPtr, nuint msgLen);
}
```

Why this is the right call, grounded in repo facts:

1. **AOT-only, native direction (AGENTS.md).** NativeAOT is the only .NET model that yields a dlopen-able native library with C exports and no runtime CLR. `[UnmanagedCallersOnly]` exports + `[LibraryImport]` imports sit entirely on the C ABI, which is exactly the surface `c_profile.rs` already permits (`I8/U8/I32/I64/F64` scalars, `OpaqueHandle`, `Buffer`→`CBuffer`, `StringLike`→`CStringView`).
2. **The repo already splits `dotnet` (build) from `dotscope` (read).** `ToolCapability::{Rustc, Cargo, Dotnet, Linker, Dotscope}` (`toolchain.rs:23-34`) — `Dotnet` is the builder capability, `Dotscope` is the reader capability. The `SignatureReader` contract doc literally states: “For .NET, the glue mod uses dotscope to read ECMA-335 method/type signature blobs” (`SignatureReader.bd:2-3`). So the architecture already names dotscope as the reader and `dotnet` as the publisher — not dotscope as the emitter.
3. **`OwnershipClass` maps cleanly to NativeAOT marshalling** (§6): `Borrow` = pinned/views, `Transfer` = by-value/copy, `OpaqueBorrow` = `GlueTag`’s `i64 handle`. The C profile already enforces `Transfer ⇒ Direct|View` (`c_profile.rs:81-85`), which is the NativeAOT blittable rule in vocabulary form.
4. **`GlueTag { i64 handle }` is blittable under AOT** — an `nint`/`IntPtr` crosses the boundary with no marshalling; this is the `OpaqueHandle`/`OpaqueBorrow` pair the runtime profile already binds (`rust_profile.rs:47`).
5. **Option C fails on dotscope v0.9 maturity.** No from-scratch constructor (§1.6); the modification/generation path is the *young* part of dotscope, and the output still needs a CLR or an AOT pass — so it buys nothing over `.cs` emission and adds a template-clone-and-inject maintenance burden. Keep dotscope for `SignatureReader` (decoding blobs from imported assemblies) and optionally as a post-build **validator** (`CilObject::from_path` on the emitted/published lib to assert the metadata/export tables match the `InteropSignature`s the backend declared) or a **patcher** (`CilAssembly::add_native_export_function` to fix up the PE export table if NativeAOT’s emitted exports need renaming) — both are low-risk, read-only-or-additive uses of a mature path.

### 7.3 Pipeline (0.5)

1. **TypeMapping** — map Beskid surface types → `Interop.Contracts` `TypeShape` (existing `beskid_abi::interop`). For .NET, lower each `TypeShape` to a blittable C# type via the C profile binding (`c_profile.rs:50-69`): `Scalar`→`nint/int/long/byte/double`, `OpaqueHandle`→`nint`, `Buffer`→`(byte* ptr, nuint len)` view struct, `StringLike`→`CStringView`/`sbyte* + nuint`, `Never`→trap/`[DoesNotReturn]`.
2. **SymbolEmission** — emit `.cs` with `[UnmanagedCallersOnly(EntryPoint="beskid_glue_<sym>")]` exports (one per `GlueExport`) and `[LibraryImport("beskid_runtime", …)]` imports (one per `GlueImport`). Symbol naming follows the existing `beskid_rt_v5_*` discipline for runtime calls and a `beskid_glue_<mod>_<sym>` scheme for exports.
3. **LinkArgs** — emit the `.csproj` (`<PublishAot>true</PublishAot>`, `<TargetFramework>net8.0</TargetFramework>`, `<IsAotCompatible>true</IsAotCompatible>`) plus `<DirectPInvoke Include="beskid_runtime" />` / `<NativeLibrary Include="…beskid_runtime.a|.lib" />` if statically linking into the host, else dynamic `dlopen` after publish. RID maps from the existing `runtime_manifest.bsol` target set.
4. **ToolchainProbe** — resolve and validate `dotnet` (`ToolCapability::Dotnet`, minimum SDK ≥ 8.0, exact version pinned via `expected_sha256`) before publish; fail closed per the existing `ResolvedTool::satisfies` gate (`toolchain.rs:73-97`).
5. **SignatureReader** — for each imported foreign `.dll`, `CilObject::from_path` + `MethodQuery`/`TypeQuery` to decode the ECMA-335 method/type signatures into `InteropSignature`s (dotscope). This is the dotscope primary use.
6. **SignatureWriter** — encode the `InteropSignature`s the backend *declares* into ECMA-335 blobs (dotscope `add_method_signature`/`add_field_signature`) for the validator side, OR emit the corresponding C# `[LibraryImport]`/`[UnmanagedCallersOnly]` signatures into the `.cs` (the actual wire path is the C# source; the ECMA-335 blob encoding is for the post-build validator/round-trip check).
7. **StdioBridge** — the stdio message-bridge fiber; under AOT it’s a managed fiber compiled into the same native lib, talking to the host via the existing `beskid_rt_v5_dispatch`-style C entry point.

### 7.4 Risks and mitigations

- **NativeAOT trimming/reflection constraints** — the emitted C# must be trim-clean; avoid `Type.GetMethod(string)`/`Activator.CreateInstance` patterns. The `TypeMapping` emitter must lower to *static* blittable code, not reflection-driven dispatch.
- **`bool` marshalling** — pass as `byte` (1-byte) not C# `bool` (4-byte `BOOL`) at the boundary; or disable runtime marshalling (`<DisableRuntimeMarshalling>true</DisableRuntimeMarshalling>`) so `bool` is a 1-byte value (best-practices doc). The C profile currently permits `I8/U8` but not `bool` as a scalar — consistent.
- **Cross-allocator frees** — keep strings/arrays as **Borrow** views on both sides (§6); never let one side free an allocation from the other’s allocator. `Transfer` is reserved for by-value blittable scalars and explicit view handoff (`c_profile.rs:81-85`).
- **One-CLR-per-process (hostfxr)** — only relevant if Option A is ever needed; the B/D path avoids the CLR entirely, so this constraint does not apply.
- **dotscope v0.9 generation-path maturity** — by using dotscope only for reading (`SignatureReader`) and additive patching/validation, the backend depends on the mature analysis path, not the young from-scratch generation path.

## 8. Open questions for the user

1. **Linkage**: should the NativeAOT glue lib be **statically linked** into the Beskid host image (`<NativeLibrary>` + `<DirectPInvoke Include="beskid_runtime">`), or **dynamically loaded** (`dlopen` after `dotnet publish`)? Static matches the runtime-kit single-image discipline; dynamic matches the `GlueTag`-per-library model.
2. **Runtime dependency policy**: NativeAOT is self-contained (bundles a trimmed CoreCLR). Is shipping a trimmed runtime inside each glue native lib acceptable, or must glue libs share a single AOT runtime image? (Affects whether per-mod publish is viable or a single consolidated glue lib is required.)
3. **`SignatureWriter` scope**: is ECMA-335 blob encoding required as a first-class 0.5 output (e.g. for a dotscope-patched binary), or is emitting C# `[LibraryImport]`/`[UnmanagedCallersOnly]` source sufficient and the ECMA-335 encoding is validator-only?
4. **`bool`/`char` at the boundary**: confirm the C profile should stay restricted to `I8/U8/I32/I64/F64` + views (no `bool`/`char`), which keeps NativeAOT `<DisableRuntimeMarshalling>` clean.

## 9. Sources

- dotscope 0.9.0 crate docs — https://docs.rs/dotscope/0.9.0/dotscope/ (crate root, `CilAssembly`, `MethodBuilder`, `TypeSignature`)
- dotscope README — https://github.com/ATRAPSLLC/dotscope
- Microsoft Learn, “Write a custom .NET runtime host” — https://learn.microsoft.com/en-us/dotnet/core/tutorials/netcore-hosting
- Microsoft Learn, “Native AOT deployment overview” — https://learn.microsoft.com/en-us/dotnet/core/deploying/native-aot/
- Microsoft Learn, “Native code interop with Native AOT” — https://learn.microsoft.com/en-us/dotnet/core/deploying/native-aot/interop
- Microsoft Learn, `UnmanagedCallersOnlyAttribute` reference — https://learn.microsoft.com/en-us/dotnet/api/system.runtime.interopservices.unmanagedcallersonlyattribute
- Microsoft Learn, “Native interoperability best practices” — https://learn.microsoft.com/en-us/dotnet/standard/native-interop/best-practices
- ECMA-335, 6th ed. — https://ecma-international.org/wp-content/uploads/ECMA-335_6th_edition_june_2012.pdf
- Repo: `compiler/crates/beskid_codegen/src/backend.rs`, `compiler/crates/beskid_abi/src/interop.rs`, `…/interop/c_profile.rs`, `…/interop/rust_profile.rs`, `…/toolchain.rs`, `compiler/corelib/packages/glue/` (contracts + `GlueTag`).
