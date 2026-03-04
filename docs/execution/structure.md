---
description: Execution stack responsibilities
---

# Execution stack responsibilities

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

### `beskid_codegen` (new)
- HIR -> CLIF lowering
- FunctionBuilder integration
- Module abstraction (common for JIT/AOT)

### `beskid_runtime` (new)
- Builtins + allocation
- String/array primitives
- Panic/error handling

### `beskid_engine` (new)
- JIT thin driver / execution API (development-time)
- AOT driver (object emission, production path)

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
