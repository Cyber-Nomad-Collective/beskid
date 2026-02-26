---
description: Beskid execution implementation plan
---
# Beskid execution implementation plan

## Status snapshot

| Phase | Status | Notes |
| --- | --- | --- |
| Phase 0 | done | Workspace and Cranelift crates present. |
| Phase 1 | done (minor cleanup) | HIR, resolution, normalization, diagnostics in place. |
| Phase 2 | done (minor cleanup) | Type system + cast intents in place. |
| Phase 3 | done | CLIF lowering covers aggregates, match, literals, and ABI. |
| Phase 4 | done | JIT module layer + runtime symbol plumbing wired. |
| Phase 5 | done (docs update) | Runtime allocator + GC scaffolding wired; interop builtins and runtime guards covered by tests. |
| Phase 6 | planned | AOT object output. |

## Guiding constraints

- We are based on Cranelift, so aggregates live in memory and are passed by pointer.
- Runtime is required before heap-allocated structs/enums can be lowered.
- Runtime builtins should be exported as host symbols and wired via `JITBuilder`.
- Keep the ABI stable: primitives by value, aggregates by pointer.

---

## Phase 0 - Baseline scaffolding (done)

**Goal:** prepare crate structure and dependencies.

**Completed**
- `beskid_codegen`, `beskid_runtime`, `beskid_engine` crates exist.
- Cranelift frontend/module/jit/object/native dependencies wired.

---

## Phase 1 - HIR implementation (done; cleanup only)

**Goal:** produce HIR and route analysis to it.

**Completed**
- HIR families + normalization + validation wired.
- Resolver + module graph + resolution tables in place.
- Diagnostics and tests cover core resolution edge cases.

**Remaining (optional cleanup)**
- Finalize `use`/`mod` edge-case semantics and add tests (nested module path cases added; continue tightening).

---

## Phase 2 - Type system (done; cleanup only)

**Goal:** deterministic typing with cast intent tracking.

**Completed**
- `TypeId`/`TypeTable`, `TypeContext` and typed expression/statement passes.
- Struct/enum/member/match typing and cast-intent normalization.

**Remaining (optional cleanup)**
- Improve named-type rendering in diagnostics (TypeResult mapping added; diagnostics still emit type IDs).

---

## Phase 2.5 - Generics (planned)

**Goal:** add single-level generics with explicit type arguments and monomorphized codegen.

**Spec (v0.1)**
- Generics allowed on **functions**, **types**, and **enums** (methods later).
- Usage requires **explicit type arguments** (no inference yet).
- **Single-level** only (`Option<i32>` ok, `Option<Result<i32, string>>` not yet).
- Design keeps room for future **contract bounds** (`T: Contract`).
- Codegen uses **monomorphization**: specialize per concrete type-arg list.

**Plan**
1. **Type representation**
   - Extend `TypeInfo` with `GenericParam` and `Applied` forms.
   - Add a substitution helper for generic -> concrete mapping.
2. **Resolver generic scope**
   - Maintain a generic parameter scope stack (similar to locals).
   - Resolve `T` in type paths to generic params when in scope.
3. **Type paths with type arguments**
   - Add type-arg lists on path segments in AST/HIR.
4. **Type checking**
   - Build explicit substitutions for generic items; no inference.
   - Type arguments produce `Applied` types in the type table.
5. **Monomorphized codegen**
   - Emit unique symbol keys per instantiation (e.g. `Foo#i32`).
   - Cache specialized functions/types to avoid duplicate compilation.
6. **Tests**
   - `id<T>(x: T)` and `Option<T>` basic use.
   - Explicit instantiation `id<i32>(1)`.

---

## Phase 3 - CLIF lowering (done)

**Goal:** HIR -> CLIF lowering for the execution pipeline.

**Completed**
- Core lowering pipeline + cast-intent enforcement + verification.
- Arithmetic, unary, comparisons, if/while, and call paths partially expanded.
- Normalization for `for` -> `while` moved into HIR.
- Heap-backed aggregates (struct/enum), member access, match lowering.
- Function parameters + aggregate ABI (primitives by value, aggregates by pointer).
- String/char literal lowering (`str_new` for strings, `iconst` for chars).

