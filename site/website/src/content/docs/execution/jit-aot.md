---
title: "JIT and AOT execution model"
description: JIT and AOT execution model
---


## Decision summary
- AOT is the primary production execution path.
- JIT is a thin development-time runner for fast feedback.
- JIT and AOT both consume the same frontend and CLIF lowering.
- Runtime ABI is the single execution boundary for both backends.

## JIT flow
1. Build host ISA (`cranelift_native::builder`).
2. Create `JITModule` via `JITBuilder`.
3. Declare builtin/runtime imports from the shared runtime ABI manifest.
4. Define functions from CLIF contexts.
5. `finalize_definitions()` and execute.

JIT scope is intentionally narrow:
- compile + execute host-platform code
- import runtime ABI symbols
- no platform syscall policy and no backend-specific execution behavior

## AOT flow
1. Build target ISA.
2. Create `ObjectModule` via `ObjectBuilder`.
3. Declare/define functions using the same runtime ABI import surface as JIT.
4. `finish()` emits an object file for external linking.

AOT owns production deployment concerns (linking/runtime packaging).

## Export rules (decision)
- Only `pub` functions are exported in the final artifact.
- All internal symbols are mangled and not exported.
- Runtime ABI exports remain stable and are versioned separately.

## Name mangling
- Uses `pn::` prefix and always includes the signature.
- See `name-mangling.md` for full rules.
