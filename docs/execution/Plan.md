---
description: Pecan execution implementation plan
---
# Pecan execution implementation plan

## Phase 0 — Baseline scaffolding 

**Goal:** prepare crate structure and dependencies.

**Tasks**

1. Add new crates:
   - `pecan_codegen` (CLIF lowering)
   - `pecan_runtime` (builtins + GC hooks)
   - `pecan_engine` (JIT/AOT driver)
2. Add Cranelift dependencies:
   - `cranelift-frontend`, `cranelift-module`, `cranelift-jit`, `cranelift-object`, `cranelift-native`
3. Define shared types:
   - `SpanId`, `SymbolId`, `TypeId` (reuse existing definitions if present).

**Acceptance criteria**

- Workspace builds with new crates (empty stubs).
- CI (if any) passes.

---

## Phase 1 — HIR implementation (core semantic IR)

**Goal:** produce HIR and route analysis to it.

**Tasks**

1. Add `pecan_analysis::hir` module.
2. Define phase markers and shared-core node families:
   - `AstPhase` and `HirPhase` marker types.
   - Shared core node families for `Program`, `Module`, `Item`, `Statement`, `Expression` with phase parameters.
   - Phase-associated metadata slots for resolved symbols and expression types.
3. Provide AST compatibility layer:
   - Type aliases for AST nodes backed by shared-core families.
   - Preserve parser output shape and `Spanned<T>` invariants.
4. Define HIR compatibility layer:
   - Type aliases for HIR nodes backed by shared-core families.
   - HIR-only semantic fields attached through the phase metadata.
5. Implement SymbolTable + ModuleGraph for resolution.
6. Implement AST → HIR lowering pipeline (symbols + spans):
   - Declaration collection.
   - Name resolution.
   - Early normalization (desugaring of syntactic sugar).
   - Emit explicit `CastExpression` nodes where required (stub until Phase 2 typing).
7. Add HIR legality validation helpers:
   - Check every node is `Spanned<T>`.
   - Check identifiers are resolved.
   - Check normalized control-flow forms.
8. Update analysis rules to accept `Spanned<HIRProgram>`.
9. Provide minimal HIR Query support (shared with AST) for rule traversal.

**Acceptance criteria**

- HIR for a simple function compiles.
- Analysis test runs on `Spanned<HIRProgram>`.
- Shared-core AST nodes continue to parse and traverse without regression.
- HIR lowering preserves spans for diagnostics and passes validation checks.

### Resolver implementation detail (Phase 1)

**Goal:** resolve names with minimal code while staying extensible.

**Dependency order**

1. **Module discovery (ModuleGraph)**
   - Map file paths → `ModuleId` and module path.
   - Store per-module item list and scope root.
   - Track `mod` declarations to link children.

2. **Item table pass (top-level only)**
   - Assign `ItemId` per item.
   - Insert into module scope; detect duplicates.
   - Record `ItemKind` (function, type, enum, contract, module, use).

3. **Local scope pass (block-level)**
   - Walk statements/expressions with a stack of scopes.
   - Add locals (`let`, params), produce `LocalId`.
   - Resolve `PathExpression` and `Type::Complex`.

4. **Resolution outputs (side tables)**
   - `ResolvedPathId` keyed by node/span (value/type namespaces split later).
   - `ItemId`/`LocalId` stored in tables (no HIR mutation yet).

**Maintainability hooks**
- Keep symbol namespaces separate (`values`, `types`) even if only one is used now.
- Implement resolver as a small pass in `pecan_analysis::resolve` (new module).
- Use helpers/macros for AST walking to minimize boilerplate.

**Acceptance criteria**
- Duplicate top-level names fail with spans.
- `PathExpression` resolves to correct `ItemId`/`LocalId`.
- `use`/`mod` hooks exist (even if minimal behavior at first).