**Remaining**
- Expand runtime interop hooks for `str_len`, `array_new`, and `panic`. **(done: std builtin resolution + JIT tests)**

**Concrete task list**
1. **Layout helpers + descriptor usage (codegen)**
   - Add helper in `beskid_codegen/src/lowering/descriptor.rs` to expose header size, field offsets,
     enum tag offset, payload alignment, and pointer offsets.
   - Extend `CodegenContext` with cached layout accessors where needed.
2. **Struct literal lowering** (`lowering/expressions/struct_literal_expression.rs`)
   - Emit `alloc(size, desc_ptr)`.
   - Store each field at computed offsets.
   - Emit write-barrier stub for pointer fields.
3. **Enum constructor lowering** (`lowering/expressions/enum_constructor_expression.rs`)
   - Emit `alloc(size, desc_ptr)`.
   - Store tag (`i32`) at payload offset 0.
   - Store variant fields at computed offsets.
   - Emit write-barrier stub for pointer fields.
4. **Member access lowering** (`lowering/expressions/member_expression.rs`)
   - Compute field offset from layout and emit `load` from object pointer.
5. **Match lowering** (`lowering/expressions/match_expression.rs`)
   - Load tag, branch to variant blocks, bind pattern fields, emit arm bodies.
6. **Function parameters + ABI** (`lowering/function.rs`, `lowering/types.rs`)
   - Map primitive params by value, aggregates by pointer.
   - Define how `ref/out` modifiers are handled (reject or lower).
7. **String/char literal lowering** (`lowering/expressions/literal.rs`)
   - `string` → data object + `str_new(ptr, len)`.
   - `char` → `iconst` of Unicode scalar.
8. **Interop builtins**
   - Ensure `alloc`, `str_new`, `str_len`, `array_new`, `panic` are declared/imported in CLIF calls.

---

## Phase 4 - Module layer + JIT (done)

**Goal:** execute code in-process with a proper module and runtime symbol table.

**Completed**
1. **JIT module bootstrap** (`beskid_engine/src/jit_module.rs`)
   - Owns `JITBuilder`, `JITModule`, and compilation context.
   - Uses `cranelift_module::default_libcall_names()`.
2. **Runtime symbol registration**
   - Registers `alloc`, `str_new`, `gc_write_barrier` with `JITBuilder::symbol`.
   - Maintains a symbol map for imported functions.
3. **Data object emission**
   - Calls `beskid_codegen::emit_type_descriptors` to create descriptor data objects.
4. **Module declarations + definitions**
   - Declares user functions + runtime builtins via `Module::declare_function`.
   - Defines each `Function` and finalizes definitions.
5. **Execution harness**
   - `Engine` exposes `compile_artifact` and `entrypoint_ptr` (wrapped in arena scope).

**Remaining (MVP Improvements)**
- Add IR verification (`cranelift_codegen::verify_function`) before module finalization to prevent opaque panics on invalid lowering.
- Add dynamic signature validation before unsafely transmuting the entrypoint pointer.
- Replace `CallConv::SystemV` with `isa.default_call_conv()` for cross-platform compatibility.

**Deferred (Post-MVP)**
- Configurable JIT optimization flags (e.g., `opt_level="speed"`).
- Thread-safe JIT instances (concurrent execution via multi-threaded GC mutation state).
- Incremental compilation and REPL support.

**Acceptance criteria**
- `beskid_engine` can compile functions and resolve an entrypoint pointer.
- Runtime builtins are registered and visible to the JIT module.

---

## Phase 5 - Runtime + GC scaffolding (in progress)

**Goal:** ship a minimal runtime that enables heap-allocated aggregates and GC hooks.

**Completed**
1. **Allocator builtin**
   - `alloc` implemented via `gc-arena` and wired to JIT.
