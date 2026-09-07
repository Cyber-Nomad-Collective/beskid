# Collection-Literal Desugar — `bulk` Parameters, `Of(...)` Constructors, `New<Object>` Generator

**Status:** Design (no implementation). **Date:** 2026-08-17.
**Scope:** `beskid_analysis`, `beskid_queries`, `beskid_isle`, `beskid_codegen`, `beskid_abi`, `beskid_pipeline`, `beskid_ast_reflect_gen`, `corelib`.

**Pipeline invariant (reaffirmed):** parse → `MACRO_EXPAND` → `MOD_LOAD` → `MOD_COLLECT` → `MOD_GENERATE` → `SYNTAX_GENERATION` → `SEMANTIC` → … → `LOWER` → `CODEGEN_CLIF`. No HIR. Production lowering is `TypedProgram → CodegenInput → ISLE → CLIF` (`compiler/crates/beskid_pipeline/src/phases.rs:111-135` `FULL_BUILD_PHASE_ORDER`).

---

## 1. `bulk` parameter modifier (grammar + parser + AST + reflect-gen)

### 1.1 Convention to reuse (single DRY path)

The existing parameter-modifier convention is exactly one path:

- **Grammar:** `compiler/crates/beskid_analysis/src/beskid.pest:209`
  ```pest
  Parameter = { MutKeyword? ~ BeskidType ~ Identifier }
  ```
  `MutKeyword` is a silent atomic at `beskid.pest:37` (`MutKeyword = @{ "mut" ~ !(ASCII_ALPHANUMERIC | "_") }`). It is listed in the `Keyword` union (`beskid.pest:64-109`) so it cannot be used as an identifier.

- **AST node:** `compiler/crates/beskid_analysis/src/syntax/types/parameter.rs:7-14`
  ```rust
  pub struct Parameter {
      #[ast(skip)]
      pub mutable: bool,
      #[ast(child)]
      pub name: Spanned<Identifier>,
      #[ast(child)]
      pub ty: Spanned<Type>,
  }
  ```
  The `mutable` flag is `#[ast(skip)]` — it is **not** mirrored into the SDK and **not** a child node; it is a parser-derived boolean.

- **Parser:** `parameter.rs:16-42` `impl Parsable for Parameter`. The convention is: peek the first inner pair; if it matches `Rule::MutKeyword`, consume it and set the flag, else treat the first pair as the type. This is the **only** modifier-handling site for parameters.

- **Reflect-gen mirror:** `compiler/corelib/packages/compiler-sdk/src/Beskid/Syntax/Nodes/Parameter.bd:11-14` lists only `name` and `ty`. The `#[ast(skip)] mutable` flag is intentionally absent. Regeneration is driven by `compiler/corelib/packages/compiler-sdk/regen_mod_sdk_surfaces.sh:29-32` (`write_syntax` → `cargo run -p beskid_ast_reflect_gen --emit-syntax-sdk`), which walks `crates/beskid_analysis/src` (`main.rs:117-122`).

### 1.2 `bulk` integration (diff sketch, not code)

**Grammar** — add a silent atomic keyword and extend the single `Parameter` rule:
- `beskid.pest` near line 37: add `BulkKeyword = @{ "bulk" ~ !(ASCII_ALPHANUMERIC | "_") }`.
- `beskid.pest:64-109` `Keyword` union: add `BulkKeyword` so `bulk` is reserved.
- `beskid.pest:209` `Parameter`: extend to `Parameter = { BulkKeyword? ~ MutKeyword? ~ BeskidType ~ Identifier }`.

  Order decision: `bulk` before `mut` (a bulk parameter may also be mutable; `bulk` is the outermost calling-convention modifier). This keeps `mut` parsing (`parameter.rs:28`) unchanged in its position relative to the type.

**AST node** — `parameter.rs:7-14`: add one `#[ast(skip)]` flag mirroring `mutable`:
```
#[ast(skip)]
pub bulk: bool,
```
Stays `#[ast(skip)]` so the SDK mirror is unchanged in shape (consistent with `mutable`).

**Parser** — `parameter.rs:16-42`: extend the first-pair peek to also recognize `Rule::BulkKeyword` before the existing `MutKeyword` check. The current logic consumes at most one leading modifier; the new logic consumes up to two (`bulk`, then `mut`) in fixed order. This is the **single** parsing-convention path to extend — no other parameter parser touches modifiers (`host_definition.rs:282`, `field.rs:115`, `parse_helpers.rs:36` all delegate to `Parameter::parse`).

**Reflect-gen + SDK mirror** — no source change needed in `beskid_ast_reflect_gen`; `regen_mod_sdk_surfaces.sh` re-run produces an unchanged `Parameter.bd` (the new flag is `#[ast(skip)]`). The doc-comment at `Parameter.bd:6` ("optional `mut`…") is generated from the Rust doc comment at `parameter.rs:5`; update that doc comment to mention `bulk` so the regenerated mirror documents it.

### 1.3 Semantic surface (prerequisite for §2)

