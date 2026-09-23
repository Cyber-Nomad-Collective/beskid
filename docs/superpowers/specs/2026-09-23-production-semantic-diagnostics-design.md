# Production Semantic Diagnostics Design

Date: 2026-09-23
Worktree read: `/Users/mikserek/Projects/beskid/.worktrees/compiler-f6-native-descriptor-contract`
Status: design only, no code changes. Slices below are ordered for TDD.

## Outcome

`beskid build`, `beskid run`, `beskid test`, the JIT/AOT entry points, and the
native engine fixtures must reject ordinary user errors with a coded
diagnostic at the offending source site before generic specialization or ISLE
lowering starts. A genuine compiler gap (a fact that is not yet ported, an
ISLE rule that is missing) must remain visible as an internal error with its
site, and must never be presented as a user mistake. Partial or synthetic
assemblies used by tests must stay valid: nothing that the requested lowering
does not reach may be judged.

## 1. The two diagnostic worlds today

### 1.1 World A: `beskid_analysis` resolver and type checker

Entry points: `services::semantic_facts::type_resolved_program` and its
wrappers `resolve_and_type_program[_with_assembly]`
(`crates/beskid_analysis/src/services/semantic_facts.rs`). They run inside
the prepare spine (`services/prepare.rs`, phase `LOWER`) for every
`prepare_compilation*` call, independent of `with_semantic_diagnostics`.

What it diagnoses: `ResolveError::*` (`resolve/errors.rs`; unknown type,
unknown value, unknown module path, private item, duplicates, missing import)
and `TypeError::*` (`types/result.rs`; unknown type, mismatch, arity,
`GenericParameterConflict` E1229, `InvalidPrimitiveConversionArgument` E1228,
`InvalidTryTarget` E1222, spawn legality, extern surface). Codes are minted in
`analysis/diagnostic_kinds/code.rs` and rendered through
`SemanticDiagnostic` (`analysis/diagnostics.rs`, miette, `code`, `origin`,
`severity`). Staged semantic rules (`analysis/rules/staged.rs`) run only when
`with_semantic_diagnostics` is set.

Scope, and this is the load-bearing fact: **entry unit only**.

- `ModuleIndex::resolve_entry_program`
  (`projects/assembly/module_index/resolution.rs:35`) seeds the resolver with
  every unit's declarations, then calls `resolver.resolve_program(program)`
  for the entry program alone. Dependency unit bodies are never resolved.
- `TypeChecker::check_entry` (`types/checker/entry.rs:119-150`) types
  dependency bodies as a "best-effort slice" and then executes
  `checker.errors.truncate(dependency_errors_before)`: every dependency-body
  error is discarded by design.

So a `Result<u8[], FiberError> joined = ...` without `use
Concurrency.FiberError;` is reported as E1201 when it sits in the entry unit
and is silently accepted when it sits in any other unit of the assembly.
`beskid test` in `corelib_tests` compiles one tests file as the entry; every
helper it reaches in `corelib/packages/*` or a sibling file is a dependency
unit and is unchecked by World A.

Who runs World A:

| Caller | Path | Gate |
| --- | --- | --- |
| `beskid build`, `run`, `test`, `clif` | `CommandSession::executable_gate_prepared` (`beskid_tools/src/session.rs:107`) with `with_semantic_diagnostics: true`, `FullClosure`; `prepared_matrix.rs:289` for `test` | fails closed on any `Error` diagnostic, entry unit only |
| `beskid analyze` | `prepare_compilation_diagnostics` | collects, entry unit only |
| LSP tier 1 | `prepare_compilation_diagnostics_with_db` (`beskid_queries/src/entry.rs:93`) | per-URI entry, so a dependency file is checked only when it is the open buffer |
| `compiler_mod`, `syntax_codegen` unit test, `typed_entry_bundle` | `with_semantic_diagnostics: false` | resolver and checker still run for the entry |
| corelib typecheck spine | `corelib_tests_typecheck.rs` | `resolve_and_type_program_with_assembly` FullClosure, entry only |

