---
title: "Execution stack responsibilities"
description: Execution stack responsibilities
---


## High-level structure
1. **Parsing (AST)**
2. **HIR (semantic IR)**
3. **CLIF lowering**
4. **Module layer**
5. **Execution backend (JIT thin / AOT primary)**
6. **Runtime/stdlib**

## Suggested responsibilities
### `beskid_analysis`
- Parser + AST + source spans
- HIR lowering + type checking
- Semantic analysis rules + diagnostics

### `beskid_codegen`
- HIR -> CLIF lowering
- FunctionBuilder integration
- Module abstraction (common for JIT/AOT)

### `beskid_runtime`
- Builtins + allocation
- String/array primitives
- Panic/error handling

### `beskid_engine`
- JIT thin driver / execution API (development-time)

### `beskid_aot`
- AOT object emission and linker orchestration (production path)
- Runtime archive preparation and ABI/version validation

## Artifact handoff boundaries
1. `beskid_analysis` outputs resolved, typed semantic data.
2. `beskid_codegen` consumes semantic data and outputs lowered backend artifact(s).
3. `beskid_engine` consumes lowered artifacts for in-memory execution only.
4. `beskid_aot` consumes lowered artifacts for object emission and final linkage.
5. `beskid_runtime` implements runtime ABI entrypoints used by both backends.

## Forbidden coupling
- `beskid_analysis` must not depend on runtime or linker behavior.
- `beskid_codegen` must not encode backend-specific syscall policy.
- `beskid_engine` must not define production packaging behavior.
- `beskid_aot` must not redefine runtime ABI semantics.
- `beskid_runtime` must not own language-level parsing/type semantics.

## Why this split
- Keeps analysis and execution concerns isolated.
- Avoids mixing runtime with analysis.
- Keeps JIT and AOT as backend variants over the same lowering + runtime ABI.
- Ensures platform-specific execution policy lives in runtime, not in backend drivers.

## Expansion plan
- Start with minimal HIR + CLIF lowering for functions and literals.
- Introduce runtime builtins for strings/arrays.
- Keep JIT narrow as a fast feedback harness.
- Grow production capability through AOT and runtime ABI hardening.