`bulk` must be visible to lowering as a parameter property. A new Salsa fact `bulk_parameter(db, key) -> Option<BulkParameterFact>` (element ABI type + parameter index) is needed in `beskid_queries/src/semantic_contract/` (sibling to `call_signature`/`call_arguments`). This is the authority the bulk-call lowering in §2 reads. (The existing `call_signature` fact is produced in `beskid_queries/src/semantic_contract/abi/signatures.rs:119-131`; bulk does not change the signature shape — the callee still receives one array parameter — so `call_signature` is unchanged. The fact only marks *which* parameter is bulk and its element ABI, for call-site packing.)

---

## 2. `Of(...)` bulk constructors + lowering path

### 2.1 Corelib signatures (6 collections)

All live in `compiler/corelib/packages/...` (Beskid sources). The `bulk` modifier (§1) makes the callee receive an array while callers pass N scalars:

- `Array.Of<T>(bulk T[] values) -> T[]` — body: `return values;`
- `List.Of<T>(bulk T[] values) -> List<T>` — body wraps the array (corelib `List` constructor over the bulk array).
- `Queue.Of<T>(bulk T[] values) -> Queue<T>`
- `Stack.Of<T>(bulk T[] values) -> Stack<T>`
- `Set.Of<T>(bulk T[] values) -> Set<T>` — body iterates `values` and inserts (Set has no bulk-insert intrinsic; a Beskid loop is fine — Set is a corelib type, not a runtime intrinsic).
- `Map.Of<TKey,TValue>(bulk (TKey,TValue)[] entries) -> Map<TKey,TValue>` — **decision: paired entries, not split keys/values.** Rationale: a single `bulk` parameter keeps the calling convention uniform across all six collections and avoids a multi-bulk grammar. The desugar pass (§4) emits `Map.Of({k1,v1},{k2,v2})` where each `{k,v}` is a tuple literal. This requires tuple literals to be expressible; if tuples are not a corelib type today, this is **Blocker B-1** (§6).

  Alternative considered: two `bulk` parameters (`bulk TKey[] keys, bulk TValue[] values`). Rejected: the grammar in §1 admits at most one `bulk` per parameter list position but does not forbid two; however uniform single-bulk is simpler and the desugar pass can pair. Keep single-bulk unless tuple literals are unavailable (then revisit).

### 2.2 Lowering path for a `bulk` call — the central question

**How a `CallExpression` lowers today:**
- `call_kind` is classified in `compiler/crates/beskid_codegen/src/isle_adapter/facts_node.rs:153-175`: `PrimitiveNumericConversion` → `RuntimeIntrinsic` → `CollectionOperation` → `Dynamic` → `InlineLambda` → `Direct`.
- `CollectionOperation` is selected only when the callee resolves to `["Array.bd","Collections","Core"]` AND the function name is one of `Append`/`Capacity`/`Clear`/`RemoveLast` (`beskid_queries/src/semantic_contract/queries.rs:113-174`). `Of` is **not** in that match, so `Array.Of` does **not** route through `collection_operation`.
- Everything else with a resolved declaration falls to `CallKind::Direct` → ISLE rule `emit_direct_call` (`calls.isle:10-13`).
- `emit_direct_call` → `import_direct_call` (`calls.rs:27-53`), which at `calls.rs:37-40` **rejects arity mismatch**: `if argument_keys.len() != signature.params.len() { return None; }`. A bulk call has N scalar args but a 1-parameter signature → **`emit_direct_call` cannot handle bulk as-is.**

**Decision: `bulk` needs a new ISLE rule `emit_bulk_call`, not a reuse of `emit_direct_call`.** The call site must pack the N scalar args into a fresh rooted array, then direct-call the callee with that single array. Reusing `emit_direct_call` would require the desugar pass to pre-pack args into an array literal — but that reintroduces `ArrayLiteralExpression` (the very node we are purging in §5) and defeats the `bulk` feature.

**New `CallKind` variant:** add `Bulk` to `beskid_isle/src/facts.rs:269-276` `enum CallKind`. Classification in `facts_node.rs:153-175` gains an early branch: if the callee's `bulk_parameter` fact (§1.3) is `Some`, return `CallKind::Bulk` (ahead of the `Direct` fallback; it may sit after `CollectionOperation` since `Of` is not a collection operation).

**New ISLE rule** in `calls.isle`:
```
(decl partial emit_bulk_call (AstNodeKey) Value)
(extern constructor emit_bulk_call emit_bulk_call)
(rule (lower_expression key @ (and
        (node_kind (NodeKind.CallExpression))
        (call_kind (CallKind.Bulk))))
      (emit_bulk_call key))
```

**`emit_bulk_call` body** (new Rust method in `beskid_isle/src/context/calls.rs`, sibling of `import_direct_call`):
1. Read `bulk_parameter` fact → element ABI type + parameter index.
2. Read `call_arguments` (`facts.rs:537`) → N scalar arg keys.
3. Allocate a rooted array of length N with the element descriptor — **reuse the exact sequence from `emit_array_literal`** (`aggregate.rs:33-89`): `beskid_rt_v5_array_allocate_rooted` + per-element store + `beskid_rt_v5_array_write_barrier` for pointer elements + `beskid_rt_v5_array_construction_finish`.
4. Direct-call the callee (via `import_direct_call`-style import) with the array as the sole argument.