Who does **not** run World A at all: `beskid_engine/tests/*` (for example
`heap_growth_native.rs:29` builds a `ProgramAssembly` by hand and calls
`lower_syntax_assembly_entrypoint`), `beskid_codegen/tests/*`,
`beskid_queries/tests/*`, `lower_corelib_tests_entrypoint`
(`beskid_tests_projects/src/projects/fixture_harness.rs:174`), canonical
runtime lowering (`prepared_syntax.rs:41`), runtime fixtures.

### 1.2 World B: `beskid_queries` Salsa semantic facts

Every fact is `fn(db, AstNodeKey) -> SemanticQueryResult<T>` where
`SemanticQueryResult<T> = Result<Option<T>, SemanticError>`
(`semantic_contract/model.rs:1141`). The tri-state has an overloaded meaning:

- `Ok(None)`: no fact for this node (stale key, foreign generation, wrong node
  kind, or "not applicable"). `with_node` (`syntax_facts.rs:517`) and
  `with_registered_syntax` (`queries.rs:5`) return `Ok(None)` for all of these.
- `Err(SemanticError::unavailable(name))`: the fact cannot be decided. The
  constructor text is fixed: "semantic query `{name}` is unavailable until its
  AST/Salsa port is complete" (`model.rs:1126`). It is used both for real
  ports that are not finished and for user errors (unresolved type, unknown
  callee, arity mismatch, conflicting generic bindings). There are roughly 500
  construction sites; the heaviest are `enum_match` (86), `abi_type` (59),
  `aggregate_field_access` (55), `call_abi_signature` (39),
  `node_type` (49), `source_expression_type`, `try_expression`.
- `Err(SemanticError::new(...))`: an explicit rejection with a message but no
  code and no span (for example `scoped use rejected` and
  `DeadCollectionGrowth` in `typed_program.rs:172-193`).

World B diagnoses today, when asked:

| Fact | Kind | Surfaces where |
| --- | --- | --- |
| `try_expression_fact` | invalid `?` target | bridged into World A as E1222 through `TryDiagnosticAuthority` (`prepare.rs:208`, `entry.rs:72-135`), deduped in `dedupe_diagnostics` |
| `spawn_legality`, `spawn_entry_validation` | `SpawnDiagnosticKind` | consumed by the legacy checker (`types/checker/spawn.rs:19`) and by codegen |
| `scoped_cleanup` | `ScopedCleanupDiagnostic` | eager whole-assembly loop in `build_typed_program`, `SemanticError::new` text, no code |
| `dead_collection_growth` | BSP-REQ-35580A7D7B75 | same eager loop, no code |
| `primitive_numeric_conversion` | non-integer argument | `unavailable("primitive_numeric_conversion")` (`calls/facts.rs:34-41`); World A reports the same shape as E1228 for the entry unit |
| `unresolved_declared_generic_argument` | unimported type inside a generic argument of a `let` annotation | exists (`local_type_resolution.rs`), not wired |

How `unavailable` becomes the two observed failures:

1. `SyntaxNodeFacts::query` in the ISLE adapter
   (`beskid_codegen/src/isle_adapter/context.rs:40`) is
   `result.ok().flatten()`: `Err(unavailable)` and `Ok(None)` both become
   `None`, and the generated ISLE rules then produce
   `LoweringErrorKind::MissingRuleOrFact` (`beskid_isle/src/context.rs:343`).
   This is the `Result<u8[], FiberError>` case: `resolve_type_declaration`
   (`layouts/common.rs:271`) returns `None` for `FiberError`, `enum_match`
   cannot build the layout, and the `match` is reported as a missing rule.
2. `resolve_module_items` (`module_emission/specialization.rs:15`) walks
   generic call sites; `specialization_for_call_in_environment`
   (`abi/specialization.rs:96`) returns `unavailable("call_abi_signature")`
   for an arity mismatch or a binding conflict, and the whole module emission
   is rejected with `generic specialization facts are unavailable at ...`.
   The walk also visits **every** program root (`for root in input.roots()`,
   `specialization.rs:34`), that is every unit in the assembly, so a generic
   misuse in an unreachable function of any unit poisons all tests in the
   compilation unit.

