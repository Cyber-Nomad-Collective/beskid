---
description: AOT output via ObjectModule
---

# AOT output via ObjectModule

## Purpose
Emit object files for ahead-of-time compilation or linking using `ObjectModule`.

## Key APIs
- `ObjectBuilder::new(isa, name, libcall_names)`
- `ObjectModule::new(builder)`
- `ObjectModule::finish()` -> `ObjectProduct`

Reference: https://docs.rs/cranelift-object/latest/cranelift_object/struct.ObjectModule.html

## Notes
- Shares the same `Module` trait with JIT.
- Keep frontend code identical between JIT and AOT.
- AOT output must link the runtime (including gc-arena) and include type descriptor data objects.
