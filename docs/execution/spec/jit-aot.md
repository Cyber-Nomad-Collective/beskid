---
description: JIT and AOT execution model
---

# JIT and AOT execution model

## Decision summary
- JIT is the primary execution engine.
- AOT reuses the same frontend and CLIF lowering.
- Module abstraction is shared between JIT and AOT.

## JIT flow
1. Build host ISA (`cranelift_native::builder`).
2. Create `JITModule` via `JITBuilder`.
3. Declare all function signatures.
4. Define functions from CLIF contexts.
5. `finalize_definitions()` and execute.

## AOT flow
1. Build target ISA.
2. Create `ObjectModule` via `ObjectBuilder`.
3. Declare/define functions identical to JIT path.
4. `finish()` emits an object file for external linking.

## Export rules (decision)
- Only `pub` functions are exported in the final artifact.
- All internal symbols are mangled and not exported.

## Name mangling
- Uses `pn::` prefix and always includes the signature.
- See `name-mangling.md` for full rules.