### 1.3 Overlap and disagreement

- Both worlds resolve type paths, but independently: World A through
  `Resolver` symbol tables, World B through `resolve_type_declaration` and
  the `SyntaxDependencyRegistry` (`db/syntax.rs`, filled by
  `build_typed_program`). They agree on the entry unit in practice, and only
  World B is consulted for dependency units.
- `use` declarations that name a module absent from the assembly are silently
  dropped when the registry is filled (`typed_program.rs:152-160`,
  `module_units.get(&path)` yields `None`). World A reports E1105 for the
  entry unit; World B has no finding at all.
- World A's E1229 and World B's binding conflict are two implementations of
  the same rule; only World A has a code, only World B runs on dependency
  units.
- Reachability differs: World A types the entry's items, World B lowers the
  items reached from the requested entrypoint plus the scheduler helper
  closure (`prepared_syntax.rs:366`) plus conformance witness bodies
  (`specialization.rs:47-72`). Nothing today judges exactly that set.

### 1.4 Governing policy and spec

- `AGENTS.md`: generation-bound Salsa facts in `beskid_queries` are the
  semantic authority for LSP/IDE; no per-request HIR rebuilds or dual snapshot
  paths. The design therefore adds no second tree and no second snapshot; the
  gate reads the same `BeskidDatabase` and generation that lowering reads.
- `openspec/changes/hir-free-isle-abi-v5-native-runtime` (open):
  `compiler--front-end--hir-normalization-and-legality` "Expanded-AST semantic
  and legality authority" (legality as Salsa facts keyed by `AstNodeKey`),
  `compiler--build-pipeline--stage-ordering` "Canonical AST-to-verified-CLIF
  phase DAG" (parse, expand, mod rewrite, semantic and legality queries,
  `TypedProgram`, ISLE, CLIF), `compiler--codegen-and-ir--isle-lowering-contract`
  (fail deterministically with the syntax span, never fall back).
- `openspec/specs/compiler--build-pipeline--stage-ordering`: "Semantic error
  diagnostics must stop lowering before backend code generation."
- `openspec/specs/tooling--cli--command-surface` "Shared frontend for
  compilation commands": diagnostic identity and messaging aligned across
  commands.
- `openspec/specs/compiler--semantic-pipeline--diagnostic-code-registry`
  BSP-REQ-072159A73908: codes are owned in `diagnostic_kinds.rs` and the
  registry table is extended in the same change; bands E1801-E1899 (mods),
  E1901-E1999 (macros), E2001-E2099 (templates) are reserved.
- `openspec/specs/tooling--lsp--diagnostics-and-workspace-analysis`: LSP
  preserves severity and code identity from compiler analysis diagnostics.

## 2. Architecture

### 2.1 One gate, scoped by the lowering item set

Add a reachability-scoped **semantic legality gate** in `beskid_queries`
(`semantic_contract/legality.rs`), and make `beskid_codegen::lower_syntax_program`
the single production caller:

```text
lower_syntax_program(input, isa, items)
  1. legality::check_items(db, items)            -> Err(bundle) stops here
  2. resolve_module_items(input, items)          -> closes witnesses, specializations
  3. legality::check_items(db, newly added keys) -> Err(bundle) stops here
  4. lower_resolved_syntax_program(...)          -> any remaining unavailable is internal
```

`items` is exactly what the caller will lower: the `reachable_items` closure
from the requested entrypoint, the scheduler helper closure, or the whole
executable module for `lower_prepared_syntax_module`, or the export closure
for the canonical runtime. Step 3 covers bodies that only specialization
discovers (contract witnesses, `pending` worklist in `specialization.rs:52`).
Facts are Salsa-tracked per node, so the second pass costs nothing for keys
already visited.

Because the gate judges only the passed items, the partial-assembly tests
stay valid by construction: `calls_conversions::canonical_foundation_*` and
`corelib_services::user_copy_of_foundation_output_cannot_import_the_panic_service`
query facts directly and never call `lower_syntax_program`;
`incremental::typed_entry_state_uses_fast_resolution_when_stale` and
`runtime_fixture::real_runtime_fixtures_resolve_actual_module_signatures_and_constants`
stop at `build_typed_program`. A fixture that lowers a body which itself
names an omitted type is a genuine fixture bug and must be fixed in the
fixture, not tolerated by the gate.

