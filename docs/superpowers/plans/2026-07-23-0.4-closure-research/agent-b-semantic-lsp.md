# Agent B — Semantic facts & language services (Beskid 0.4)

Read-only survey of `compiler/crates/beskid_queries/**` and `compiler/crates/beskid_lsp/**` at compiler pin `ec164ff9`. Linear W2 (`CYB-6` / `CYB-16`–`19` / `CYB-64`) and W4 consumer migration are Done; residual risk sits under W5 Corelib typing/layout and incomplete runtime corpus.

---

### Status classifications (complete / partial / missing / unverified)

| Surface | Status | Evidence |
| --- | --- | --- |
| Generation-bound keys (`SourceUnitId`, `AstNodeKey`, `SyntaxGenerationId`, `SyntaxUnitInput`) | **Complete** | `semantic_contract.rs` (`SourceUnitId`, `AstNodeKey`, `SyntaxUnitInput::accepts_key`); registration in `db.rs` |
| Captures / modes (`ClosureCapture`, `CaptureStorageClass`, `capture_storage`) | **Complete** (facts) | APIs + tests `closure_environment_reports_*`, `spawn_legality_accepts_transferable_*` in `tests/semantic_facts.rs` |
| Closure envs (`closure_environment`, `closure_signature`, ABI shape + pointer-map requirement) | **Partial** | Facts exist; `ClosureLoweringStatus::NotLowered`, `ClosureAllocationStatus::NotAllocated` are explicit stubs (`semantic_contract.rs` ~262–286, `closure_signature` docs) |
| Spawn legality (`spawn_target`, `spawn_legality`, `spawn_entry_validation`) | **Complete** (syntax facts) | Public APIs + stale/reject tests; codegen consumes `spawn_entry_validation` (`isle_adapter.rs`) |
| Trusted runtime intrinsics (name vs capability) | **Complete** (authority model) | `runtime_intrinsic` / `runtime_intrinsic_name`; mint only via `build_canonical_runtime_typed_program` |
| Spans (`node_span`, `SourceSpan`, site formatters) | **Complete** | `node_span`, `format_ast_node_site` |
| Bodies (`item_body`, `block_statement_nodes`, `test_statement_nodes`) | **Complete** | Exported in `lib.rs` |
| Reachability (`direct_callees`, `reachable_items`) | **Complete** (fail-closed on unresolved Direct edges) | Tests `reachable_items_*`, `stale_generation_cannot_reuse_item_or_call_graph_facts` |
| Stale-generation fail-closed | **Complete** | `tests/generation_contract.rs`, many `stale_generation_*` in `semantic_facts.rs`; LSP `stale_typed_generation_fails_closed_*` |
| Mixed project-session rejection | **Complete** (registration) / **partial** (assembly helper) | `db.rs` `validate_existing_registration`; `project_session_for_syntax_assembly` error string; test `source_unit_cannot_be_reassigned_between_project_sessions` |
| Array / byte-buffer ABI types | **Missing** | `abi_type_from_syntax`: `Type::Array(_) => Err(unavailable)`; enum payloads coerce Array→`POINTER` inconsistently |
| `TypeUnknownValueType` / string-vs-`u8[]` diagnostics | **Unverified as live emit** | Kind exists in `diagnostic_kinds.rs` only; **no construction sites** in tree — historical cascade, mapped to RC4 |
| LSP off `Document.analysis` / HIR snapshots | **Complete** for feature handlers | `Document` holds only `syntax_*` facts (`store.rs`); handlers consume them |
| LSP diagnostics authority | **Partial** | Still runs `prepare_compilation_diagnostics_with_db` + analysis `with_semantic_diagnostics: true` when typed bundle is current |
| Canonical-runtime non-forgeability | **Complete** (mint path) | Opaque `RuntimeIntrinsicCapability`; exact corpus check; Corelib forge test |

---

### Missing facts grouped by consumer

#### Codegen (`beskid_codegen` / ISLE)

