---
description: Module layer (functions/data and linking)
---

# Module layer (functions/data and linking)

## Purpose
Cranelift modules collect and link functions and data objects. This is the boundary between frontend IR generation and code emission.

## Primary API
- `cranelift_module::Module` trait
  - `declare_function`, `declare_data`
  - `define_function`, `define_data`
  - `make_signature`, `make_context`

Reference: https://docs.rs/cranelift-module/latest/cranelift_module/trait.Module.html

## Responsibilities in Pecan
- Declare all user functions (and runtime helpers) with signatures.
- Emit CLIF into a `Context` and call `define_function`.
- Resolve function references via `declare_func_in_func`.

## Responsibilities
- Register runtime builtins as symbols for CLIF imports.
- Manage `FuncId` + `DataId` tables for declared symbols.
- Own module-level data objects for constants and metadata.
- Emit type descriptor data objects for heap allocations.

## Runtime symbol table
- Keep a stable mapping from builtin name -> `FuncId` to avoid duplicate declarations.
- Builtins are exported from the host via `JITBuilder::symbol` and declared in the module via `declare_function`.
- Include gc-arena-backed builtins (alloc, root management) in the same symbol map.

## Data objects
- Use `declare_data`/`define_data` for static runtime metadata (type descriptors).
- Expose data objects to functions via `declare_data_in_func` when needed for loads.
- AOT/JIT should emit descriptor data for aggregates using the same module APIs.

## Notes
- The `Module` trait is implemented by both `JITModule` and `ObjectModule`.
- Keep a single module abstraction so JIT/AOT share frontend code.