`build_typed_program` stays a registration step. The two eager
whole-assembly checks it hosts today (`scoped_cleanup`,
`dead_collection_growth`) migrate into the gate's fact list in a later slice
so that the assembly constructor no longer judges unreachable code either
(section 4, slice 7).

### 2.2 Legality facts, not string classification

The gate does not parse `unavailable(...)` strings. It evaluates an explicit,
ordered list of **legality facts**, each a Salsa-tracked query of the form
`fn(db, AstNodeKey) -> SemanticQueryResult<Finding>` that walks one item
body once (via `SyntaxIndex` node kinds, the same way
`is_growth_call_candidate` prefilters) and returns a positive description of
the error. `unresolved_declared_generic_argument` is the first such fact and
is generalized, not replaced (section 3).

```rust
pub struct SemanticFinding {
    pub kind: beskid_analysis::analysis::SemanticIssueKind, // code owner
    pub site: AstNodeKey,                                    // primary span
    pub related: Vec<(AstNodeKey, &'static str)>,            // optional labels
}
```

`SemanticIssueKind` remains the code owner (BSP-REQ-072159A73908); the
detection authority is the Salsa fact. Converting a finding into a
`SemanticDiagnostic` uses `node_span` and the unit source from
`TypedProgram.assembly.units` and produces a `SemanticDiagnosticsError`
bundle (`services/semantic.rs:36`), so `beskid_tools::diagnostics::report_from_anyhow`
already renders it with code, label, help and source excerpt. All findings
of a pass are collected; the gate does not stop at the first.

### 2.3 Internal errors stay internal

`SemanticError` gains an explicit cause so that the boundary can classify
without text matching:

```rust
enum SemanticErrorKind {
    Unavailable { query: &'static str, site: Option<AstNodeKey> }, // compiler gap
    Rejected,                                                      // SemanticError::new
    Diagnostics(Arc<[SemanticFinding]>),                           // user errors
}
```

`SemanticError::unavailable(name)` keeps its signature and meaning: a
compiler gap. A new `unavailable_at(name, key)` variant carries the site and
is used at the sites where a key is in hand (most of them). After the gate
has passed, any `Unavailable` or `MissingRuleOrFact` that still reaches the
module-emission boundary is rendered as an **internal error** with a
reserved code, the query or rule name, and the site
(`format_ast_node_site`), with help text "this is an internal compiler error,
please report it", mirroring `InvalidSyntaxSpan` E1151. It is never labelled
with a user code. The CLI keeps a non-zero exit either way; `beskid test`
prints the internal error in the FAIL line as it does today.

Reserved band proposal (owner decision, section 6): `E2101` semantic fact
unavailable at site, `E2102` ISLE rule or fact missing at site. E2101-E2199
is the first unallocated band after templates.

### 2.4 Specialization collection is reachability-scoped

Drop the `for root in input.roots()` walk in `resolve_module_items`
(`specialization.rs:31-39`). Test items and the entrypoint are already in
`items`; a generic call in an unreachable function must neither add a
specialization nor poison the module. Keep the root walk only for
`lower_prepared_syntax_module`, where every executable item is already in
`items` anyway. This is the second half of "one test's error poisons every
test in the unit"; the first half is the gate.

### 2.5 Same findings in `analyze` and the LSP

The prepare spine already has the inversion seam for a generation-bound
owner: `TryDiagnosticAuthority` (`prepare.rs:206`). Generalize it to a
`SemanticFactAuthority` that returns `Vec<SemanticFinding>` for the entry's
reachable items (entry item bodies plus what they reach) and feeds them into
`collected_diagnostics` next to E1222. `dedupe_diagnostics` already removes
the duplicate that World A produces for the entry unit. This gives
`beskid analyze` and LSP tier 1 the same codes as `beskid build` before the
build runs, and it is the direction of travel for retiring the overlapping
World A checks one rule at a time: a rule is retired only after its Salsa
fact is the authority in both the gate and the spine and the World A test
corpus passes through the fact. That retirement is deliberately out of scope
for this design.

