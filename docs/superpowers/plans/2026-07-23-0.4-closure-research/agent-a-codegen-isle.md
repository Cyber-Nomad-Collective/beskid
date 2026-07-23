### Status classifications
Use: **confirmed missing** | **partially implemented** | **implemented but unverified** | **already complete**

---

### Current architecture

**Intended sole production pipeline (compiler `ec164ff9`):**

```text
SyntaxProgramAssembly / prepared frontend
  → TypedProgram (+ optional runtime/corelib capabilities)
  → CodegenInput::new (HIR-free boundary)
  → lower_syntax_program / lower_*_entrypoint
  → SyntaxNodeFacts (Salsa) + emit_isle_item_* / emit_isle_expression_*
  → beskid_isle FunctionEmitter + generated ISLE rules
  → cranelift verify_function
  → CodegenArtifact
```

**Production entry symbols (Agent A scope):**

| Symbol | File | Role |
| --- | --- | --- |
| `CodegenInput::new` | `compiler/crates/beskid_codegen/src/codegen_input.rs` | Sole analysis→codegen boundary; rejects empty roots / ABI drift / foreign roots |
| `lower_syntax_assembly_entrypoint` | `…/prepared_syntax.rs` | Parse assembly → TypedProgram → CodegenInput → ISLE module |
| `lower_prepared_syntax_entrypoint` | `…/prepared_syntax.rs` | FrontEndTypedResult wrapper → assembly entrypoint |
| `lower_prepared_syntax_module` | `…/prepared_syntax.rs` | Full reachable module (no single entrypoint convention) |
| `lower_canonical_runtime_prepared_syntax` | `…/prepared_syntax.rs` | Embedded Bootstrap corpus + intrinsic capability |
| `lower_syntax_program` | `…/module_emission.rs` | Module item resolve/specialize/spawn expand → ISLE emit → artifact |
| `emit_isle_item` / `emit_isle_item_with_services` / `emit_isle_item_with_services_specialization` | `…/isle_adapter.rs` | Per-item ISLE emission |
| `emit_isle_expression*` / `emit_isle_closure_lambda_entry` | `…/isle_adapter.rs` | Expression / spawn-lambda helpers |
| `SyntaxNodeFacts` | `…/isle_adapter.rs` | Production `NodeFacts` from queries |
| `FunctionEmitter::{emit_item_statement*, emit_expression*, emit_closure_lambda_entry*}` | `compiler/crates/beskid_isle/src/lib.rs` | Emitter + `verify_function` |
| `classify_syntax_node_kind` / `syntax_node_kind_catalogue` | `beskid_isle/src/lib.rs` | Typed-operation inventory disposition |

**Live consumers outside exclusive scope (call into A):** `beskid_engine::services` (`lower_prepared_syntax_*`, `lower_syntax_program`), `beskid_aot::prepared_syntax`, `beskid_cli` `syntax_codegen`, `beskid_tests` fixture harness.

**Status:** spine **already complete** for curated sources; Corelib/real I/O **partially implemented** / execute **implemented but unverified**.

---

### Exact gaps

1. **OpenSpec `2.3` bijective inventory vs executable Corelib surface** — **partially implemented**  
   Catalogue + classification tests exist (`rule_coverage.rs`); OpenSpec task `2.3` still unchecked. Linear CYB-13 Done ≠ full Corelib-surface rule/fact completeness.

2. **`MissingRuleOrFact` / Corelib item bodies (historically `Block` / `TestDefinition`)** — **partially implemented**  
   - Rules exist: `statements.isle` (`BlockExpression`, `TestDefinition` cursors); `expressions.isle` (`emit_block_expression`); both kinds `IsleLowered` in `classify_syntax_node_kind`.  
   - CYB-133 repro (older pins): `MissingRuleOrFact … Output.bd … Block@…`.  
   - Tip Corelib run `29977866969` (`c765ef51` / this compiler): `Generate CLIF` / `clif.end outcome=ok` for `output_writeline_smoke` then **post-JIT SIGILL** — CLIF selection for that smoke appears past the historical Block miss; residual Corelib failures cluster under W5.9* (match/generics/ABI), not “no Block rule”.

