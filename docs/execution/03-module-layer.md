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

## Notes
- The `Module` trait is implemented by both `JITModule` and `ObjectModule`.
- Keep a single module abstraction so JIT/AOT share frontend code.