**Runtime helper:** **No new runtime helper is required.** The packing reuses the three existing helpers already imported by `emit_array_literal` (`aggregate.rs:50,71,84`): `beskid_rt_v5_array_allocate_rooted`, `beskid_rt_v5_array_write_barrier`, `beskid_rt_v5_array_construction_finish`. The prompt's suggested `beskid_rt_v5_array_from_values` is **not** needed because the scalar args are SSA values (not a contiguous stack buffer), so a store loop is mandatory regardless. A `from_values` helper would only help if scalars were already contiguous, which they are not.

**Static-data plan:** `emit_array_literal` reads `managed_array_allocation` (`facts.rs:549`) which comes from `array_static_plan` (`beskid_codegen/src/array_static.rs:105-151`) — a per-literal immutable element descriptor + allocation request emitted as module data (`module_emission/data.rs:24-33`, `module_emission/orchestration.rs:314-357`). For bulk calls there is **no `ArrayLiteralExpression` node** to key a static plan on. Two options:
- **(A) New `bulk_array_static_plan`** keyed on the `CallExpression` node, parallel to `array_static_plan`, emitting the same three data symbols. This is the DRY-consistent choice (same `emit_array_static_data` in `array_static.rs:35-96`).
- **(B) Runtime-built descriptor** from element ABI at call time (no static data). Rejected: the ABI-v5 descriptor is immutable metadata that the runtime validates; building it at runtime diverges from the literal path.

**Decision: Option A.** Add `bulk_array_static_plan(key)` in `array_static.rs` (sibling of `array_static_plan`), driven by `bulk_parameter` + `call_arguments` instead of `array_elements`. The element ABI comes from the `bulk_parameter` fact (the declared `T`), not from inspecting the args — this is the same authority `empty_array_literal_element_abi_type` uses (`layouts/aggregate.rs:47-89`): declared type over inferred. `collect_array_static_plans` (`module_emission/data.rs:24-33`) is extended to also collect bulk-call plans.

### 2.3 Confirmation: avoids the `Append` owner-slot blocker

`CollectionOperation::Append` requires `CollectionMutationOwner::Local`/`AggregateField` provenance (`queries.rs:136-168`) and `emit_collection_operation_value` enforces the owner slot at `calls.rs:94-181` (trapz/trapnz on owner publication). `Array.Of` is a **constructor**, not a mutation:
- It does not match `collection_operation` (function name `Of` is absent from `queries.rs:135-174`), so it never produces `CollectionOperation::Append`.
- It lowers via `CallKind::Bulk` → `emit_bulk_call`, which allocates a **fresh** rooted array (no existing owner to prove) and passes it by value. No `CollectionMutationOwner` fact is consulted. The blocker is structurally avoided.

---

## 3. `New<Object>` static factory generator + struct-literal desugar

### 3.1 Existing mod-generator pattern (the one precedent)

The only existing mod is `compiler/corelib/mods/corelib_pest_gen/`:
- `Mod.bd:7-17` — `PestCollector : Collector` returns `CollectTargetSet { targetIds: Targets.GrammarTargetIds() }`; `PestGen : Generator` returns `Emit.BuildAll()`.
- `Emit.bd:5-13` — `BuildAll()` returns `Contribution.FromCodeOutputs([Contribution.CodeOutput(modulePath, fileName, Contribution.CodeBody("beskid", ...))])`. This is the **text-contribution** path: generated source text that is re-parsed.
- `Targets.bd` — stable target-id strings.

**Two contribution paths exist** (`Collect.bd:42-59` in the hand-maintained SDK surface):
1. `CodeContribution` / `codeOutputs` — text re-parsed in `SYNTAX_GENERATION` (`mod_host/reparse.rs:9-43`).
2. `SyntaxContributionItem` / `items` — typed AST merged in `MOD_GENERATE` (`mod_host/merge.rs:8-41`, `mod_host/generate.rs:25-66`).

The `New` generator should use **path 1 (text contribution)** for parity with the one existing generator and because typed-AST construction of arbitrary struct bodies in Beskid is more complex than emitting source text.

### 3.2 Generator contract usage

`Generator.Generate(GenerationRequest request) -> GeneratedSyntaxContribution` (`Collect.bd:67-69`). The `GenerationRequest` (`Collect.bd:19-22`, ABI `mod_contract.rs:117-123`) carries `context: CollectRequest` + `targets: CollectTargetSet`.

### 3.3 Enumerating struct types — BLOCKER