**Current progress (handoff status)**
- `pecan_analysis::resolve` split into submodules: `ids`, `errors`, `items`, `resolver`.
- Top-level item collection implemented (`Resolver::resolve_program`) with duplicate detection.
- `ModuleGraph` added with per-module item scopes and module path tracking.
- Local scope stack + `LocalId` tracking implemented.
- `ResolutionTables` added for resolved values/types + locals.
- Path/type resolution and diagnostics (unknown value/type, duplicate local, shadowed local warnings) implemented.
- Module-qualified resolution now distinguishes:
  - unknown module path,
  - missing symbol in known module,
  - private item access across module paths.
- Resolver now tracks item visibility and enforces visibility gate for module-qualified lookups.
- Private cross-module access emits dedicated analysis diagnostic (`E1107`).
- Resolver/type diagnostics now emitted through analysis `builtin_rules` and CLI.
- Resolver tests added/expanded in `pecan_tests` for duplicate top-level item, duplicate local, unknown value/type, shadowing behavior, qualified path classification, and private/public module visibility behavior.
- AST→HIR lowering is now trait-driven and split by node family (`items`, `statements`, `expressions`, `types`) with tests validating span preservation and node-kind mapping.
- HIR legality validation module is integrated into analysis pipeline after resolution with dedicated diagnostics and test coverage.

**Remaining work**
1. Finalize `use`/`mod` semantics in resolver lookup paths:
   - lock import precedence and alias/re-export behavior,
   - add targeted resolver tests for import-driven shadow/ambiguity paths.
2. Optional Phase 1 cleanup:
   - widen legality structural checks if additional normalized forms are introduced during codegen prep.

### Codebase evaluation (resolver + typing)

**Resolver status**
- Implemented: top-level item collection, module graph, local scopes, resolution tables, path/type resolution, shadowing warnings, module visibility gating, and private cross-module diagnostics.
- Missing: deeper import (`use`) semantics hardening (aliases/re-exports and precedence edge-cases).

**Type system status**
- Implemented: `TypeId` + `TypeTable`, `TypeContext` wiring, expression/statement typing, function signatures, struct/enum/member/match typing, cast intents, cast-intent normalization/accessors, cast warnings, and member-target diagnostics hardening.
- Missing: codegen consumption boundary for cast intents and final diagnostic naming polish for named types in messages.

### Continuation plan (resolver → type checking)

1. **Resolver: module graph + scope layout**
   - ✅ `ModuleGraph` maps module paths/files → `ModuleId`, per-module item lists.
   - ✅ Per-module scope table wired to item insertion.
2. **Resolver: local scope pass**
   - ✅ Scope stack (block + function) interns locals (`LocalId`).
   - ✅ Resolve `PathExpression` and `Type::Complex` into side tables keyed by span.
3. **Resolver: outputs + diagnostics**
   - ✅ `ResolutionTables` holds resolved values/types + locals.
   - ✅ Unknown symbol/type + duplicate local diagnostics.
   - ⏳ Shadowing warnings (still needed).
4. **Type system: typing context setup**
   - Add a `TypeContext` that references `ResolutionTables` + `TypeTable`.
   - Seed `TypeTable` with primitives + all named types from resolution.
5. **Type system: expression typing pass**
   - Walk expressions/statement bodies and assign `TypeId` via a side table.
   - Provide literal defaults and enforce `let` annotations when inference is not allowed.
6. **Type system: validation + diagnostics**
   - Validate operators, calls, returns, and control-flow joins.
   - Record cast intents (or insert explicit cast nodes) for safe coercions.
7. **Testing + diagnostics**
   - Add resolver tests (duplicate top-level, locals, unknown path).
   - Add typing tests (literals, mismatches, call arity/type errors, returns).

---

## Phase 2 — Type system

**Goal:** deterministic typing.

**Tasks**

1. **Type identity layer**
   - `TypeId` table for primitive + named types.
   - Map resolved `ItemId` to named type IDs.