2. **Mutation plumbing**
   - Engine wraps JIT calls with `Arena::mutate` and sets TLS mutation/root.
3. **Write barrier stub**
   - `gc_write_barrier` in runtime + lowering hook on pointer stores.
4. **Descriptor wiring**
   - Type descriptor data objects emitted and referenced from lowering.

**Remaining plan**
1. **Runtime ABI lock**
   - Confirm layout: header `type_desc_ptr` + payload. **(done: descriptor ABI tests)**
   - Confirm enum tag at payload offset 0 (`i32`). **(done: descriptor ABI tests)**
2. **Type descriptor data**
   - Ensure `TypeDescriptorData` emitted in `beskid_codegen` and wired into JIT data objects. **(done)**
   - Validate pointer offsets logic for structs/enums. **(done: descriptor tests)**
3. **Allocator builtin**
   - Ensure allocation happens under TLS mutation guard (verify). **(done: runtime guard tests)**
4. **Root handles + write barrier**
   - `gc_root_handle` / `gc_unroot_handle` backed by runtime root state. **(done: runtime guard tests)**
   - `gc_write_barrier` stub called on heap pointer stores. **(done: lowering + guard tests)**
5. **Mutation plumbing**
   - Ensure all host entrypoints route through the engine wrapper. **(done: JIT tests run via Engine arena)**
6. **Symbol exposure**
   - Register remaining builtins (`str_len`, `array_new`, `panic`, root handle helpers). **(done)**
7. **Lowering integration checkpoint**
   - Add lowering calls to remaining builtins where needed. **(done: std builtin JIT tests)**

**Acceptance criteria**
- JIT can allocate a struct/enum using `alloc` and return a field value. **(done: runtime::jit tests)**
- Builtins are visible in the JIT symbol table. **(done: std builtin JIT tests)**
- GC hooks are present (even if stubs), including root handle calls. **(done: runtime guard tests)**

---

## Phase 6 - AOT support (planned)

**Goal:** emit native standalone executables and shared/static libraries via a dedicated AOT pipeline.

**Plan**
1. **`beskid_aot` scaffolding**
   - Create a new `beskid_aot` crate to handle the AOT build pipeline.
   - Implement `BeskidObjectModule` (similar to `BeskidJitModule` but wrapping `cranelift_object::ObjectModule`).
2. **Object Emission**
   - Consume `CodegenArtifact` and emit an unlinked `.o` / `.obj` file.
   - Ensure type descriptors and string literals are correctly emitted as data sections.
3. **Runtime Builtin Preparation**
   - Refactor `beskid_runtime` builtins (like `alloc`, `gc_write_barrier`) to use `#[no_mangle] pub extern "C"` so the linker can find them.
   - Implement an AOT `main` shim in `beskid_runtime` that initializes the GC `Arena` and calls the compiled Beskid entrypoint (for executables).
4. **On-the-fly Runtime Compilation (MVP)**
   - Have `beskid_aot` generate a temporary `Cargo.toml` to compile `beskid_runtime` into a static library (`libbeskid_runtime.a`) using the host's Rust toolchain.
5. **System Linking**
   - Add the `cc` crate as a dependency to `beskid_aot`.
   - Use `cc::Build::new().get_compiler()` to orchestrate the system C compiler (`gcc`, `clang`, `cl.exe`).
   - Link `output.o` and `libbeskid_runtime.a` into the final target (Executable, `.a`, or `.so`/`.dylib`).

**Acceptance criteria**
- `beskid build --lib` produces a `.a` or `.so`/`.dylib` exposing explicitly exported functions.
- `beskid build --exe` produces a standalone executable that runs successfully and calls the runtime `main` shim.
- Runtime builtins resolve correctly at link time without undefined symbol errors.

---

## Cross-cutting integration touchpoints

- **CLI**: `run` (JIT) and `build` (AOT) commands.
- **Testing**: runtime/engine smoke tests now cover interop builtins, alloc, and guards.
- **Docs**: keep runtime ABI + layout assumptions in sync with implementation (descriptor ABI tests added).
