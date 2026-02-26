# Standard Library Interop Migration Plan

This document outlines the step-by-step technical plan to replace the current direct builtin mappings with an Enum Dispatcher interop architecture.

Project manifests referenced in this plan use `Project.proj` (HCL syntax).

## 1. Architectural Overview

### Current State
Standard library functions (like `Std.IO.Println`) and internal codegen hooks (like `__alloc`) are both treated as Cranelift external functions. Adding a new standard library method requires changes across `pecan_analysis`, `pecan_codegen`, and `pecan_engine`.

### Target State
- **Internal Builtins**: Kept directly in Cranelift. Limited strictly to memory/codegen hooks (`__alloc`, `__gc_write_barrier`, etc.).
- **Interop Builtins**: A handful of `__interop_dispatch_<return_type>` functions registered in Cranelift.
- **Pecan Prelude**: The compiler automatically parses and injects an auto-generated Pecan source string containing an `enum StdInterop` and `mod Std { ... }` wrappers.
- **Project System Alignment**: The long-term source of standard library wrappers is the `Std` project (`Std/Project.proj`) resolved through normal dependency edges.
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
1. **Create `pecan_analysis/src/stdlib.rs`**:
   - Define a constant `pub const STDLIB_PRELUDE: &str = r#" ... "#;`
   - Include the `enum StdInterop` definition. Example:
     ```pecan
     enum StdInterop {
         IoPrint(String text),
         IoPrintln(String text),
         StringLen(String text),
     }
     ```
   - Include the wrapper modules. Example:
     ```pecan
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
   - Update `pecan_lsp`, `pecan_cli`, and test harnesses to parse `STDLIB_PRELUDE` alongside user code.
   - Inject the prelude's AST into the `ModuleGraph` before name resolution.
   - *Challenge*: The prelude uses internal builtins (`__interop_dispatch_unit`), so the resolver must ensure the prelude is allowed to access them (perhaps by disabling visibility checks or registering them directly).
2. **Bridge to Project-based Stdlib**:
   - Add `Std` as a regular dependency in root `Project.proj` manifests during migration.
   - Move stable `Std.*` wrappers from injected prelude text into `Std` project sources.
   - Keep prelude injection only for transitional/runtime-internal shims that are not yet emitted from `Std/Project.proj`.

### Phase 4: The Rust Dispatcher Implementation
1. **Create `pecan_runtime/src/interop.rs`**:
   - Implement `pub extern "C" fn __interop_dispatch_unit(enum_ptr: *const u8)`.
   - **Memory Layout Decoding**:
     - `enum_ptr` points to the heap allocation for the enum.
     - `offset 0`: `type_desc_ptr` (8 bytes).
     - `offset 8`: `tag` (4 bytes, `i32`).
     - `offset 12`: padding (if necessary for 8-byte alignment of pointers).
     - `offset 16`: payload (e.g., `*mut PecanStr`).
   - Write a `match tag` block that extracts the payload and calls `sys_println`, `sys_print`, etc.
   - Implement `__interop_dispatch_usize` for `str_len`, etc.

### Phase 5: JIT Wiring and Cleanup
1. **Update `jit_module.rs`**:
   - Register the new `__interop_dispatch_*` symbols in the `JITBuilder`.
2. **Remove Old Builtins**:
   - Delete `sys_print`, `sys_println`, `str_len`, etc., from the internal builtins list in `pecan_analysis`.
   - Remove their direct `JITBuilder::symbol` registrations.
3. **Verify Tests**:
   - Ensure `examples/*.pn` and runtime JIT tests continue to work correctly by calling `Std.IO.Println` via the new injected prelude/project wrappers and dispatcher.

### Phase 6: Macroification (The Developer Experience)
Once the manual MVP is proven to work and memory offsets are validated:
1. **Create `define_stdlib!` macro**:
   - Create a macro that accepts a list of Rust functions and their Pecan signatures.
   - The macro generates the `STDLIB_PRELUDE` string at compile time.
   - The macro generates the `match tag { ... }` block for the dispatcher automatically, calculating offsets based on the argument types.

---

## 3. Key Technical Challenges & Risks
- **Enum Payload Layout**: The Rust dispatcher must manually unpack the enum payload from a raw pointer. Pecan's `TypeLayout` rules dictate alignment and padding. Hardcoding these in the MVP is risky; we must ensure the manual offsets match `TypeLayout::from_enum`.
- **Return Types**: C-ABI and Cranelift require fixed return types. We cannot have a generic `dispatch(enum) -> Any`. We must group interop methods by their return type and have a specific dispatcher for each (e.g., `_unit`, `_ptr`, `_i64`).
- **Prelude Name Clashes**: Injecting the prelude into every user file might cause name clashes if a user defines `mod Std`. The resolver will need a mechanism to merge `mod Std` or reserve the `Std` namespace.