2. **Typing context + structure**
   - `TypeContext` stores `TypeTable`, expression type map, local type map, and signatures.
   - Split typing logic into focused modules:
     - `context.rs` for shared state and entrypoints.
     - `helpers.rs` for seed/utility helpers.
     - `items.rs` for item-level typing and signature capture.
     - `statements.rs` for statement typing.
     - `expressions.rs` for expression typing.
     - `types.rs` for type lookup/mapping.
3. **Minimal typing (no inference)**
   - Require explicit type annotations for `let`.
   - Literal defaults (`i64`, `f64`, `bool`, etc.).
4. **Expression + statement typing pass**
   - Assign `TypeId` to expressions via side tables.
   - Validate operators, returns, conditions (`if`, `while`, `for`).
5. **Call typing + signatures**
   - Record `FunctionSignature` for functions/methods.
   - Validate call arity and argument types; yield return type.
6. **Structured types**
   - Validate struct/enum literals (field presence and types).
   - Validate member access once field info is modeled.
7. **Match typing**
   - Enforce consistent arm types and return type propagation.
8. **Casts and diagnostics**
   - Insert explicit cast nodes (or record cast intents) when safe.
   - Emit span-based errors for mismatch/missing type.

**Acceptance criteria**
- Unit tests: literal typing, call arity/type errors, mismatch errors, return typing.
- Typing pass produces expression type table for simple programs.

**Current progress (handoff status)**
- `pecan_analysis::types` module split; `TypeId`, `TypeInfo`, `TypeTable` in `types/table.rs`.
- Typing context split into `context`, `helpers`, `items`, `statements`, `expressions`, `types` modules.
- `TypeContext` seeds primitive/named types and produces expression/local type tables.
- Function signatures recorded and used for call typing (arity + argument types).
- Typing covers struct literals, member access, match expressions, enum constructors, and cast intents.
- `cast_intents` now have explicit output invariants (sorted, deduplicated) and typed span-keyed accessors.
- Numeric compatibility is routed through `require_same_type` for assignments/calls/returns with conflict checks.
- Cast-intent warnings are emitted in both staged and resolve+type analysis paths (`W1203`) and respect warning suppression settings.
- Member-access-on-non-aggregate now emits a dedicated type error (`InvalidMemberTarget` / `E1213`).
- Tests expanded to cover: nested match joins, enum pattern arity/type mismatch variants, grouped/block propagation, call/return cast-intent emission, cast-intent span accessors, and invalid member targets.
- Type/resolution errors now surfaced via analysis diagnostics and CLI.

**Remaining work**
1. Finalize cast strategy consumer boundary:
   - define exact `cast_intents` consumption contract in `pecan_codegen` lowering,
   - lock widening/narrowing semantics as codegen assertions.
2. Final diagnostics polish:
   - improve named-type rendering in warnings/errors (avoid raw internal IDs in user-facing text).

---

## Phase 3 — CLIF lowering (core execution)

**Goal:** HIR → CLIF lowering.

**Kickoff scope lock (agreed)**
- Include only a minimal vertical slice in this chunk:
  - function prologue/epilogue,
  - literals,
  - locals,
  - return.
- Defer arithmetic, branching, calls, and broader control-flow to follow-up chunks.
- Treat missing required cast-intent at codegen boundary as a hard error.
- Route codegen diagnostics through the existing analysis/diagnostic pipeline.
- Start with a narrow bootstrap ABI and widen later.
- Test strategy: IR-shape/golden tests first, smoke execution tests second.

**Tasks**

1. Implement/verify CLIF builder scaffolding in `pecan_codegen` using `FunctionBuilder`.
2. Add typed codegen handoff entrypoint consuming:
   - `Spanned<HirProgram>`
   - `Resolution`
   - `TypeResult` (including `cast_intents`).
3. Add cast-intent boundary validator in codegen:
   - validate intent shape and numeric-only semantics,
   - error on missing required cast-intent.
4. Lower minimal kickoff slice only:
   - literals,
   - local values,
   - returns,
   - basic function skeleton generation.
5. Add span-aware codegen error contract and map to diagnostics.
6. Add IR-shape/golden tests and initial smoke coverage for kickoff slice.

