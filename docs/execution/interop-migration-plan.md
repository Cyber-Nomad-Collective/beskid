# Standard Library Interop Migration Plan

This document outlines the step-by-step technical plan to replace the current direct builtin mappings with an Enum Dispatcher interop architecture.

Project manifests referenced in this plan use `Project.proj` (HCL syntax).

## 1. Architectural Overview

### Current State
Standard library functions (like `Std.IO.Println`) and internal codegen hooks (like `__alloc`) are both treated as Cranelift external functions. Adding a new standard library method requires changes across `beskid_analysis`, `beskid_codegen`, and `beskid_engine`.

### Target State
- **Internal Builtins**: Kept directly in Cranelift. Limited strictly to memory/codegen hooks (`__alloc`, `__gc_write_barrier`, etc.).
- **Interop Builtins**: A handful of `__interop_dispatch_<return_type>` functions registered in Cranelift.
- **Beskid Prelude**: Transitional compatibility shim only; primary wrappers come from `Std` project sources.
- **Project System Alignment**: The long-term source of standard library wrappers is the `Std` project (`Std/Project.proj`) resolved through normal dependency edges in the Daggy project DAG.
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
Before building a complex proc-macro, we will implement the first interop manually to establish the memory layout and validation.
1. **Create `beskid_analysis/src/stdlib.rs`**:
   - Define a constant `pub const STDLIB_PRELUDE: &str = r#" ... "#;`
   - Include the `enum StdInterop` definition. Example:
     ```beskid
     enum StdInterop {
         IoPrint(String text),
         IoPrintln(String text),
         StringLen(String text),
     }
     ```
   - Include the wrapper modules. Example:
     ```beskid
     mod Std {
        mod IO {
            Unit Println(text: String) {
                __interop_dispatch_unit(StdInterop::IoPrintln(text));
            }
        }
     }
     ```

### Phase 3: Compiler Injection (The Prelude)
1. **Modify the Resolver / AST Parser**:
   - Update `beskid_lsp`, `beskid_cli`, and test harnesses to parse `STDLIB_PRELUDE` alongside user code.
   - Inject the prelude's AST into the `ModuleGraph` before name resolution.
   - *Challenge*: The prelude uses internal builtins (`__interop_dispatch_unit`), so the resolver must ensure the prelude is allowed to access them (perhaps by disabling visibility checks or registering them directly).
2. **Bridge to Project-based Stdlib**:
   - Add `Std` as a regular dependency in root `Project.proj` manifests during migration.
   - Resolve `Std` through the Daggy dependency graph (`consumer -> dependency` edge semantics).
   - Move stable `Std.*` wrappers from injected prelude text into `Std` project sources.
   - Keep prelude injection only for transitional/runtime-internal shims that are not yet emitted from `Std/Project.proj`.
   - Disable prelude fallback whenever a resolvable `Std` dependency node exists in the graph.
   - Require dependency materialization to `obj/beskid/deps/src` before loading `Std` compile units.
   - Require lock sync (`Project.lock`) before project compilation continues.

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
   - Ensure `examples/*.bd` and runtime JIT tests continue to work correctly by calling `Std.IO.Println` via the new injected prelude/project wrappers and dispatcher.

### Phase 6: Macroification (The Developer Experience)
Once the manual MVP is proven to work and memory offsets are validated:
1. **Create `define_stdlib!` macro**:
   - Create a macro that accepts a list of Rust functions and their Beskid signatures.
   - The macro generates the `STDLIB_PRELUDE` string at compile time.
   - The macro generates the `match tag { ... }` block for the dispatcher automatically, calculating offsets based on the argument types.

---

## 3. Key Technical Challenges & Risks
- **Enum Payload Layout**: The Rust dispatcher must manually unpack the enum payload from a raw pointer. Beskid's `TypeLayout` rules dictate alignment and padding. Hardcoding these in the MVP is risky; we must ensure the manual offsets match `TypeLayout::from_enum`.
- **Return Types**: C-ABI and Cranelift require fixed return types. We cannot have a generic `dispatch(enum) -> Any`. We must group interop methods by their return type and have a specific dispatcher for each (e.g., `_unit`, `_ptr`, `_i64`).
- **Prelude Name Clashes**: Injecting the prelude into every user file might cause name clashes if a user defines `mod Std`. The resolver will need a mechanism to merge `mod Std` or reserve the `Std` namespace.
- **Graph/Interop Transition Cohesion**: During migration, keep dependency-graph-based `Std` resolution as the primary path and ensure fallback behavior is explicit, feature-gated, and disabled when `Std` is resolvable.

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

1. `Std` wrappers are provided by project-resolved source code (not primary prelude injection).
2. Build/run always materialize dependency sources into `obj/beskid` before compilation.
3. Lockfile lifecycle is active and automatic by default.
4. Legacy direct std builtin registrations (`sys_print*`, `str_len`) are removed from primary path.
5. Compatibility prelude fallback is feature-gated and disabled when `Std` is resolvable.
6. Diagnostic output for migration and project failures uses shared analysis diagnostics conventions and stable error codes.
