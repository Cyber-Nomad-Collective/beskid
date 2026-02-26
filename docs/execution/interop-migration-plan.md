# Standard Library Interop Migration Plan

This document outlines the step-by-step technical plan to replace the current direct builtin mappings with an Enum Dispatcher interop architecture.

Project manifests referenced in this plan use `Project.proj` (HCL syntax).

## 1. Architectural Overview

### Current State
Language/runtime execution paths are now ABI-oriented: internal hooks and interop dispatch builtins are the only compiler/runtime-level contract. Public `std` wrappers live in the standalone `standard_library` Beskid project.

### Target State
- **Internal Builtins**: Kept directly in Cranelift. Limited strictly to memory/codegen hooks (`__alloc`, `__gc_write_barrier`, etc.).
- **Interop Builtins**: A handful of `__interop_dispatch_<return_type>` functions registered in Cranelift.
- **Stdlib Source of Truth**: Public wrappers come from `standard_library` project sources (`Project.proj` + `Src/*.bd`).
- **Interop Source Generation**: `pekan_cli interop` generates dispatch wrapper source (`Interop.generated.bd`) consumed by stdlib sources.
- **Project System Alignment**: `Std` project is resolved through normal dependency edges in the Daggy project DAG.
- **Build Workflow Alignment**: Build/run resolve and materialize dependency source trees into `obj/beskid` before compile phases.
- **Lockfile Alignment**: `Project.lock` is created/updated automatically during resolve/build/run lifecycle.
- **Rust Dispatcher**: A generated Rust FFI function that decodes the `StdInterop` enum pointer, reads the payload based on the `tag`, and calls the respective Rust function.

---

## 2. Step-by-Step Implementation Plan

### Phase 1: Separation of Internal Builtins
1. **Refactor `builtins.rs`**: 
   - Separate `BUILTINS` into strictly internal hooks (`__alloc`, `__str_new`, `__array_new`, `__gc_write_barrier`, `__gc_root_handle`, etc.).
   - Temporarily leave the existing `Std` wrappers until Phase 5 to keep tests passing during the transition.
2. **Define Dispatcher Signatures**:
   - Add new builtin specs for the dispatchers, grouped by return type.
   - Example: `__interop_dispatch_unit(ptr) -> unit`, `__interop_dispatch_ptr(ptr) -> ptr`, `__interop_dispatch_usize(ptr) -> usize`.

### Phase 2: Define the Interop Data Structures (Manual MVP)
Before introducing advanced generation, implement interop schema manually to validate layout and runtime decoding.
1. **Define `StdInterop` in stdlib source**:
   - Author enum and wrappers in `standard_library/Src/*.bd`.
   - Example:
     ```beskid
     enum StdInterop {
         IoPrint(String text),
         IoPrintln(String text),
         StringLen(String text),
     }
     ```
   - Wrapper modules call `__interop_dispatch_*`. Example:
     ```beskid
     mod Std {
        mod IO {
            Unit Println(text: String) {
                __interop_dispatch_unit(StdInterop::IoPrintln(text));
            }
        }
     }
     ```

### Phase 3: Project-based Stdlib Integration (No Prelude Injection)
1. **Resolver / AST Input Scope**:
   - Compiler consumes user/project-resolved source only.
   - No embedded stdlib prelude is injected into runtime pipeline.
2. **Std Dependency Resolution**:
   - Add `Std` as a regular dependency in `Project.proj`.
   - Resolve `Std` through Daggy graph and materialize to `obj/beskid/deps/src`.
   - Keep lock sync (`Project.lock`) as part of resolve/build/run lifecycle.

### Phase 4: The Rust Dispatcher Implementation
1. **Create `beskid_runtime/src/interop.rs`**:
   - Implement `pub extern "C" fn __interop_dispatch_unit(enum_ptr: *const u8)`.
   - **Memory Layout Decoding**:
     - `enum_ptr` points to the heap allocation for the enum.
     - `offset 0`: `type_desc_ptr` (8 bytes).
     - `offset 8`: `tag` (4 bytes, `i32`).
     - `offset 12`: padding (if necessary for 8-byte alignment of pointers).
     - `offset 16`: payload (e.g., `*mut BeskidStr`).
   - Write a `match tag` block that extracts the payload and calls `sys_println`, `sys_print`, etc.
   - Implement `__interop_dispatch_usize` for `str_len`, etc.