**`CollectRequest` exposes NO type table.** `mod_contract.rs:101-108`:
```rust
pub struct ModCollectRequest {
    pub compilation: ModCompilation,
    pub workspace: ModWorkspace,
    pub mods: ModCatalog,
}
```
`ModCompilation` (`mod_contract.rs:19-28`) carries only project name/root, target triple, syntax generation id, entry source path/name. `ModWorkspace` (`mod_contract.rs:47-54`) carries root path + members + lock hash. **There is no symbol/type table, no struct-declaration list, no AST access.** `GenerationRequest` adds only `targets: ModCollectTargetSet { target_ids: ModStrSlice }` (`mod_contract.rs:110-123`) — opaque strings.

The existing `corelib_pest_gen` generator does not enumerate any types; it emits a fixed module (`Targets.bd`). It never needed the type table. **The `New` generator cannot enumerate struct types from the request payload alone.**

This is **Blocker B-2 (§6):** the mod contract ABI does not expose the type table to generators. To implement `New` as a mod, one of the following human decisions is required:
- **(B-2a)** Extend `ModCollectRequest`/`ModGenerationRequest` with a struct-declaration table (new ABI field + SDK `Collect.bd` field + `beskid_abi` marshaling). This is an ABI-versioned change (the runtime-kit/ABI-v5 surface is fail-closed on mismatch — `AGENTS.md`).
- **(B-2b)** Drive `New` generation from the **Collector** instead: the Collector runs against `CollectRequest` and returns `targetIds`; but the Collector has the same limited payload, so it cannot enumerate either.
- **(B-2c)** Do not implement `New` as a mod. Implement it as a **compiler-internal generation pass** in Rust (inside `beskid_analysis` or `beskid_queries`) that runs in `MOD_GENERATE`/`SYNTAX_GENERATION` with direct access to the `TypedProgram`/syntax index. This bypasses the mod ABI entirely and is the lowest-risk path. The `corelib_pest_gen` precedent is a *mod*; a compiler-internal generator is a new precedent but avoids ABI churn.

**Recommendation: B-2c** (compiler-internal `New` generator) unless the team explicitly wants `New` to be a mod, in which case B-2a is required first. The rest of §3 assumes B-2c.

### 3.4 `New` body design — loop avoidance via phase order

**The infinite-desugar loop concern:** the `New` body constructs the struct. If it uses a struct literal `ObjectName { field: field }` and the desugar pass (§4) rewrites struct literals to `ObjectName.New(...)`, the body recurses forever.

**Phase order resolves this for free.** `FULL_BUILD_PHASE_ORDER` (`phases.rs:111-135`): `PARSE → MACRO_EXPAND → MOD_LOAD → MOD_COLLECT → MOD_GENERATE → SYNTAX_GENERATION → SEMANTIC`. The desugar pass lives in `MACRO_EXPAND` (§4). `New` generation lives in `MOD_GENERATE` (after `MACRO_EXPAND`). **Generated code is produced after the desugar pass has already run; it is never re-desugared** because:
- `MACRO_EXPAND` runs once per source unit before `MOD_GENERATE` (`phases.rs:118-121`).
- The macro expander runs to a fixed point *within* `MACRO_EXPAND` (`macros/expand.rs:200-210`), then stops. It is not re-invoked after `MOD_GENERATE`.
- `SYNTAX_GENERATION` (`mod_host/reparse.rs:9-43`) only re-**parses** merged text contributions; it does **not** re-run `MACRO_EXPAND` (the reparse path calls `parse_program_with_source_name` only — `reparse.rs:41`).

**Therefore:** the `New` generator may emit a body that uses a struct literal `ObjectName { field: field }` directly, and the desugar pass will not touch it. This is Option C in the prompt, confirmed sound. No intrinsic (`__managed_object_allocate`) is needed in the body; the body is plain Beskid.

**Caveat to verify at implementation time:** confirm that the reparse path (`reparse.rs`) does not feed back into `expand_program_with_diagnostics` (`db/syntax.rs:183-188`). From the code, `reparse_if_needed` returns a `Spanned<Program>` directly to the mod host; the Salsa `parse_and_expand` (`db/syntax.rs:174-199`) runs `expand_program_with_diagnostics` only on the *original* source, not on re-parsed generated text. So generated text is parsed but not macro-expanded. **Sound.** (If a generated `New` body itself contained a `name!` macro invocation, that macro would not expand — but the `New` body is plain struct-literal construction, so this is fine.)

### 3.5 Call shape of the desugared struct literal

**Decision: `ObjectName.New(Field, Value)` — positional call, not `New { Field: Value }`.** Rationale:
- `CallExpression` (`call_expression.rs:12-17`) already supports `callee + args`. A positional call reuses the entire existing direct-call lowering (`calls.isle:10-13`) with no new CallKind.
- A `New { Field: Value }` shape would require either a new grammar production or reusing `StructLiteralExpression` with a `New` path — but `StructLiteralExpression` is the node being purged in §5. Reusing it for `New` would defeat the purge.
- Positional args require the generator to emit parameters in **declaration order** (the `TypeDefinition.fields` order, filtered to `FieldKind::Value` — `layouts/aggregate.rs:21`). The desugar pass maps struct-literal fields (which may be written in any order by the user) to positional args by field name → declaration index. This is the same index the layout facts use (`aggregate.rs:22-24`).