**Current progress (end-of-session status)**
- ✅ `pecan_codegen` now exposes a typed kickoff entrypoint:
  - `lower_program(&Spanned<HirProgram>, &Resolution, &TypeResult)`
  - returns `CodegenArtifact` or `Vec<CodegenError>`.
- ✅ Codegen artifact/model added for kickoff:
  - `CodegenArtifact` + `LoweredFunction` with CLIF text for inspection.
- ✅ Span-aware codegen error contract implemented with structured variants:
  - unsupported node/feature,
  - missing resolution/local/expression-type,
  - cast-intent contract failures,
  - type mismatch,
  - CLIF verification failures.
- ✅ Cast-intent boundary validator implemented:
  - numeric-only cast intents,
  - duplicate/conflicting intent checks,
  - hard error on missing required cast-intent for numeric mismatch.
- ✅ Minimal CLIF lowering vertical slice implemented:
  - function skeleton (entry block + finalize),
  - literal lowering (integer/bool subset),
  - local `let` binding for supported types,
  - return statement lowering,
  - CLIF verification gate.
- ✅ Kickoff codegen tests added and passing in `pecan_codegen`:
  - successful basic lowering,
  - unsupported expression failure with span-aware error,
  - missing-cast-intent hard-failure regression.
- ✅ Verification status:
  - `cargo check -p pecan_analysis -p pecan_codegen` passes,
  - `cargo test -p pecan_codegen` passes,
  - `cargo test -p pekan_tests analysis:: -- --nocapture` passes.

**Remaining work (after kickoff)**
1. Wire codegen errors into the shared analysis diagnostic pipeline with stable code ranges.
2. Extend lowering coverage to arithmetic and conditional branching.
3. Add function-call lowering and initial signature/ABI mapping.
4. Start module-level symbol declaration/definition path via Cranelift `Module`.
5. Add smoke execution path for a minimal `main` through `pecan_engine`.

**Acceptance criteria**

- Generated CLIF validates for the kickoff subset (function/literal/local/return).
- Codegen errors for unsupported nodes are span-correct and deterministic.
- Cast-intent handoff contract is explicit and validated by tests.
- Existing analysis tests remain green after integration.

---

## Phase 4 — Module layer + JIT

**Goal:** execute code in process.

**Tasks**

1. Implement `pecan_engine` JIT driver using `JITModule`.
2. Declare/define functions via `Module`.
3. Add minimal runtime builtins in `pecan_runtime`.

**Acceptance criteria**

- CLI command `run` executes a simple `main.pn`.
- JIT returns expected values.

---

## Phase 5 — Runtime & GC hooks (Go‑style)

**Goal:** align runtime with GC spec.

**Tasks**

1. Implement allocation with type descriptor metadata.
2. Add runtime `panic`, `str_new`, `array_new`.
3. Add placeholder GC API surface (no full GC yet).
4. Wire write barriers at pointer stores (stub).

**Acceptance criteria**

- Builtins callable from CLIF.
- Heap objects carry type descriptors.

---

## Phase 6 — AOT support

**Goal:** emit object files.

**Tasks**

1. Add `ObjectModule` path to `pecan_engine`.
2. CLI command `build` emits `.o`.

**Acceptance criteria**

- Object file produced with exported `pub` symbols.

---

## Integration touchpoints

- **CLI**: add `run` and `build` commands.
- **Tests**: add HIR + CLIF lowering tests under `pecan_tests`.
- **Docs**: update execution docs as needed.

---

## Detailed implementation plan — next session (Phase 3 continuation)

### Session objective

Complete trait-based CLIF lowering architecture and incrementally replace stubs with real lowering for all HIR expression/statement nodes while preserving diagnostic quality and test stability.

### Current state snapshot