### 2.6 Ownership

| Concern | Owner |
| --- | --- |
| Detecting a user error on any unit | `beskid_queries` legality facts (authority) |
| Diagnostic code, label, help text | `beskid_analysis::analysis::diagnostic_kinds` |
| Rendering, exit codes, LSP transport | `beskid_analysis::SemanticDiagnostic`, `beskid_tools::diagnostics`, LSP bridge (unchanged) |
| Which items are judged | the lowering caller (`prepared_syntax.rs`, `lower_syntax_program`) |
| Internal error rendering | `beskid_codegen::module_emission::contracts` |

## 3. Diagnostics to cover first

Codes reuse existing `SemanticIssueKind` variants wherever the rule is the
same; new variants are added only where no code exists.

| Order | Finding | Code | Today's failure site | Legality fact |
| --- | --- | --- | --- | --- |
| 1 | Unknown type in any type position: `let` annotation and its generic arguments, parameter, return type, field, enum payload, explicit call type argument, lambda parameter | E1201 (`TypeUnknownType`) | `resolve_type_declaration` `None` in `layouts/common.rs:87,168`, `aggregate_field_layout` `common.rs:21`, `abi_type_from_syntax` `abi/types.rs:513` | `unresolved_type_reference(item)`: generalization of `unresolved_declared_generic_argument` to every `Type::Complex` in the item, skipping enclosing generic parameters (`type_syntax_is_enclosing_generic_parameter_reference`) |
| 2 | Generic parameter bound to two different types by one call | E1229 (`TypeGenericParameterConflict`) | `specialization_for_call_in_environment` binding step after `abi/specialization.rs:159` | `generic_binding_conflict(call)`; mirror of `types/inference/generic.rs:60` over ABI types |
| 3 | Call arity mismatch | E1204 (`TypeCallArityMismatch`) | `abi/specialization.rs:160-161` | `call_arity_mismatch(call)` |
| 4 | Unknown callee (no declaration, import, builtin, intrinsic, or extern member) | E1101 (`ResolveUnknownValue`), E1108 for a bad module path | `calls/resolution.rs:68` `unavailable("call_lowering")` | `unresolved_call_target(call)` |
| 5 | Generic call whose arguments cannot fix the parameters (`F<T>()` with no inferable `T`) | E1203 (`TypeMissingTypeArguments`) | `calls/resolution.rs:38,42` | part of fact 4 |
| 6 | Unknown struct field, unknown enum variant, constructor arity, pattern arity | E1211, E1301, E1302, E1307 | `aggregate_field_access`, `enum_constructor`, `pattern_binding` unavailable sites in `layouts/field_access.rs`, `layouts/enum_layout.rs` | `member_reference_legality(item)` |
| 7 | Non-exhaustive match | E1304 | `LoweringErrorKind::NonExhaustiveMatch` reached only in ISLE | `match_exhaustiveness(match)` reusing `enum_match` arm facts |
| 8 | Primitive conversion with a non-integer argument | E1228 | `calls/facts.rs:34-41` | `primitive_numeric_conversion` returns a finding instead of `unavailable` |
| 9 | Mixed-width or non-integer operands of a shift or bitwise operator | E1209 | `binary_operand_abi_type` sites in `typing.rs` | `operator_operand_legality(expr)` |
| 10 | `use` of a module absent from the assembly, in a unit that owns a judged item | E1105 (`UnknownImportPath`) | silent drop in `typed_program.rs:152-160` | `unresolved_import(unit)`; scoped to units of judged items, see risk note in slice 5 |
| 11 | Scoped `use` cleanup rejection, dead growth | existing texts, need codes: propose `E1230` `ScopedCleanupRejected` (four kinds as labels), `E1231` `DeadCollectionGrowth` | `typed_program.rs:172-193` | existing facts, moved into the gate |