**Desugar:** `ObjectName { a: x, b: y }` → `ObjectName.New(x, y)` (reordered to declaration order). The `New` generator emits, per struct type `T`:
```
pub T New(<field-type> a, <field-type> b) {
    return T { a: a, b: b };
}
```
(using declaration-order field names). The body's struct literal is not re-desugared (§3.4).

**Generic structs:** if `T` has generic params, `New` must carry them: `T.New<G>(...)`. The grammar admits `GenericArguments` on `PathSegment` (`beskid.pest:170-171`), and `call_lowering` already resolves generic calls (`calls/resolution.rs:23-34`). The generator emits the generic `New` per struct; the desugar pass copies the type args from the struct literal's path to the `New` call's path.

---

## 4. Desugar pass insertion point

### 4.1 Insertion point — fold into `MACRO_EXPAND`

Two precedents:
1. Parse-time string-interpolation desugar: `syntax/expressions/literal_expression.rs:26-34` (inside `parse_literal_expression`, before the node is wrapped). This is parse-time, not phase-level.
2. Phase-level macro expansion: `macros/expand.rs` + `macros/walk.rs::map_expression` (already visits `ArrayLiteral` at `walk.rs:105-109` and `StructLiteral` at `walk.rs:60-73`).

**Recommendation: fold `desugar_collection_literals` into `macros/expand.rs::expand_once`** (`expand.rs:21-40`). Rationale:
- `expand_once` already drives a fixed-point loop over `map_expression` (`expand.rs:128-148` calling `walk.rs:8-114`). The desugar pass plugs into the same `map_expression` closure: when the closure sees `Expression::ArrayLiteral` or `Expression::StructLiteral`, it rewrites to a `CallExpression` and sets `changed = true`. The fixed point (`expand.rs:200-210`) re-runs until no literal remains.
- This shares the `MACRO_EXPAND` phase, the fixed-point driver, and the `map_expression` walker — no new phase, no new Salsa query.
- The alternative (a sibling query after `expand_program_with_diagnostics` in `db/syntax.rs:183`) would add a new Salsa query and a second pass over the program; it duplicates the walk infrastructure. Reject.

**Concrete edit point:** `expand.rs:136-147` — the closure passed to `map_expression` currently only handles `Expression::MacroInvocation`. Add branches for `Expression::ArrayLiteral` and `Expression::StructLiteral` that build a `CallExpression` (reusing `substitute.rs`-style span minting, §4.3) and return it with `*changed = true`.

### 4.2 Path resolution for `Set`/`Map` detection — limitation

The desugar pass runs in `MACRO_EXPAND`, **before** `SEMANTIC`/`SEMANTIC_NAME_RESOLUTION` (`phases.rs:118,123`). Name resolution is **not available** at desugar time. The pass cannot resolve `path` to `Core.Collections.Set`/`Map` via the symbol table.

**Decision: textual path matching.** The desugar pass inspects the `StructLiteralExpression.path` (`struct_literal_expression.rs:13-14`) segments textually:
- `ArrayLiteralExpression` (`array_literal_expression.rs`) → always desugars to `Core.Collections.Array.Of(...)` (array literals are unambiguous).
- `StructLiteralExpression` → desugar to `<path>.New(...)` **only if** the path's last segment is NOT a known non-struct (e.g. not an enum — `EnumConstructorExpression` is a separate node, `beskid.pest:329-331`, so no collision). Since every struct type gets a `New` (§3), **all** struct literals desugar to `New`. No per-type detection is needed — `Set { ... }` and `Map { ... }` desugar to `Set.New(...)`/`Map.New(...)` uniformly.

**Limitation documented:** if a user writes a struct literal for a type that has no `New` (e.g. a type from a mod that did not run a `New` generator, or a type defined in a non-`New`-generating context), the desugar produces a call to a missing `New` and the error surfaces at `SEMANTIC`/`call_lowering` (`calls/resolution.rs:59` `unavailable("call_lowering")`). This is acceptable: the `New` generator is a compiler-internal pass (B-2c) that runs for **every** struct in the program, so the missing-`New` case is a compiler bug, not a user-facing ambiguity. The textual approach is sound because struct-literal desugar is unconditional (all structs get `New`).

**Set/Map specifically:** `Set`/`Map` are corelib structs; they get `New` like any struct. Their struct literals desugar to `Set.New(field-values...)`/`Map.New(entry-tuples...)`. The `Of` constructors (§2) are a **separate** ergonomic entry point for the common `Set.Of(1,2,3)` case; the desugar pass does **not** rewrite struct literals to `Of` — `Of` is only the target of array-literal desugar and direct user calls. (If the team wants `Set { 1, 2, 3 }` to desugar to `Set.Of(1,2,3)` rather than `Set.New(...)`, that is a separate decision — the struct-literal grammar requires `Field: Value` pairs (`beskid.pest:333-335`), so `Set { 1, 2, 3 }` is not even valid syntax today. `Of` is the only ergonomic bulk form for Set/Map.)

