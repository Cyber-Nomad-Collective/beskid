---
description: Refactoring plan to migrate Beskid method declarations to impl blocks
---

# Impl Method Migration Refactoring Plan

## Goal
Migrate the compiler and tests from legacy receiver-qualified method declarations to canonical `impl` blocks, while preserving receiver-aware dispatch and implicit `this` semantics.

## Target language shape

```beskid
type Counter : Reader, Writer {
    i64 value,
}

impl Counter {
    i64 Read() { return this.value; }
    unit Write(i64 x) { this.value = x; }
}
```

### Invariants
1. Contract conformance is declared on the type header: `type T : ContractA, ContractB`.
2. Method bodies are declared in `impl T { ... }` blocks.
3. Receiver is implicit and named `this` in method bodies.
4. `obj.Method(args)` remains statically lowered to direct calls for concrete receiver types.

## Scope

### In
- Grammar/parser/AST/HIR support for `impl` blocks.
- Lowering `impl` methods into existing method IR items.
- Resolver/type checker/codegen adaptation to `impl` origin.
- Regression tests for parser, typing, codegen, and JIT.

### Out (separate work)
- Method receiver modifiers in syntax (`self: ref`, `self: mut`).
- Extension/capability modules.
- Dynamic dispatch redesign beyond current contract model.

## Migration mode

**Selected mode: strict.**

- Legacy receiver-qualified method declaration syntax is removed immediately.
- No compatibility parser branch.
- No warning-only period.
- Failing legacy syntax must produce a parser error with guidance to use `impl T { ... }`.

## Phased plan

### Phase 0 — Strict-mode guardrails
- Freeze syntax contract:
  - contract conformance: `type T : ContractA, ContractB`
  - methods: `impl T { ... }`
  - receiver inside methods: implicit `this`
- Add a parser diagnostic for removed legacy declarations with a direct fix-it hint.

### Phase 1 — Grammar and syntax tree
- Add grammar rule for `impl` block item:
  - `impl` + receiver type + method members.
- Keep method member syntax as regular function signatures (without explicit receiver parameter).
- Remove legacy grammar entry for receiver-qualified method declarations.
- Add syntax nodes:
  - `ImplBlock` (receiver type, methods, visibility rules if applicable).
  - `ImplMethodDefinition` (or reuse existing `MethodDefinition` payload shape where practical).
- Parser tests:
  - Single method, multiple methods, generic receiver, empty impl block diagnostics.
  - Legacy declaration rejection tests.

### Phase 2 — AST→HIR lowering
- Lower each method in `impl T` into HIR `MethodDefinition` with receiver type `T`.
- Preserve method span ownership so diagnostics point to method declarations inside impl blocks.
- Ensure implicit `this` receiver local is represented by existing resolver/type-context mechanism.
- Remove lowering paths that rely on legacy method declaration AST shape.

### Phase 3 — Resolver and type context
- Keep receiver-aware method identity keyed by `(receiver type, method name)`.
- Ensure method collection/indexing consumes methods lowered from impl blocks.
- Bind implicit `this` local for method bodies with receiver type from containing impl block.
- Maintain clear diagnostics for:
  - unknown method,
  - ambiguous method,
  - missing contract method implementation.

### Phase 4 — Type checking call dispatch
- Keep member-call typing path:
  - `obj.Method(args)` resolves by receiver type + method name.
- Validate arity and argument type compatibility.
- Ensure method declarations no longer rely on explicit receiver parameters.

### Phase 5 — Codegen lowering
- Lower methods as functions with hidden first receiver argument.
- Preserve stable mangling: `__method__{ReceiverName}__{MethodName}`.
- Lower `obj.Method(args)` to direct function call with receiver inserted as first argument.

### Phase 6 — Test migration and expansion
- Rewrite existing method tests to impl syntax.
- Add focused regressions:
  - `this` field access,
  - receiver-specific dispatch for same method name,
  - contract conformance from `type T : Contract` + `impl T` methods,
  - failure cases (unknown method, arity/type mismatch).
- Remove legacy syntax tests; replace with parser rejection diagnostics.

### Phase 7 — Hardening
- Run full impacted suites:
  - analysis,
  - codegen,
  - runtime/JIT,
  - end-to-end tests.
- Confirm dead parser/AST/HIR paths for legacy syntax are deleted.
- Improve diagnostics copy to suggest canonical impl syntax.

## Strict-mode execution checklist
1. Grammar no longer accepts legacy receiver-qualified method declarations.
2. Parser emits clear migration diagnostic for removed legacy syntax.
3. Syntax tree contains impl-block based method representation only.
4. HIR lowering has no legacy method-declaration branch.
5. Resolver/type/codegen method pipelines operate only on impl-originated methods.
6. Test suite contains:
   - positive impl syntax coverage,
   - negative legacy syntax rejection coverage.
7. Docs and examples contain zero legacy syntax forms.

## Risk register
1. **Parser ambiguity** between function and impl method forms.
   - Mitigation: explicit grammar nonterminal separation and parser snapshot tests.
2. **Span regression** for diagnostics in lowered methods.
   - Mitigation: golden tests for representative errors with expected spans.
3. **Dispatch regressions** in codegen for path-vs-member callees.
   - Mitigation: regression tests for both parse shapes until parser is stabilized.

## Acceptance criteria
- All method-related docs/examples use `impl` block syntax.
- Conformance examples use `type T : Contract` syntax.
- No compiler phase depends on explicit receiver syntax in method declarations.
- Existing method dispatch functionality remains green in analysis/codegen/JIT tests.
- Legacy method declaration syntax is rejected with actionable diagnostics.
