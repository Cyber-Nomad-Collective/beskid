---
description: Execution stack responsibilities
---

# Execution stack responsibilities

## High-level structure
1. **Parsing (AST)**
2. **HIR (semantic IR)**
3. **CLIF lowering**
4. **Module layer**
5. **JIT execution**
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
- JIT driver / execution API
- AOT driver (object emission)

## Why this split
- Keeps analysis and execution concerns isolated.
- Avoids mixing runtime with analysis.
- Makes future AOT pipeline a direct reuse of the JIT path.

## Expansion plan
- Start with minimal HIR + CLIF lowering for functions and literals.
- Introduce runtime builtins for strings/arrays.
- Add AOT output once JIT is stable.