| Gap | Notes |
| --- | --- |
| Closure allocation / rooting facts beyond `NotAllocated` | Query layer intentionally stops at requirement (`ClosurePointerMapRequirement`); allocation is runtime/codegen (CYB-101/109 Done as leaves; corpus still thin) |
| Array / `u8[]` ABI identity | `abi_type` unavailable for arrays → MissingRuleOrFact / Dynamic fallthrough under Corelib I/O |
| Generic call specialization harvest completeness | Facts exist (`generic_call_specialization`); residual CYB-140/162 for reachable Corelib helpers |
| Event-bearing aggregate value projections | Layout excludes events (`aggregate_layout_tracked`); CYB-162 |
| Inferred / binding-flow closure call targets | `ClosureCallTarget` docs: local-bound closures unavailable |

#### LSP

| Gap | Notes |
| --- | --- |
| Live typed diagnostics from Salsa facts alone | Publish path still prepare-spine / analysis semantic diagnostics (`diagnostics.rs` `collect_syntax_diagnostics`) |
| Completion richness | Migrated to `completion_candidates(db, anchor, context)` but empty when `syntax_completion` unset / prepare fails |
| Nominal / composite type inlays | `syntax_type_label` only covers primitive `SemanticTypeId` constants — no aggregate/`type#N` labels |
| Documentation facts | Parsed from buffer text (`documentation_facts.rs`), not Salsa `AstNodeKey` queries |

#### Runtime

| Gap | Notes |
| --- | --- |
| User packages calling trusted intrinsics as imports | By design: `runtime_intrinsic_name` alone cannot authorize; needs capability on `TypedProgram` |
| Full Beskid runtime corpus facts | Corpus is Bootstrap-thin (`canonical_runtime_sources` → single `Bootstrap.bd`); blocks richer intrinsic surfaces |
| String-handle / byte-buffer provenance | Related to missing array ABI + CYB-156/158, not a dedicated query API |

---

### Likely root causes of recurring CI failures

1. **RC4 typing/layout (primary for historical “unknown value type” / “expected string, got u8[]”)**  
   - `SemanticTypeId` has `STRING` but **no array type**.  
   - `abi_type_from_syntax` fails closed on `Type::Array`; enum payload arrays become `POINTER`.  
   - Syscall signatures mix `STRING` vs `POINTER` (`__syscall_write` vs `__syscall_write_bytes`).  
   - Symptom cluster now mostly surfaces as Corelib CLIF/JIT failures (RC1/RC2/RC4), not fresh E1201 emits (`TypeUnknownValueType` is **dead construction-wise**).

2. **Unavailable / incomplete facts → `MissingRuleOrFact` cascades**  
   - Fail-closed `SemanticError::unavailable(...)` is correct for HIR-free path; Corelib hits shapes still returning unavailable (arrays, inferred callables, some generics).

3. **Stale typed-bundle races (LSP / IDE CI)**  
   - Mitigated: `is_typed_bundle_stale` → structural-only diagnostics.  
   - Risk remains if prepare and publish desync under debounce (`TYPEd_PREPARE_DEBOUNCE_MS = 120`).

4. **Mixed project-session (historical)**  
   - Hard-rejected at registration (`"a source unit cannot be reassigned to another project session"`).  
   - Assembly helper `project_session_for_syntax_assembly` rejects mixed owners.  
   - Root-causes doc: reopen only with fresh fixture — **no current failing test name found** beyond ownership regression.

5. **Canonical capability vs Dynamic builtins**  
   - Ordinary `__str_len` → `RuntimeIntrinsic` index but `CallLowering::Dynamic` (test `runtime_intrinsic_uses_the_manifest_owned_builtin_index`).  
   - Confusion between “manifest builtin” and “canonical-runtime import” can look like authority bugs when it is intentional.

---

### Exact APIs to add or replace