### 4.3 Span reminting for synthetic nodes

The synthetic `CallExpression` and its `Path` callee need spans. Convention:
- `macros/substitute.rs:29-86` `binding_to_expression` mints synthetic nodes with a `fallback_span: SpanInfo` argument (the metavariable's span).
- `literal_expression.rs:117-228` `remap_expression_spans` is the precedent for recursively reminting spans on a synthetic tree; it handles `Expression::Call` (`literal_expression.rs:157-163`), `Expression::Path` (`:173-176`), `Expression::StructLiteral` (`:177-185`), `Expression::ArrayLiteral` (`:217-222`).

**Decision:** the desugar closure mints the `CallExpression` with `fallback_span` = the original literal's span (preserving the user-facing span for diagnostics), and reuses the literal's element/field spans for the call arguments (no remap needed — the args are the literal's existing children, moved not copied). The callee `Path` (`Core.Collections.Array.Of` / `<StructPath>.New`) is minted with the literal's span. This matches `substitute.rs:49-69` (path minting with `fallback_span`).

### 4.4 Salsa key stability

The desugar runs **inside** `expand_program_with_diagnostics` (`db/syntax.rs:183-188`), which returns `expanded.program: Spanned<Program>`. The Salsa query `parse_and_expand` (`db/syntax.rs:174-199`) and the fingerprint `expanded_syntax_fingerprint` (`db/syntax.rs:207-216`) operate on the `Spanned<Program>` output. **No new Salsa query, no key change.** The fingerprint (`syntax.rs:210-215`) serializes the program with spans removed (`remove_span_fields`, `syntax.rs:218-233`); the desugar changes the *shape* (ArrayLiteral → Call) which changes the fingerprint as expected — this is a content change, not a key change. Incremental invalidation behaves correctly: editing `[1,2,3]` to `[1,2]` changes the desugared call's args, which changes the fingerprint, which invalidates downstream `syntax_index`/semantic facts. **Stable.**

---

## 5. DRY purge scope

**Ordering constraint:** the desugar pass (§4) and the `Of`/`New` lowering + generator (§2, §3) **must land and be green before any purge**. The purge removes the literal-lowering paths only once literals no longer reach lowering (i.e. the desugar pass rewrites 100% of `ArrayLiteralExpression` and `StructLiteralExpression` nodes). A feature-flag period is **not** recommended (the prompt's preference: fail closed, no compatibility fallbacks) — land desugar + lowering, then purge in the same release boundary.

### 5.1 Array-literal purge (after `Array.Of` bulk path is live)

| File:line | Symbol | Action |
|---|---|---|
| `compiler/crates/beskid_isle/src/context/aggregate.rs:33-89` | `emit_array_literal` | Remove (logic moved to `emit_bulk_call`, §2.2) |
| `compiler/crates/beskid_isle/isle/memory.isle:5-6` | `(decl partial emit_array_literal …)` + extern | Remove decl+extern |
| `compiler/crates/beskid_isle/isle/memory.isle:38-39` | `(rule (lower_expression … ArrayLiteralExpression) …)` | Remove rule |
| `compiler/crates/beskid_codegen/src/array_static.rs` (entire file, 1-172) | `ArrayStaticPlan`, `emit_array_static_data`, `array_static_plan` | **Modify, not delete:** `array_static_plan` becomes `bulk_array_static_plan` (§2.2); `emit_array_static_data` is reused by both. Remove the literal-only `array_static_plan` and the `empty_array_literal_element_abi_type` call at `array_static.rs:118`. |
| `compiler/crates/beskid_codegen/src/isle_adapter/facts_node.rs:442-444` | `ArrayLiteralExpression` → pointer-type branch in `scalar_type` | Remove (no more array literals) |
| `compiler/crates/beskid_codegen/src/isle_adapter/facts_helpers.rs:78-89` | `array_elements_for_literal`, `array_layout_for_literal` | Remove (replaced by bulk-call facts) |
| `compiler/crates/beskid_queries/src/semantic_contract/layouts/aggregate.rs:47-89` | `empty_array_literal_element_abi_type_tracked` | Remove (no empty literals; bulk element ABI comes from `bulk_parameter`) |
| `compiler/crates/beskid_queries/src/semantic_contract/queries.rs:265-266` | `empty_array_literal_element_abi_type` re-export | Remove |
| `compiler/crates/beskid_queries/src/lib.rs:86` | `empty_array_literal_element_abi_type` re-export | Remove |
| `compiler/crates/beskid_codegen/src/artifact.rs:47` | `array_static_plans` field | Keep (now holds bulk plans) |
| `compiler/crates/beskid_codegen/src/module_emission/data.rs:24-33` | `collect_array_static_plans` | Modify: collect from bulk-call nodes instead of literal nodes |
| `compiler/crates/beskid_isle/tests/rule_coverage.rs:151,240` | `ArrayLiteralExpression` rule-coverage rows | Remove |
| `compiler/crates/beskid_isle/tests/array_memory.rs:135,141` | `ArrayLiteralExpression` mapping in test root enum | Remove |
| `compiler/crates/beskid_isle/tests/array_memory.rs:213` | `managed_array_allocation` test impl | Remove (no literals) |
| `compiler/crates/beskid_codegen/tests/isle_adapter/memory_aggregate_arrays.rs:5,65,69` | empty-array-literal test | Remove |
| `compiler/crates/beskid_codegen/tests/isle_adapter/support/prelude.rs:31`, `support.rs:36` | `empty_array_literal_element_abi_type` import | Remove |

### 5.2 Struct-literal purge — DECISION: do NOT fully purge

**Decision: struct literals are NOT fully routed through `New`.** The `New` generator's body (§3.4) uses a struct literal `T { a: a, b: b }`. If `emit_struct_literal` (`aggregate.rs:183-219`) and its ISLE rule (`memory.isle:9-10,44-45`) are purged, the `New` body cannot lower. Therefore:

- **Keep** `emit_struct_literal` (`aggregate.rs:183-219`), `memory.isle:9-10` (decl/extern), `memory.isle:44-45` (rule), struct layout facts (`layouts/aggregate.rs:6-28` `aggregate_layout_tracked`, `aggregate_literal_declaration_tracked`).
- **Keep** `managed_struct_allocation` (the struct counterpart of `managed_array_allocation`).
- **Purge** only the *user-facing* struct-literal desugar target — but since the desugar rewrites all user struct literals to `New` calls, and `New` bodies contain struct literals, the struct-literal lowering path remains live (used by `New` bodies). No struct-literal code becomes dead.

**Justification:** the prompt's purge scope for structs ("ONLY if struct literals fully route through `New`") is conditional. They do not fully route — `New` bodies use struct literals — so the struct-literal lowering stays. The DRY win for structs is the **user surface** (users write `T { … }` which desugars to `T.New(…)`), not the lowering path. The lowering path for struct literals remains the single implementation, now driven only by generated `New` bodies.

**If the team instead wants `New` bodies to use an intrinsic** (Option A in the prompt: `__managed_object_allocate` + field stores, never a struct literal), then `emit_struct_literal` could be purged and replaced by an intrinsic-based `New` body. This is a larger change (the `New` body would need `__managed_object_allocate` exposed to corelib Beskid, which it currently is not — `emit_struct_literal` calls it at `aggregate.rs:206-211` as a compiler-recognized helper, not a corelib-callable function). **Recommendation: keep struct-literal lowering; do not pursue Option A.** Flag as **Decision D-1 (§6)**.

### 5.3 Ordering

1. Land §1 (`bulk` grammar/parser/AST) + §1.3 (`bulk_parameter` fact).
2. Land §2 (`Of` constructors in corelib + `CallKind::Bulk` + `emit_bulk_call` + `bulk_array_static_plan`).
3. Land §3 (`New` generator, B-2c compiler-internal) + §4 (desugar pass in `expand_once`).
4. Verify: `cargo test -p beskid_analysis -p beskid_queries -p beskid_isle -p beskid_codegen` green; `just replace` builds; an end-to-end `[1,2,3]` and `T { a: 1 }` lower correctly.
5. Purge §5.1 (array-literal dead code). Keep §5.2 (struct-literal) as decided.
6. Re-run `regen_mod_sdk_surfaces.sh` (no SDK shape change expected — `bulk` is `#[ast(skip)]`).

---

## 6. Open blockers / human decisions

- **B-1 — Tuple literals for `Map.Of`.** `Map.Of` with a single `bulk (TKey,TValue)[]` parameter requires tuple literals (`{k,v}`). If Beskid has no tuple type/literal today, `Map.Of` must either (a) use two `bulk` parameters (grammar in §1 admits multiple `bulk` params — confirm), or (b) be deferred until tuples exist. **Needs investigation of corelib tuple support.** Not resolved by this design.
- **B-2 — Type table not exposed to mods.** `ModCollectRequest`/`ModGenerationRequest` (`mod_contract.rs:101-123`) carry no type/symbol table. The `New` generator cannot enumerate struct types as a mod. **Decision required:** B-2c (compiler-internal generator, recommended) vs B-2a (ABI extension to expose the type table — ABI-versioned, fail-closed on mismatch). This design assumes B-2c.
- **D-1 — `New` body via struct literal vs intrinsic.** This design keeps struct-literal lowering alive (§5.2) so `New` bodies use `T { … }`. If the team wants `emit_struct_literal` purged too, `New` bodies must use `__managed_object_allocate` + field stores, which requires exposing that intrinsic to corelib Beskid (currently compiler-internal at `aggregate.rs:206-211`). **Decision required.** Default: keep struct-literal lowering.
- **D-2 — `Set`/`Map` struct-literal desugar target.** Struct literals require `Field: Value` pairs (`beskid.pest:333-335`), so `Set { 1,2,3 }` is not valid syntax. `Set`/`Map` bulk construction is only via `Of(...)`. Confirm this is the intended UX (no `Set { … }` literal form). If a `Set { … }` literal form is wanted, it needs a grammar extension (out of scope here).
- **D-3 — `bulk` + `mut` interaction.** §1 orders `bulk` before `mut`. Confirm a bulk-mutable parameter is meaningful (the callee receives an array it can mutate locally). The lowering in §2.2 passes the array by value; local mutation in the callee is fine. No semantic change needed, but the grammar ordering is a human-confirmable choice.
- **D-4 — `regen_mod_sdk_surfaces.sh` drift.** The script's `write_collect` heredoc (`regen_mod_sdk_surfaces.sh:203-285`) emits `CollectFacadeVersion() = "0.3.0"` and lacks `CodeContribution`/`CodeString`/`CodeOutput`, while the checked-in `src/Beskid/Compiler/Collect.bd:1-93` has version `0.4.0` and includes those types. Running the script today would **regress** `Collect.bd`. This is pre-existing drift, not introduced by this design, but it blocks step 6 of §5.3 (re-running the script). **Human decision:** reconcile the script with the hand-maintained file before relying on it.
- **D-5 — `Of` for non-Array collections via `bulk`.** `List.Of`/`Queue.Of`/`Stack.Of` bodies wrap the bulk array in the collection's internal representation. This requires those corelib types to expose a constructor-from-array. Confirm corelib `List`/`Queue`/`Stack` have (or can get) such a constructor. Not investigated here.

---

## Evidence index (file:line)

- Phase order: `compiler/crates/beskid_pipeline/src/phases.rs:111-135`
- `Parameter` grammar: `compiler/crates/beskid_analysis/src/beskid.pest:209`; `MutKeyword:37`; `Keyword:64-109`
- `Parameter` AST: `compiler/crates/beskid_analysis/src/syntax/types/parameter.rs:7-14`; parser `:16-42`
- Parameter parse callers: `host_definition.rs:282-293`, `field.rs:115`, `parse_helpers.rs:36-40`
- SDK mirror: `compiler/corelib/packages/compiler-sdk/src/Beskid/Syntax/Nodes/Parameter.bd:11-14`; regen `regen_mod_sdk_surfaces.sh:29-32`
- `call_lowering`: `beskid_queries/src/semantic_contract/queries.rs:107-109`; `CallLowering` enum `model.rs:467-472`; resolution `calls/resolution.rs:5-78`
- `collection_operation`: `queries.rs:113-174` (Array.bd/Collections/Core + Append/Capacity/Clear/RemoveLast)
- `CallKind`: `beskid_isle/src/facts.rs:269-276`; classification `beskid_codegen/src/isle_adapter/facts_node.rs:153-175`
- `emit_direct_call` / `import_direct_call`: `beskid_isle/src/context/calls.rs:27-53` (arity check `:37-40`)
- `emit_collection_operation_value` (Append owner proof): `calls.rs:75-230`
- `emit_array_literal`: `beskid_isle/src/context/aggregate.rs:33-89`; `emit_struct_literal:183-219`
- ISLE rules: `memory.isle:5-6,9-10,24-52`; `calls.isle:1-28`
- `array_static_plan`: `beskid_codegen/src/array_static.rs:105-151`; `emit_array_static_data:35-96`; consumers `module_emission/data.rs:24-33`, `module_emission/orchestration.rs:314-357`; `artifact.rs:47`
- `managed_array_allocation` fact adapter: `facts_node.rs:370-373`; `array_elements_for_literal`/`array_layout_for_literal`: `facts_helpers.rs:78-89`
- `empty_array_literal_element_abi_type`: `layouts/aggregate.rs:47-89`; re-export `queries.rs:265-266`, `lib.rs:86`
- `scalar_type` ArrayLiteral branch: `facts_node.rs:442-444`
- Mod contract ABI: `beskid_abi/src/mod_contract.rs:101-123` (no type table)
- Mod generator precedent: `corelib/mods/corelib_pest_gen/Src/Mod.bd:7-17`, `Emit.bd:5-13`, `Targets.bd`
- Merge/reparse: `mod_host/merge.rs:8-41`, `mod_host/generate.rs:25-66`, `mod_host/reparse.rs:9-43`
- Macro expand: `macros/expand.rs:21-40,128-148,191-225`; `walk.rs:8-114` (ArrayLiteral `:105-109`, StructLiteral `:60-73`); `substitute.rs:29-86`
- String-interpolation desugar precedent: `syntax/expressions/literal_expression.rs:26-34,117-228`
- Salsa parse+expand: `beskid_queries/src/db/syntax.rs:174-216`
- `StructLiteralExpression`: `syntax/expressions/struct_literal_expression.rs:11-17`; `CallExpression:11-17`
- Tests: `beskid_isle/tests/rule_coverage.rs:151,240`; `beskid_isle/tests/array_memory.rs:135,141,213`; `beskid_codegen/tests/isle_adapter/memory_aggregate_arrays.rs:5,65,69`, `support/prelude.rs:31`, `support.rs:36`