Remaining `unavailable` families that are genuine ports, not user errors, and
therefore stay internal: `node_type`, `source_expression_type`,
`closure_environment`, `capture_storage`, `contract_witness`,
`runtime_intrinsic`, `enum_match_specialization` provenance (the open HTTP
`Result<T, HttpError>` case in the handoff), `generic_receiver_instantiation`.
Slice 8 adds an inventory test so that every `unavailable(name)` literal is
either mapped to a legality fact or listed in an explicit known-gap allowlist
with a tracker reference; a new literal without either entry fails the test.

## 4. Migration plan

Each slice starts red with the named test and ends with `cargo test -p
beskid_queries --tests -- --test-threads=1`, `cargo test -p beskid_codegen
--test isle_adapter`, and the six partial-assembly tests green. Nothing is
merged into `main` without the owner's request.

1. **Gate skeleton and E1201.** Add `SemanticFinding`, `SemanticErrorKind`,
   `legality::check_items`, and call it from `lower_syntax_program` (steps 1
   and 3). Generalize `unresolved_declared_generic_argument` into
   `unresolved_type_reference`. Tests: extend
   `beskid_queries/tests/semantic_facts/local_type_resolution.rs` with
   parameter, return, field, and call-type-argument positions;
   `beskid_codegen/tests/isle_adapter/diagnostics_fail_closed.rs` asserts that
   the `FiberError` shape yields one E1201 at the `let` and no
   `MissingRuleOrFact`; a negative `heap_growth_native` variant without the
   `use` line asserts the same through `lower_syntax_assembly_entrypoint`.
2. **Generic call findings.** E1229 and E1204 facts; `resolve_module_items`
   drops the root walk (2.4). Tests: `semantic_facts/generic_inference.rs`
   conflict and arity cases; an `isle_adapter` test with two test items where
   only one misuses a generic asserts the other still lowers when requested
   alone, and that requesting both reports exactly one E1229.
3. **Unknown callee.** E1101, E1108, E1203 from `unresolved_call_target`.
   Tests: `semantic_facts/calls_and_graph.rs`; `diagnostics_fail_closed.rs`.
4. **Members and matches.** E1211, E1301, E1302, E1307, E1304. Tests:
   `semantic_facts/layouts_and_enums.rs`, `node_enum_typing.rs`.
5. **Imports.** E1105 scoped to judged units. Risk: engine fixtures such as
   `fiber_value_transfer::source_transfer_assembly` may carry `use` lines to
   omitted modules while lowering items from those units. Audit first with a
   dry-run mode that logs findings without failing; promote to an error only
   when the audit is clean or the fixtures are completed.
6. **Prepare-spine and LSP exposure.** Generalize `TryDiagnosticAuthority`
   into `SemanticFactAuthority` (2.5). Tests: `beskid_queries/tests/try_diagnostics.rs`
   pattern for a dependency-unit E1201 surfacing in `beskid analyze`;
   `beskid_tests_lsp` publishes the code for the dependency URI.
7. **Move eager checks into the gate.** `scoped_cleanup` and
   `dead_collection_growth` leave `build_typed_program`, gain codes
   (E1230, E1231), and are judged per reachable item. Tests:
   `semantic_facts/scoped_cleanup.rs`, `dead_growth.rs` updated to assert at
   the lowering boundary; `scoped_cleanup_native` engine test unchanged.
8. **Internal error class and inventory.** E2101/E2102 rendering with site,
   `unavailable_at` at the sites with a key, the `unavailable(name)`
   inventory test with the known-gap allowlist. Tests: `diagnostics_fail_closed.rs`
   asserts an internal error carries the site and no user code; the
   inventory test in `beskid_queries`.
9. **compile-fail corpus.** One `corelib_tests/fixtures/compile-fail` target
   per code introduced above, run by `beskid test`, which already treats a
   compile-fail target that compiles cleanly as a regression
   (`beskid_cli/src/commands/test.rs:312`).

## 5. OpenSpec

New change `add-reachability-scoped-semantic-legality-gate` with deltas to
four capabilities. Draft requirement text:

`compiler--build-pipeline--stage-ordering`, ADDED:

> ### Requirement: Reachability-scoped legality gate precedes specialization
> Before the reference compiler collects generic specializations or selects
> ISLE rules for a lowering request, it SHALL evaluate the legality facts of
> every item the request will lower: the requested roots, their direct-call
> closure, the scheduler helper closure, and every body discovered by
> conformance witness resolution. The compiler SHALL judge no item outside
> that set. When any legality fact yields a finding, the compiler SHALL report
> every finding of the pass as a coded diagnostic at its source site and SHALL
> NOT produce a backend artifact.
>
> #### Scenario: Unimported type in a dependency unit
> - **GIVEN** a test unit that calls a helper in another unit whose `let`
>   declares `Result<u8[], FiberError>` without importing `FiberError`
> - **WHEN** `beskid test` lowers that test
> - **THEN** the run reports E1201 at the `let` in the helper's unit and
>   reports no missing lowering rule
>
> #### Scenario: Unreachable misuse does not poison the unit
> - **GIVEN** a unit with two tests, one of which binds a generic parameter to
>   `word` and `i64` in one call
> - **WHEN** only the other test is requested
> - **THEN** it lowers and runs; requesting the misusing test reports E1229

`compiler--front-end--hir-normalization-and-legality`, ADDED:

> ### Requirement: Legality facts are positive findings
> A legality fact SHALL describe the error it finds with a registered
> diagnostic kind and the generation-bound key of its site. A semantic query
> that cannot be decided because its port is incomplete SHALL remain
> distinguishable as unavailable and SHALL NOT be mapped to a user diagnostic
> code by message text.
>
> #### Scenario: Compiler gap after a clean gate
> - **GIVEN** an item whose legality facts yield no finding
> - **WHEN** a later fact or ISLE rule is unavailable for one of its nodes
> - **THEN** the compiler reports an internal error carrying the query or rule
>   name and the site, with an internal-error code, and no user code

`compiler--build-pipeline--diagnostics-parity`, ADDED:

> ### Requirement: Build-time findings match analyze and LSP
> A finding produced by a legality fact during `build`, `run`, or `test`
> SHALL carry the same code, message, and span as the same finding produced
> by `analyze` and by the LSP prepare tier for the same source generation.

`compiler--semantic-pipeline--diagnostic-code-registry`, MODIFIED: allocate
E1230, E1231 in the type-system band and reserve **E2101-E2199** for internal
compiler errors (E2101 semantic fact unavailable, E2102 lowering rule or fact
missing), registered in `diagnostic_kinds.rs` in the same change.

## 6. Decisions that need the owner

1. Code band for internal errors: E2101-E2199 as proposed, or another band.
   The registry spec makes allocation normative.
2. Drop the `for root in input.roots()` specialization walk (2.4). It
   changes which specializations exist for `lower_syntax_assembly_entrypoint`
   when an unreachable root calls a generic that a reachable item also calls
   with different arguments; the reachable call already supplies its own
   specialization, so the expected effect is none, but this is the one
   behavioral change to production emission besides the gate itself.
3. Whether E1105 (slice 5) fails closed or first ships as an audit-only
   finding, given the engine fixture corpus.
4. Whether the eager `scoped_cleanup` and `dead_collection_growth` checks may
   leave `build_typed_program` (slice 7); the `beskid_queries` tests for them
   currently assert at that constructor.
5. Naming: `beskid_queries::legality` module and `SemanticFinding`, or fold
   findings into the existing `SemanticDiagnostic` type directly and make
   `beskid_queries` construct miette diagnostics itself.

## Boundaries

- No new tree, snapshot, or resolver: the gate reads the database and
  generation that lowering reads (AGENTS.md single-authority rule).
- The World A resolver and checker are not modified by this design except
  through the existing authority seam; retiring their overlapping rules is a
  separate program.
- The ISLE adapter's `query` collapse (`context.rs:40`) is left as is; the
  gate guarantees that what reaches it is either lowerable or an internal gap.
- Corelib sources, runtime ABI, and the canonical runtime capability model are
  untouched.