**Keep (authoritative):**  
`closure_environment`, `closure_signature`, `closure_call_target`, `capture_storage`, `spawn_target`, `spawn_legality`, `spawn_entry_validation`, `runtime_intrinsic`, `runtime_intrinsic_name`, `node_span`, `item_body`, `reachable_items`, `completion_candidates`, `build_typed_program`, `build_canonical_runtime_typed_program`, `build_canonical_corelib_syscall_typed_program` / `build_typed_program_with_corelib_services`.

**Add / extend (queries):**

| API / change | Why |
| --- | --- |
| `SemanticTypeId` array / byte-buffer identity (or explicit `ManagedString` vs `ByteSlice` facts) | Unify string vs `u8[]` / POINTER mismatch |
| `abi_type` / `node_type` for `Type::Array` and array literals | Today `unavailable` |
| Optional: `closure_allocation_plan` once runtime owns descriptors | Replace `NotAllocated` status with real fact or delete status and own it only in codegen |
| Generation-safe diagnostic facts API (replace prepare-spine typed diags for LSP) | Finish LSP off analysis typing without losing E-codes |

**Replace (LSP):**

| Current | Replace with |
| --- | --- |
| `prepare_compilation_diagnostics_with_db(..., with_semantic_diagnostics: true)` in `collect_syntax_diagnostics` | Query-layer diagnostic facts keyed by current `AstNodeKey` / file revision |
| Buffer-only `syntax_documentation_facts_for_source` long-term | Optional: Salsa-backed documentation queries (not blocking 0.4 if buffer facts stay revision-bound) |

**Do not reintroduce:** `Document.analysis`, HIR snapshots, public `Lowerable` (already retired from LSP `Document`).

---

### Regression-test matrix

| Concern | Existing tests | Suggested additions |
| --- | --- | --- |
| Stale generation → `Ok(None)` | `generation_contract::stale_generation_has_no_semantic_facts`; `semantic_facts::stale_generation_*` (spawn, closure, local slot, for-iterator, call graph) | Cover every newly added query family the same way |
| Project-session ownership | `source_unit_cannot_be_reassigned_between_project_sessions` | Fixture for `project_session_for_syntax_assembly` mixed-owner error (string exists; dedicated test not found) |
| Generation monotonicity / fingerprint | `generations_are_monotonic_*`, `source_fingerprint_cannot_be_resurrected_*`, `trivia_only_edit_*` | Keep as gate |
| Captures / spawn | `closure_*`, `spawn_legality_*` suite | Cross-unit spawn + nested mutable capture |
| Canonical runtime forge | Corelib forge tests in `semantic_facts.rs`; abi `canonical_runtime_sources` tests | Parallel forge test for `build_canonical_runtime_typed_program` (user copy of Bootstrap bytes/path) if not already in abi suite |
| LSP no analysis snapshot | `diagnostics_facts_work_without_legacy_analysis_snapshot`; `stale_typed_generation_fails_closed_*`; inlay/completion/code-action tests | Assert `Document` has no `analysis` field (compile-time) |
| LSP completion Salsa path | completion handler tests with registered anchor | Empty-anchor fail-closed |
| String vs bytes | `string_interpolation_desugar_uses_string_add_facts` | Explicit `__syscall_write` (string) vs `__syscall_write_bytes` (pointer) ABI + negative user-forge |
| Array ABI | **Missing** | `abi_type` on `u8[]` param / literal must not silently become `string` or `unavailable` without diagnostic |

Gate command still cited by CYB-6:  
`cargo test -p beskid_queries --tests -- --test-threads=1`  
plus LSP: `cargo test -p beskid_lsp --tests`.

---

### Dependencies that unblock codegen, runtime compilation, LSP migration

