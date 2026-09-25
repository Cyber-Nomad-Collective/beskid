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
- **ALLOCATE** E2101 for a semantic fact that remains unavailable after the
  gate has passed, and E2102 for a missing ISLE rule or fact after the gate
  has passed. Both internal errors carry the query or construct name, the
  generation-bound source site, help text, and a source excerpt. The
  E2101–E2199 band remains reserved for internal compiler errors.

## Out of scope for this change (tracked as following slices of the same
design)

- The remaining diagnostics table entries not implemented by this change
  remain out of scope: E1209 operator legality and any legality fact not
  listed above. This change implements E1229 at the concrete generic call,
  E1230/E1231 in the reachability-scoped gate, and prepare-spine/LSP exposure
  for legality findings.

## Impact

- Affected specs: `compiler--build-pipeline--stage-ordering` (ADDED
  requirement), `compiler--front-end--hir-normalization-and-legality` (ADDED
  requirement), `compiler--build-pipeline--diagnostics-parity` (ADDED
  requirement: prepare spine and LSP expose the shared legality findings),
  `compiler--semantic-pipeline--diagnostic-code-registry` (MODIFIED: allocate
  E1230, E1231, E2101, and E2102; reserve E2103–E2199).
- Affected code: `crates/beskid_queries/src/semantic_contract/legality.rs`
  (new), `crates/beskid_queries/src/semantic_contract/local_type_resolution.rs`
  (generalized), `crates/beskid_queries/src/semantic_contract/model.rs`,
  `crates/beskid_codegen/src/module_emission/{orchestration,contracts,specialization}.rs`.
- No corelib, runtime ABI, or canonical runtime capability model changes.