- Lowering architecture is trait-driven via `Lowerable<Ctx>` in `lowering/lowerable.rs`.
- `mod.rs` files contain module declarations only; logic is split into node files.
- Function body lowering uses `lower_node(...)` with `NodeLoweringContext`.
- Codegen diagnostic bridge exists (`pecan_codegen::diagnostics`) and CLIF CLI command exists.
- `cargo test -p pecan_codegen` is green.

### Active module layout (current)

- `lowering/lowerable.rs` — generic `Lowerable<Ctx>`, `lower_node`, `lower_program`
- `lowering/node_context.rs` — per-function lowering context
- `lowering/function.rs` — function frame/signature lifecycle and verification
- `lowering/expressions/` — one file per HIR expression node category
- `lowering/statements/` — one file per HIR statement node category
- `lowering/cast_intent.rs`, `lowering/types.rs`, `lowering/context.rs`, `lowering/tests.rs`

### Node coverage status

#### Expressions

- Implemented (non-stub):
  - `literal_expression`, `literal`
  - `path_expression`
  - `grouped_expression`
  - `block_expression` (unit/none path)
  - `binary_expression` (numeric arithmetic subset)
- Stub-only (returns unsupported):
  - `assign_expression`
  - `call_expression`
  - `match_expression`
  - `member_expression`
  - `struct_literal_expression`
  - `enum_constructor_expression`
  - `unary_expression`

#### Statements

- Implemented (non-stub):
  - `let_statement`
  - `return_statement`
  - `expression_statement`
- Stub-only (returns unsupported):
  - `if_statement`
  - `for_statement`
  - `while_statement`
  - `break_statement`
  - `continue_statement`

### Ordered plan

1. **Finish expression core semantics**
   - Implement `unary_expression` (`Neg`, `Not`) with numeric/bool typing rules.
   - Expand `binary_expression` to comparisons and logical operators (`Eq`, `NotEq`, `Lt`, `Lte`, `Gt`, `Gte`, `And`, `Or`).
   - Keep strict fail-fast diagnostics for unsupported type/operator combinations.

2. **Implement call and member/value access path**
   - Implement `call_expression` for direct internal calls (initial ABI subset).
   - Define unsupported behavior for method/member calls until object model lowering exists.
   - Add signature validation and argument count/type checks.

3. **Implement control flow statements**
   - Implement `if_statement` with CLIF block graph (`then`, optional `else`, merge).
   - Implement `while_statement` with loop header/body/exit blocks.
   - Keep `for_statement` as explicit unsupported until range lowering policy is finalized, or lower through canonical while desugaring if type info is sufficient.
   - Keep `break`/`continue` blocked until loop control stack is introduced.

4. **Implement assignment and aggregate nodes**
   - Implement `assign_expression` for local l-values only (phase 1).
   - Keep struct/enum constructor and match nodes as unsupported until data layout + pattern lowering design is finalized.

5. **Diagnostics hardening and integration polish**
   - Ensure each newly implemented node has stable diagnostic codes/messages for invalid combinations.
   - Keep CLI `clif` output and diagnostics consistent across parse/resolve/type/codegen stages.

6. **Engine smoke integration checkpoint**
   - Add one end-to-end smoke path from typed HIR -> CLIF artifact -> engine execution harness.

### Test gates for next session

1. `cargo test -p pecan_codegen` (must stay green).
2. New targeted tests for unary/binary/call/if/while lowering and codegen diagnostic mapping.
3. `cargo test -p pekan_tests analysis:: -- --nocapture` (must remain green).

### Acceptance criteria for next session

- No missing HIR expression/statement node files; dispatch remains trait-based through `Lowerable<Ctx>`.
- At least `unary`, `comparisons/logical binary`, `if`, and direct internal `call` are implemented (non-stub).
- Remaining unsupported nodes fail with explicit stable diagnostics (no hidden control flow).
- Existing analysis/type/resolution/codegen tests remain green.

### Immediate follow-up (after kickoff slice)

1. Expand lowering to arithmetic + conditional branching.
2. Integrate function calls and signature-based ABI mapping.
3. Start module-level symbol linkage through Cranelift `Module` interface.