```text
[queries] array/string ABI facts ──► [codegen] Corelib I/O / ANSI / collections (Agent C)
                 │
                 └──► [runtime] string-handle / GC layouts (Agent D; CYB-156/158)

[queries] closure facts (Done) ──► [codegen] already consumes closure_environment / spawn_entry_validation
                                 └──► [runtime] allocation/rooting still corpus-thin (CYB-28/29)

[queries] TypedProgram + capability mint (Done) ──► [codegen] CodegenInput::runtime_intrinsic_capability
                                                  └──► [runtime kits] hash-matched publish (Agent D)

[LSP] generation-bound Document facts (Done for nav/hover/completion/inlay)
   └──► still blocked for full migration by prepare-spine typed diagnostics (partial)
         └──► needs query diagnostic API or analysis retirement (W6)

[analysis] SyntaxIndex / expanded Program ──► queries (authority input; Agent A parse recovery must not break indexes)
```

Unblocks Corelib green only together with Agent C ISLE coverage (RC1) and Agent D kit/JIT (RC2)—facts alone are not sufficient.

---

### Assumptions

- Linear Done on W2/W4 means **authority and consumer cutover**, not “every Corelib surface has a fact.”
- Historical E1201 / string-vs-`u8[]` messages are **subsumed by RC4** unless a fresh tip log shows them again.
- `Closure*Status::{NotLowered,NotAllocated}` is intentional query honesty, not a forgotten TODO inside queries.
- `CallLowering::Dynamic` for soft builtins is intentional and distinct from `Runtime(RuntimeIntrinsic)` / capability-gated imports.
- Cross-crate abi/runtime_source types are in scope for authority claims even though mint helpers live in `beskid_abi` (outside exclusive edit scope).

---

### Cross-scope notes for Agents A / C / D / E

| Agent | Note |
| --- | --- |
| **A (parse / syntax)** | Queries depend on `SyntaxIndex` + expanded `Program`. Recovery must preserve stable node ids / spans for generation keys. Array syntax must remain distinguishable from `string` if Agent B adds array ABI. |
| **C (codegen / ISLE)** | Consume `closure_environment` / `spawn_entry_validation` / `aggregate_layout` / `generic_call_specialization` already via `isle_adapter.rs`. Treat `unavailable` as hard missing fact—do not invent HIR fallback. Closures still report `NotLowered` at query layer; lowering ownership is yours. Priority: array/`POINTER`/`STRING` consistency for Syscall/Output. |
| **D (runtime / kits)** | Non-forgeable path: `prove_canonical_runtime_corpus` → `RuntimeIntrinsicCapability` → `build_canonical_runtime_typed_program` only. User packages cannot mint. Bootstrap-thin corpus limits intrinsic surface. String-handle overflow (CYB-156) likely needs layout facts Agent B does not yet expose for arrays. |
| **E (retirement / gates)** | LSP `Document.analysis` is gone; do not flag comments mentioning it as live debt. Dead `TypeUnknownValueType` variant may remain until W6 diagnostic cleanup. Prepare-spine diagnostics in LSP are residual consumer debt, not HIR snapshot debt. |

---

### Codebase facts table (Agent B)

| Fact | Path / symbol |
| --- | --- |
| Typed program + capabilities | `TypedProgram` in `semantic_contract.rs`; builders in `typed_program.rs` |
| Fail-closed query wrapper | `with_registered_syntax` → `Ok(None)` if unregistered |
| Project ownership | `BeskidDatabase::validate_existing_registration` |
| Mixed assembly sessions | `project_session_for_syntax_assembly` |
| Canonical mint | `build_canonical_runtime_typed_program`; `RuntimeIntrinsicCapability` in `beskid_abi::runtime_source` |
| LSP Document model | `beskid_lsp::session::store::Document` (`syntax_*` only) |
| LSP fact rebuild | `lifecycle::syntax_facts_for_entry` → `build_typed_program` + `resolved_item` / `node_type` / `completion` anchor |
| Array ABI hole | `abi_type_from_syntax` match arm `Type::Array(_) \| Type::Function` → unavailable |
| Historical typing kinds | `SemanticIssueKind::TypeUnknownValueType` / `TypeMismatch` — display only, no emit sites found |