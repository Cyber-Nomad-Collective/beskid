## Why

`beskid_analysis`'s resolver/type-checker (World A) judges only the entry
unit of an assembly: `TypeChecker::check_entry` discards every
dependency-unit error, and `ModuleIndex::resolve_entry_program` resolves only
the entry program. `beskid_queries`'s Salsa semantic facts (World B) run on
every unit, but an ordinary user error there (an unimported type, a
conflicting generic binding, a call arity mismatch) is indistinguishable from
a genuine compiler gap: both collapse to
`SemanticError::unavailable(...)`, which the ISLE adapter turns into an
unrelated-looking `LoweringErrorKind::MissingRuleOrFact`, or which
`module_emission::specialization` turns into an opaque "generic
specialization facts are unavailable" rejection of the whole module. A
`beskid test` run on `corelib_tests` compiles one file as the entry; every
helper it reaches in a sibling unit is unchecked by World A and, on a
mistake, fails illegibly instead of with a coded diagnostic at its source
site. Worse, `module_emission::specialization::resolve_module_items` walks
`input.roots()` (every root of the assembly, not only the items the caller
asked to lower), so a generic misuse in one unreachable test can poison every
other test in the same compilation unit.

## What Changes

- **ADD** a reachability-scoped semantic legality gate,
  `beskid_queries::semantic_contract::legality::check_items`, and make
  `beskid_codegen::module_emission::orchestration::lower_syntax_program` the
  single production caller: it runs the gate over the caller's requested
  items before specialization, and again over any body specialization or
  witness resolution newly discovers, before ISLE lowering ever runs.
- **ADD** two Salsa-tracked legality facts as the detection authority for
  this slice: `unresolved_type_reference` (E1201, generalizing the existing
  `unresolved_declared_generic_argument` from "generic arguments of a `let`"
  to every type position of an item — `let`, parameter, return type, field,
  lambda parameter, explicit call type argument) and `call_arity_mismatch`
  (E1204).
- **REMOVE** the `for root in input.roots()` specialization-collection walk
  in `module_emission::specialization::resolve_module_items`: only the
  items the caller actually asks to lower (and what they reach) may add a
  specialization or be judged by the gate.
- **ADD** `SemanticFinding { kind, site, related }` and
  `SemanticError::unavailable_at(query, site)` in
  `beskid_queries::semantic_contract::model` so a legality finding is a
  positive, coded, sited description of a user error, and a genuine compiler
  gap keeps a distinguishable site for its own (internal-error) rendering.
- Reserve **E2101–E2199** for internal compiler errors (a legality fact or
  ISLE rule/fact that is still unavailable after the gate has passed): this
  slice reserves the band and renders the gate's own findings; a following
  change assigns E2101/E2102 to the module-emission boundary's internal-error
  rendering path (out of scope here, tracked as a following slice).

## Out of scope for this change (tracked as following slices of the same
design)

- E1229 (generic parameter conflict) and the remaining diagnostics table
  (E1101/E1108/E1203 unknown callee, E1211/E1301/E1302/E1307/E1304 member and
  match legality, E1209 operator legality, E1105 imports, E1230/E1231 scoped
  cleanup and dead growth) are **not** added by this change. World A already
  reports E1229 for the entry unit (a prior, unrelated change); a World-B
  `generic_binding_conflict` fact mirroring the full binding/witness/receiver
  algorithm in `module_emission::specialization`'s ABI-level resolution is
  deliberately deferred rather than risk a fact that disagrees with
  production specialization.
- Generalizing `TryDiagnosticAuthority` into a `SemanticFactAuthority` so
  `beskid analyze` and the LSP prepare tier see the same findings as `beskid
  build`/`test` (design section 2.5) is a following slice.
- Moving `scoped_cleanup` and `dead_collection_growth` out of
  `build_typed_program`'s eager whole-assembly loop and into the gate (design
  section 2.1, section 4 slice 7) is a following slice.

## Impact

- Affected specs: `compiler--build-pipeline--stage-ordering` (ADDED
  requirement), `compiler--front-end--hir-normalization-and-legality` (ADDED
  requirement), `compiler--build-pipeline--diagnostics-parity` (ADDED
  requirement, forward-looking: the gate's findings are defined to match
  `analyze`/LSP once the following slice wires the shared authority),
  `compiler--semantic-pipeline--diagnostic-code-registry` (MODIFIED: reserve
  E2101–E2199).
- Affected code: `crates/beskid_queries/src/semantic_contract/legality.rs`
  (new), `crates/beskid_queries/src/semantic_contract/local_type_resolution.rs`
  (generalized), `crates/beskid_queries/src/semantic_contract/model.rs`,
  `crates/beskid_codegen/src/module_emission/{orchestration,contracts,specialization}.rs`.
- No corelib, runtime ABI, or canonical runtime capability model changes.
