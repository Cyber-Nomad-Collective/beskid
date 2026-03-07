---
title: "JIT and AOT execution model"
description: JIT and AOT execution model
---


## Decision summary
- AOT is the primary production execution path.
- JIT is a thin development-time runner for fast feedback.
- JIT and AOT both consume the same frontend and CLIF lowering.
- Runtime ABI is the single execution boundary for both backends.

## Ownership split
- `beskid_analysis`: parse, resolve, type analysis, diagnostics.
- `beskid_codegen`: lowering from semantic IR to backend-consumable artifact.
- `beskid_engine`: thin JIT execution backend for development-time execution.
- `beskid_aot`: object emission and final artifact linkage for production outputs.
- `beskid_runtime`: runtime ABI implementation and platform policy ownership.

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

## Allowed backend differences
- In-memory execution finalization (JIT) vs object and linker pipeline (AOT).
- Host-only execution for JIT vs explicit target triples for AOT.
- Final output form (in-memory code vs object/static/shared/exe artifacts).

## Forbidden backend differences
- Divergent language semantics for identical lowered input.
- Divergent runtime ABI symbol surfaces.
- Backend-owned syscall/platform policy bypassing runtime ownership.

## Export rules (decision)
- Only `pub` functions are exported in the final artifact.
- All internal symbols are mangled and not exported.
- Runtime ABI exports remain stable and are versioned separately.

## Name mangling
- Uses `pn::` prefix and always includes the signature.
- See `../ir-and-lowering/name-mangling.md` for full rules.