3. **Enum-match completeness** — **partially implemented**  
   Tag switch: `memory.isle` → `emit_match` / `emit_match_statement`. Missing: payload bind, nested/literal/struct patterns, guards (`isle-lowering-coverage.md` #8; CYB-137/160).

4. **Aggregates / generics / specialization** — **partially implemented**  
   Struct/array/enum literal+field rules present; heap `T[]` index write, event-field projections, generic call ABI specialization harvest still open (coverage #5; CYB-140/162/158).

5. **Closures / freestanding lambda values** — **partially implemented**  
   Zero-arg / capturing **spawn** lambda paths in harness + module trampolines. `LambdaExpression` is intentional `UnsupportedTypedOperation` (W4.1 roster). Freestanding lambda values still fail closed with `MissingRuleOrFact`.

6. **Spawn** — **partially implemented**  
   `SpawnExpression` is `IsleLowered`; `emit_spawn` + trampoline expansion in `module_emission.rs`. Argument-bearing / unsupported spawn shapes still fail closed (harness negative tests).

7. **Trusted intrinsics** — **implemented but unverified** at release scale  
   `runtime_intrinsics.isle` + capability-gated facts; harness `canonical_runtime_production_path_lowers_trusted_intrinsics_to_verified_clif`. Bootstrap-only corpus (`runtime/beskid/src/Runtime/Bootstrap.bd`).

8. **Composition (`With`/`Launch`) / host registry** — **confirmed missing** (intentional 0.4 reject)  
   In `UNSUPPORTED_TYPED_OPERATION_KINDS`.

9. **Compound assign / event subscribe / for-over-collection / multi-segment path assign** — **confirmed missing** (coverage #6–7, #9–11).

10. **Legacy HIR/`Lowerable` tree** — **partially implemented** (retired, not deleted)  
    `lower_program*` returns `CodegenError::retired_hir_lowering_path()`; `Lowerable` not publicly re-exported; large `lowering/**` retained for CYB-35/36.

11. **`items.isle` MethodDefinition rule** — **partially implemented**  
    `MethodDefinition` classified `IsleLowered`; body comes from `beskid_queries::item_body`, not an ISLE `item_body` rule (only Function/Test in `items.isle`).

12. **Coverage doc drift** — `compiler/docs/isle-lowering-coverage.md` still claims Spawn/Lambda lack `NodeKind`; tip has `SpawnExpression` and treats Lambda as unsupported — treat doc as **stale** for those rows.

---

### Affected files and symbols

**Boundary / emit**
- `CodegenInput`, `CodegenInputError` — `codegen_input.rs`
- `PreparedSyntaxEntrypoint`, `lower_*` — `prepared_syntax.rs`
- `lower_syntax_program`, `SyntaxModuleItem`, spawn trampoline + `verify_function` — `module_emission.rs`
- `SyntaxNodeFacts`, `emit_isle_*`, `map_node_kind` — `isle_adapter.rs`
- `RETIRED_HIR_LOWERING_PATH`, `CodegenError::retired_hir_lowering_path` — `errors.rs`
- `Lowerable`, `lower_program*` — `lowering/lowerable.rs` (+ `lowering/expressions|statements/**` impls)

**ISLE**
- Catalogue: `classify_syntax_node_kind`, `UNSUPPORTED_TYPED_OPERATION_KINDS`, `LoweringErrorKind::MissingRuleOrFact`, `FunctionEmissionError::{Lowering,Verification}`, `display_with_db` — `beskid_isle/src/lib.rs`
- Rules: `isle/{types,ast,expressions,literals,binary,unary_casts,control_flow,calls,runtime_intrinsics,dispatch,memory,statements,items,primitives}.isle`
- Glue: `clif_primitives.rs`, `dispatch.rs`

**Inventory / harness tests**
- `beskid_isle/tests/rule_coverage.rs` — catalogue totality, unsupported bijection, operator rules, evidence map
- `beskid_codegen/tests/parsed_project_isle_harness.rs` — CYB-15 production path
- `beskid_codegen/tests/{isle_adapter,codegen_input,prepared_syntax}.rs`
- Per-construct: `beskid_isle/tests/{leaf_clif,locals,array_memory,struct_memory,enum_match,if_else,while_transfer,block_*,direct_calls,statement_emitter,function_emitter}.rs`

**Span formatting (queries, Agent B owns facts)**  
- `format_ast_node_site`, `node_span` — `beskid_queries/src/semantic_contract.rs`

---

### Proposed implementation sequence (small reviewable units)

1. **Re-pin Corelib CLIF failures on tip** — distinguish remaining `MissingRuleOrFact` sites vs post-CLIF abort (refresh CYB-133 acceptance vs run `29977866969`).
2. **Match family (payload discard → bind → guards)** — extend `emit_match*` + facts; leave composition unsupported.
3. **Generic/specialization harvest for reachable Corelib helpers** — `emit_isle_item_with_services_specialization` consumers (feeds aggregates/calls).
4. **Heap index write + compound assign** — everyday imperative gaps from coverage #5–6.
5. **Align `items.isle` MethodDefinition** (optional consistency) or document query-only body selection.
6. **Span-bearing spawn-trampoline verification** — thread `AstNodeKey` into `module_emission` trampoline `verify_function` errors.
7. **Refresh `isle-lowering-coverage.md`** to tip (Spawn/Lambda/Test/Block).
8. **Defer** HIR/`Lowerable` deletion (CYB-35/36) until consumers proven; **defer** freestanding lambda / composition until after one Linux smoke.

---

### Tests to write first

1. **Core.Output / Core.Syscall fixture** through `lower_syntax_assembly_entrypoint` → every function `verify_function` (exact CYB-133/132 sources, tip SHAs).
2. **Unit-enum discard-payload match** regression (CYB-137/160).
3. **Generic Result / specialized callee** module emission regression (CYB-140 family).
4. Keep green: `parsed_project_isle_harness.rs` (structs/if/calls/spawn/methods/Bootstrap intrinsics + closed unsupported).
5. Negative: freestanding `LambdaExpression` / `LaunchStatement` still `MissingRuleOrFact` + `Construct@span` (no HIR fallback).

---

### Acceptance commands

```bash
# Agent A focused
cargo test -p beskid_codegen --all-targets
cargo test -p beskid_isle --all-targets

# Production-path / Corelib (needs kit; Agent C/D for execute)
CORELIB_REPORT_DIR="$(mktemp -d)" bash scripts/ci/corelib-gate.sh

# Retirement / HIR-free scan (Agent D primary)
bash compiler/scripts/verify-hir-free-abi-v5.sh
```

Harness-local proof already encoded: `parsed_project_reaches_verified_isle_without_a_legacy_codegen_entrypoint`, `canonical_runtime_production_path_lowers_trusted_intrinsics_to_verified_clif`, `retired_public_codegen_facade_is_absent`, `remaining_hir_driver_is_rejected_without_fallback`.

---

### Dependencies on semantic facts and runtime authority

| Need | Owner | Why |
| --- | --- | --- |
| `block_statement_nodes` / `test_statement_nodes` / `item_body` / `node_kind` / `node_span` | Agent B (`beskid_queries`) | Cursor + site labels; Block/Test traversal |
| Match arm / payload / enum layout facts | Agent B | `emit_match` fails closed without them |
| Generic call specialization / ABI signatures | Agent B + A harvest | Corelib helpers |
| `runtime_intrinsic_capability` / `corelib_service_capability` | Agent C (ABI/runtime authority) | Trusted / syscall imports on `CodegenInput` |
| Exact ABI-v5 kit symbols (`beskid_rt_v5_*`) | Agent C/D | Spawn/closure/GC/fiber; post-CLIF SIGILL |
| Composition container facts | deferred | With/Launch stay unsupported |

---

### Assumptions

- Production JIT/AOT/CLI already call `lower_syntax_*` / `CodegenInput` only (no live `lower_program` success path).
- Tip OutputWriteLine CLIF success in run `29977866969` means historical Output `Block@` miss may be fixed or bypassed; CYB-133 Linear text may lag tip — treat execute abort as separate from missing Block **rule**.
- `isle-lowering-coverage.md` “Rules to implement” remains the best checklist for incomplete *executable* coverage after classification.
- Single-root assemblies are valid (`CodegenInput` requires ≥1 root, not multi-unit); multi-unit is required for real projects and is already exercised in harness.

---

### Cross-scope dependencies (do not solve; name owning agent B/C/D)

| Dependency | Agent |
| --- | --- |
| Generation-safe facts for match/payload, generics, layouts, spans | **B** (`beskid_queries` / analysis) |
| Corelib fixture type-surface (CYB-132 semantic errors) | **B** (+ fixtures) |
| ABI-v5 kit, Bootstrap corpus expansion, intrinsic/syscall authority | **C** |
| Engine JIT attach, `interop_dispatch_*` retirement, SIGILL after `Finalize JIT module`, Linux clean-prefix proof | **D** |
| HIR/`Lowerable` deletion (CYB-35/36), retirement scan green | **D** (after A/C consumers) |
| Clippy gate / release evidence plumbing | outside A (W7 / CYB-40+) |

---

### Task verdicts (research checklist)

| # | Verdict |
| --- | --- |
| 1 Production entry points | **already complete** (symbols/files above) |
| 2 HIR / Lowerable / single-unit | Drivers **retired** (live fail-closed); impl tree **confirmed present** (test/debt); multi-root **already complete** in production helpers |
| 3 Inventory vs ISLE coverage | Classification **already complete**; executable bijective Corelib coverage **partially implemented** (OpenSpec `2.3` open) |
| 4 MissingRuleOrFact gaps | Rules for Block/Test **already complete**; residual families match/aggregates/generics/unsupported ops **partially implemented** / **confirmed missing** |
| 5 CYB-15 harness | **already complete** — `parsed_project_isle_harness.rs` + Linear Done |
| 6 Spans → verifier diagnostics | **already complete** for ISLE `FunctionEmissionError` via `display_with_db` / `format_ast_node_site`; spawn trampoline verify **partially implemented** (message without AST site) |
| 7 Min work for one real project | Harness projects **already complete**; first *real* project (Core.Output smoke) needs remaining W5.9 fact/match/specialization (A+B) then kit/JIT execute (C+D) — CLIF alone insufficient on tip