### Phase 5: JIT Wiring and Cleanup
1. **Update `jit_module.rs`**:
   - Register the new `__interop_dispatch_*` symbols in the `JITBuilder`.
2. **Remove Old Builtins**:
   - Delete `sys_print`, `sys_println`, `str_len`, etc., from the internal builtins list in `beskid_analysis`.
   - Remove their direct `JITBuilder::symbol` registrations.
3. **Verify Tests**:
   - Ensure `examples/*.bd` and runtime JIT tests continue to work correctly via `standard_library` wrappers and typed dispatchers.

### Phase 6: Macroification (The Developer Experience)
Now represented by source-generation workflow:
1. **Interop Generator Command**:
   - `pekan_cli interop` emits Beskid interop wrapper source.
   - Stdlib seeding remains explicit/manual in `standard_library` sources.

---

## 3. Key Technical Challenges & Risks
- **Enum Payload Layout**: The Rust dispatcher must manually unpack the enum payload from a raw pointer. Beskid's `TypeLayout` rules dictate alignment and padding. Hardcoding these in the MVP is risky; we must ensure the manual offsets match `TypeLayout::from_enum`.
- **Return Types**: C-ABI and Cranelift require fixed return types. We cannot have a generic `dispatch(enum) -> Any`. We must group interop methods by their return type and have a specific dispatcher for each (e.g., `_unit`, `_ptr`, `_i64`).
- **Interop Enum Cohesion**: Runtime dispatch tag expectations and Beskid `StdInterop` variant ordering must stay synchronized.
- **Graph/Interop Cohesion**: Keep dependency-graph-based `Std` resolution as the only std source path in execution flows.

---

## 4. Build/Interop Lifecycle Contract (Final)

All project-aware CLI flows (`run`, `clif`, `analyze`) follow:

1. Discover `Project.proj`.
2. Resolve dependency graph.
3. Validate provider scope (`path` enabled in v1).
4. Sync `Project.lock`.
5. Materialize dependency sources to `obj/beskid/deps/src`.
6. Build dependency-first compile units.
7. Execute target.

Interop migration stages must not bypass this lifecycle.

## 5. Diagnostics Contract (Shared Infrastructure)

Project and interop migration diagnostics use the same infrastructure as analysis diagnostics (`make_diagnostic`, `Severity`, and error codes).

- Analysis diagnostics base: `src/beskid_analysis/src/analysis/diagnostics.rs`
- Error-code convention: subsystem-prefixed numeric codes (for example, codegen uses `E20xx`).

### Interop/Project migration error code range

Reserve `E30xx` for projects/build workflow diagnostics referenced by interop migration steps:

- `E3001`: missing `Project.proj` at '{path}'
- `E3006`: dependency '{dependency}' manifest not found at {path}
- `E3007`: dependency cycle detected: {chain}
- `E3008`: unresolved external dependencies: {details}
- `E3011`: unsupported dependency source '{source}' in v1
- `E3022`: lockfile is out of date for project '{project}'
- `E3023`: lockfile update forbidden in frozen mode
- `E3031`: failed to copy dependency source '{from}' -> '{to}': {source}
- `E3033`: build cannot start because dependencies were not materialized

## 6. Final migration completion criteria

Interop migration is complete when all of the following are true:

1. `Std` wrappers are provided by project-resolved `standard_library` source code.
2. Build/run always materialize dependency sources into `obj/beskid` before compilation.
3. Lockfile lifecycle is active and automatic by default.
4. Legacy direct std builtin registrations (`sys_print*`, `str_len`) are removed from primary path.
5. Embedded stdlib prelude fallback is removed from execution flows and compile-plan APIs.
6. Diagnostic output for migration and project failures uses shared analysis diagnostics conventions and stable error codes.
