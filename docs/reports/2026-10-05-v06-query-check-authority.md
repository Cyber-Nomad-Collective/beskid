# beskid 0.6: query authority for multi-root `beskid check` (phase 1)

Design note for the decision "semantic authority for multi-root `beskid check`"
(`docs/reports/2026-10-04-v06-decisions.md`, 2026-10-05). Informative; OpenSpec
owns requirements and Tracker owns delivery state.

## Endpoint and phase 1 scope

The endpoint is one `beskid_queries` diagnostics gate over every own root that
builds `TypedProgram` once with codegen's capabilities and evaluates complete
typing and legality obligations for every own-root item, after which
`SemanticPipelineRule` keeps only structural and style diagnostics and the
legacy `beskid_analysis::types::TypeChecker` leaves `additional_root_diagnostics`
and diagnostics-only `check`.

Phase 1 (this change) delivers the gate, the capability pin, the item
enumeration, the first query-derived typing obligations, and the parity
inventory. It does not remove the legacy checker: the inventory below shows that
query coverage is incomplete, so removing it now would reopen the fail-open gap
the decision forbids. The legacy checker therefore still runs on both paths and
its diagnostics are merged behind the query gate (same code, same unit,
overlapping span: query finding wins, legacy duplicate is dropped).

## What changed

`compiler/crates/beskid_queries/src/entry.rs`

- `semantic_fact_findings` is now `pub fn semantic_diagnostics_for_roots`
  (exported from the crate) and is the authority `QueryModSemanticScope`
  implements `SemanticFactAuthority` with.
- Capability pin: the gate builds its `TypedProgram` with
  `canonical_corelib_syscall_service_capability` and
  `build_typed_program_with_corelib_syscall_services`, the exact constructors
  `beskid_codegen::prepared_syntax` uses (or the runtime-fixture authority when
  the assembly carries one). Today both Corelib constructors resolve to the same
  capability; the pin makes a future divergence a compile-time mismatch at the
  gate rather than a silent "unknown service" false positive.
- Item enumeration: every `FunctionDefinition`, `MethodDefinition` (including
  methods inside `type` and `impl` blocks) and `TestDefinition` the root unit's
  syntax index holds is a judged item, for every root (`root_unit_indices`:
  the entry, or every own unit of an entry-less library). Root reachability is
  never applied. The direct-call closure of each root item is still added to
  the legality subjects so a dependency-unit error an own item reaches is
  reported in that unit's source, as before.
- Typing obligations (`check_typing_obligations`) run over the root items
  only; dependency bodies are judged by their own project.

`compiler/crates/beskid_queries/src/semantic_contract/legality/typing.rs` (new)

- `typing_obligations(db, item)`: a persisted Salsa fact listing every typing
  obligation an item fails, with the exact diagnostic site:
  - `Mismatch { expected, actual }` (E1206) for a `return` value against the
    callable's declared result, a typed `let` initializer against its
    annotation (site: the declared name, as the legacy checker), a local-path
    assignment value against its target, a direct non-generic function call
    argument against the declared parameter, and later value arms of a `match`
    against the first typed arm;
  - `MissingReturnValue { expected }` (E1207) for a bare `return` in a callable
    whose declared result is not `unit`;
  - `NonBoolCondition { actual }` (E1208) for `if`/`while` conditions and match
    guards.
- Compatibility mirrors the legacy `require_same_type`: equal identities, either
  side `never`, or two numeric primitives are compatible. In addition a side
  represented as `pointer` is never judged, because `pointer` is also the ABI
  representation of every nominal value in the current `SemanticTypeId` model.
- Fail-closed direction: a position is judged only when `node_type` proves both
  sides. Nominal aggregates, generic parameters, inferred lambdas and closures,
  member calls, generic and `bulk` callees, and `test` bodies (no syntactic
  result) are not judged and keep their legacy authority.
- `check_typing_obligations(db, items)` renders the fact as `SemanticFinding`s
  with the legacy `SemanticIssueKind`s (`TypeMismatch`, `TypeReturnMismatch`,
  `TypeNonBoolCondition`). It is called by the `check` gate only; `check_items`
  (the codegen legality gate) is unchanged in this phase.

`compiler/crates/beskid_analysis/src/services/prepare/spine.rs` (wiring only)

- Cached-executable path: query findings now merge into the legacy root
  diagnostics with `merge_fact_diagnostics` (code + unit + overlapping span),
  exactly as the uncached path already did, instead of exact-key dedupe only.
  `additional_root_diagnostics` itself is unchanged: the legacy rules and
  checker still run there, behind the query gate.

## Phase 2 (2026-10-06)

Phase 2 closes most of the "not yet covered" rows. The legacy checker still
runs on both paths: the inventory below still has open rows, and
`check_typing_obligations` is not yet part of the codegen gate (`check_items`).

### What changed in phase 2

`compiler/crates/beskid_queries/src/semantic_contract/legality/gate.rs` and
`gate/{operators,control,expressions}.rs` (`gate_obligations`,
`check_gate_obligations`), `legality/units.rs` (`unit_obligations`,
`check_unit_obligations`) and `legality/externs.rs`
(`extern_profile_findings`) are evaluated by `semantic_diagnostics_for_roots`
over the root items, once per root unit, and once per root unit with the
manifest Glue libraries, respectively. They were written before this phase
without parity fixtures; phase 2 adds the fixtures and these changes:

- `gate/expressions.rs`: a method call through a local or `this` receiver path
  (`local.Name(..)`, the common spelling, which is a path callee and not a
  member callee) that `call_lowering` cannot resolve is judged as the legacy
  `type_call_expression` judges it: a primitive receiver is E1213 at the member
  segment plus E1606 at the call; a non-function field is E1606; a name that is
  neither a field nor a method is E1211 at the member segment plus E1606.
  Event raises, the call authorities ISLE consults before `call_lowering`
  (`claimed_by_another_call_authority`, now `pub(super)` in `calls.rs`) and
  names an `extend type` block of the unit declares are not judged.
- `gate/expressions.rs` (member values) and `gate/control.rs` (iterables): a
  receiver or iterable whose `node_type` is `pointer` was skipped. `pointer`
  is the ABI of every nominal value, so these shapes now fall through to the
  nominal declaration checks (E1201 method-as-value, E1215-E1218 on a nominal
  local without a valid `Next`).
- `units.rs`: E1102 `DuplicateItem`: two module-scope items (function, type,
  enum, contract, test, inline module) of one name in one module scope, two
  constants of one name, a `type` method named like a field of the type, and
  two top-level `use` declarations binding one alias. Site: the later
  declaration; `previous`: the earlier one.
- `legality/values.rs` (new, `value_obligations`, rendered by
  `check_typing_obligations`): E1206 on source type identity
  (`generic_source_type_identity` for a declared destination,
  `generic_source_expression_identity` for a value), so nominal, array, and
  contextual positions are judged. Positions: typed `let`, `return`, local
  assignment (when a side is not a proven primitive); value arms of a `match`
  that initializes a typed `let` or is returned, against that destination;
  direct call arguments of non-generic functions and methods; struct literal
  field values; enum constructor arguments; literal and enum patterns against
  the scrutinee. Compatibility follows `require_same_type`: nominal values by
  declaration (generic arguments not compared), arrays by proven primitive
  element, `u8[]` and `i64` compatible, `never`, `pointer`, and function
  values not judged. Contract destinations, generic parameters, generic
  callees, and generic `type`/`enum` declarations are not judged.

`TypeError::CallArgumentMismatch` (E1205) and `TypeError::MatchArmTypeMismatch`
(E1305) are rendered by `emit_type_error` but the legacy `TypeChecker` never
constructs them (no emission site in `types/checker`): call arguments are
`TypeMismatch` (E1206) through `require_same_type`, and E1305 comes from the
staged `control_flow` rule (literal arm kinds), not from the `TypeChecker`.
Neither is a legacy checker obligation; whether the staged rule stays in
`SemanticPipelineRule` is decided with the rule split, not here. `TypeError::StackReferenceEscapesSpawn` (E1225) has
no legacy emission site either; the gate renders it from `spawn_legality`,
which emission already enforces.

## Phase 3 (2026-10-09): sole authority

Phase 3 closes the removal condition. Rulings are recorded in
`docs/reports/2026-10-04-v06-decisions.md` ("the query gate is the sole semantic authority of
`beskid check`").

- `semantic_diagnostics_for_roots` judges every own unit (`library_unit_indices`: the entry plus
  every unit under the host source root), for App and Lib targets. `beskid check` assembles with
  `AssemblyDiscovery::WorkspaceScan` so an own unit nothing imports (a Mod's `Driver.bd`) is
  assembled and judged, and its native Mod activation is decided on that same assembly
  (`prepare_native_mod_executor_with_front_end`); the build path and the tools build-side
  semantic gate (which runs without a Mod host) keep the import closure. The
  language server keeps the import closure of the open buffer: it publishes per buffer, and a
  sibling unit is judged when it is the open buffer.
- The prepare spine's diagnostics path requires the query authority and fails closed without it.
  The legacy `TypeChecker` still builds the executable front end, but its errors are never
  rendered; `additional_root_diagnostics` became `own_unit_rule_diagnostics` (structural rules
  only, over every own unit). `beskid_analysis::services::prepare_compilation_diagnostics`,
  `prepare_compilation_diagnostics_isolated`, the `analyze_source_in_project*` family,
  `AnalyzeInProjectOptions`, the `SemanticFactsError` converter and `analysis/rules/types.rs`
  (`emit_type_error`) are removed. The `prepare` unit tests that judged diagnostics moved to
  `beskid_queries/tests/prepare_diagnostics_authority.rs`.
- New query obligations (parity modules beside `parity_tests.rs`, sharing `parity_harness.rs`,
  which also builds multi-unit entry-less libraries):
  - `parity_literals_externs_clif.rs`: T0905 for unsuffixed integer literals against their
    contextual destination (`contextual_integer_literal_abi_type`; typed let, return, call
    argument, assignment, negated and grouped literals, unsigned destinations); T0906
    `ExternInvalidOptional` (non-boolean `Optional`, malformed `bool Available();`, which is
    exempt from the C profile); E1232 `InvalidClifBlock` (`gate/clif.rs`, every legacy detail
    class: no typed context, non-scalar context, surface rejection, `%N` out of range, array or
    non-scalar value parameter, payload of a non-payload parameter, method receiver, parameters
    inside a lambda); E1206 for a valued `return` in a `test` body (`typing.rs`, expected `unit`).
  - `parity_values.rs` (`values.rs`): E1206 for generic callee arguments whose parameter mentions
    no callee generic or whose generic the call fixes, contract-dispatch arguments, callable-value
    call arguments and results, event raise arguments, lambda bodies against function-typed
    destinations and subscription handlers, non-conforming nominals into contract-typed
    destinations (`contract_accepts`), fields of generic type literals and arguments of generic
    enum constructors fixed by the literal path or the contextual destination, nested enum and
    literal payload patterns, and a nominal `return` in a `test` body.
  - `parity_resolution.rs` (`gate/expressions.rs`, `units.rs`, `value_paths.rs`,
    `local_type_resolution.rs`): E1201 `TypeUnknownValueType` for a function named as a value and
    for a type-qualified value path; E1213 / E1211 / E1201 along field paths of three or more
    segments; E1102 for two `mod` declarations of one path, builtin collisions, and an item an
    earlier unit of the same logical module declares; E1601 / E1607 for generic implementors and
    applied generic contracts (E1602 only for closed signatures); qualified type paths classified
    as the legacy resolver (E1108 unknown module, E1104 ambiguous, E1107 private, E1201
    `ResolveUnknownTypeInModule`); non-call value paths classified like call targets (E1108,
    E1101 `ResolveUnknownValueInModule`, E1107); `TypeInaccessibleStructField` across units.
  - `units.rs`: E1201 for a `where` bound whose parameter is not a generic of its declaration or
    whose path names no contract (lexical shadowing by a nearer type, inline-module contracts
    invisible outside, private contracts not importable); `gate/expressions.rs`: E1610 for a
    generic callable forwarding its own unbounded parameter to a bounded callee (the legacy
    `check_generic_function_bounds` caller-bound rule).
- Not a legacy obligation after inspection: E1224 `JoinWouldDeadlock` has no reachable legacy
  emission shape (the handle local is registered only after its `spawn` initializer is typed, so
  a join inside the handle's own lambda is an unresolved value there); the gate's `gate/control.rs`
  obligation stays, with a fixture asserting the gate reports E1101/E1107 for that shape, not
  E1224.

## Coverage inventory: legacy class to query obligation to test

Codes are the `SemanticIssueKind` codes the legacy `emit_type_error` /
`emit_resolve_error` produce. "Test" names the query-only parity test in
`beskid_queries/src/entry/parity_tests.rs`: `COVERED` (code only) or
`COVERED_KINDS` (exact variant and code), unless stated.

### Covered by a query obligation (query gate reports the same code)

| Legacy class | Code | Query obligation | Test |
| --- | --- | --- | --- |
| `ResolveError::UnknownValue` (call target) | E1101 | `unresolved_call_target` | `COVERED` E1101 |
| `ResolveError::UnknownModulePath` (`use`) | E1105 | `unresolved_imports` | `COVERED` E1105 |
| `ResolveError::UnknownModulePath` (qualified call) | E1108 | `unresolved_call_target` | legality `calls.rs` tests |
| `ResolveError::PrivateItemInModule` (runtime builtin, call) | E1107 | `unresolved_call_target` | legality `calls.rs` tests |
| `ResolveError::UnknownValueInModule`, `PrivateItemInModule` (qualified call) | E1101, E1107 | `unresolved_call_target` | legality `calls.rs` tests |
| `ResolveError::DuplicateLocal` | E1102 | `gate_obligations::DuplicateLocal` | `COVERED_KINDS` |
| `ResolveError::DuplicateItem` (one unit) | E1102 | `unit_obligations::DuplicateItem` | `COVERED_KINDS` x3 |
| `TypeError::UnknownType` / `ResolveError::UnknownType` | E1201 | `unresolved_type_reference` | `COVERED` E1201 |
| `TypeError::UnknownValueType` (method named as a value) | E1201 | `gate_obligations::UnknownValueType` | `COVERED_KINDS` |
| `TypeError::UnknownStructType` | E1201 | `gate_obligations::UnknownStructType` | `COVERED_KINDS` |
| `TypeError::UnknownEnumType` | E1201 | `gate_obligations::UnknownEnumType` | `COVERED_KINDS` |
| `TypeError::UnsupportedExpression` (index, compound assignment, array literal) | E1202 | `gate_obligations::UnsupportedExpression` | `COVERED_KINDS` x2 |
| `TypeError::MissingTypeAnnotation` | E1202 | `gate_obligations::MissingTypeAnnotation` | `COVERED_KINDS` |
| `TypeError::MissingTypeArguments` | E1203 | `unresolved_call_target` | legality `calls.rs` tests |
| `TypeError::CallArityMismatch` | E1204 | `call_arity_mismatch` | `COVERED` E1204 |
| `TypeError::GenericArgumentMismatch` | E1204 | `gate_obligations::GenericArgumentMismatch` | `COVERED_KINDS` |
| `TypeError::TypeMismatch` (primitive let, return, assignment, call argument, arm vs arm) | E1206 | `typing_obligations::Mismatch` | `COVERED`; `typing.rs` tests |
| `TypeError::TypeMismatch` (binary operands) | E1206 | `gate_obligations::OperandMismatch` | `operators.rs` |
| `TypeError::TypeMismatch` (nominal let, return, call argument; struct field; enum argument; method argument; literal and enum pattern; contextual arm) | E1206 | `value_obligations` | `COVERED_KINDS` x9 |
| `TypeError::ReturnTypeMismatch` (bare `return`) | E1207 | `typing_obligations::MissingReturnValue` | `COVERED` E1207 |
| `TypeError::NonBoolCondition` (`if`, `while`, guard) | E1208 | `typing_obligations::NonBoolCondition` | `COVERED` E1208 x2 |
| `TypeError::InvalidBinaryOp` | E1209 | `gate_obligations::InvalidBinaryOp` | `COVERED_KINDS` |
| `TypeError::InvalidUnaryOp` | E1210 | `gate_obligations::InvalidUnaryOp` | `COVERED_KINDS` |
| `TypeError::UnknownStructField` (literal, field read) | E1211 | `member_reference_legality` | `COVERED` E1211 |
| `TypeError::UnknownStructField` (unknown method, path or member callee) | E1211 | `gate_obligations::UnknownStructField` | `COVERED_KINDS` |
| `TypeError::MissingStructField` | E1212 | `member_reference_legality` | legality `members.rs` tests |
| `TypeError::InvalidMemberTarget` (field path, method path) | E1213 | `gate_obligations::InvalidMemberTarget` | `COVERED_KINDS` x2 |
| immutable local write | E1214 | `immutable_local_assignment` | `COVERED` E1214 |
| `TypeError::NonIterableForTarget` (primitive, nominal without `Next`) | E1215 | `gate_obligations::NonIterableForTarget` | `COVERED_KINDS` x2 |
| `TypeError::IterableNextArityMismatch` | E1216 | `gate_obligations` | `COVERED_KINDS` |
| `TypeError::IterableNextReturnNotOption` | E1217 | `gate_obligations` | `COVERED_KINDS` |
| `TypeError::IterableOptionSomeArityMismatch` | E1218 | `gate_obligations` | `COVERED_KINDS` |
| `TypeError::InvalidEventInvocationScope` | E1219 | `gate_obligations` (`event_operation` raise) | `COVERED_KINDS` |
| `TypeError::InvalidEventCapacity` | E1220 | `unit_obligations::InvalidEventCapacity` | `COVERED_KINDS` |
| `TypeError::InvalidEventSubscriptionTarget` | E1221 | `gate_obligations` (`event_operation` subscribe) | `COVERED_KINDS` |
| `TypeError::InvalidTryTarget` | E1222 | `try_expression_fact` (gate) | `tests/try_diagnostics.rs` |
| `TypeError::SpawnTargetNotFiberCompatible` | E1223 | `gate_obligations` (`spawn_legality`) | `COVERED_KINDS` |
| `TypeError::InvalidPrimitiveConversionArgument` | E1228 | `gate_obligations` | `COVERED_KINDS` |
| `TypeError::GenericParameterConflict` | E1229 | `generic_parameter_conflict` | `COVERED` E1229 |
| scoped cleanup | E1230 | `scoped_cleanup` | `tests/semantic_facts/scoped_cleanup.rs` |
| dead collection growth | E1231 | `dead_collection_growth` | `tests/semantic_facts/dead_growth.rs` |
| `TypeError::UnknownEnumVariant` | E1301 | `member_reference_legality` | `COVERED` E1301 |
| `TypeError::EnumConstructorMismatch` (constructor) | E1302 | `member_reference_legality` | `COVERED` E1302 |
| match exhaustiveness | E1304 | `match_exhaustiveness` | `COVERED` E1304 |
| `TypeError::ContractMethodMissingImplementation` | E1601 | `unit_obligations` (`contract_conformance_failure`) | `COVERED_KINDS` |
| `TypeError::ContractImplementationSignatureMismatch` | E1602 | `unit_obligations` (`contract_conformance_failure`) | `COVERED_KINDS` |
| `TypeError::UnknownCallTarget` (non-callable field, unresolved method path) | E1606 | `gate_obligations::UnknownCallTarget` | `COVERED_KINDS` |
| `TypeError::ContractAssociatedTypeMissingBinding` | E1607 | `unit_obligations` | `COVERED_KINDS` |
| `ResolveError::InvalidConformanceTarget` | E1607 | `unit_obligations` | `COVERED_KINDS` |
| `TypeError::ThisUsedOutsideContractOrImpl` | E1608 | `unit_obligations` | `COVERED_KINDS` |
| `TypeError::UnresolvedAssociatedType` | E1609 | `unit_obligations` | `COVERED_KINDS` |
| `TypeError::GenericBoundNotSatisfied` | E1610 | `gate_obligations` (`call_abi_signature` bound violation) | `COVERED_KINDS` |
| `TypeError::ExternInvalidAbi` | T0901 | `extern_profile_findings` | `COVERED_KINDS` |
| `TypeError::ExternMissingLibrary` | T0902 | `extern_profile_findings` | `COVERED_KINDS` |
| `TypeError::ExternDisallowedParamType` (C user profile) | T0903 | `extern_profile_findings` | `COVERED_KINDS` |
| `TypeError::ExternDisallowedReturnType` (C user profile) | T0904 | `extern_profile_findings` | `COVERED_KINDS` |
| Glue `Extern` methods and `RustOwner` placements (manifest Glue library) | T0903 | `extern_profile_findings` (`glue_binding`, `rust_owner_declarations`) | `glue_library_extern_methods_are_held_to_the_glue_binding_authority` |
| `TypeError::NumericLiteralOutOfRange` (suffixed integer, float) | T0905 | `gate_obligations` | `COVERED_KINDS` |

Not legacy `TypeChecker` obligations (no construction site): E1205
`CallArgumentMismatch`, E1305 `MatchArmTypeMismatch` (staged rule), E1225
`StackReferenceEscapesSpawn` (gate renders the `spawn_legality` diagnostic).

### Rows closed in phase 3 (previously "not yet covered")

| Legacy class | Code | Query obligation | Test (module: fixture) |
| --- | --- | --- | --- |
| `TypeError::TypeMismatch` (generic callee arguments) | E1206 | `value_obligations` (`collect_call_argument_values`, `callee_substitutions`) | `parity_values`: rows a |
| `TypeError::TypeMismatch` (contract dispatch, callable value, event raise) | E1206 | `value_obligations` (`collect_callable_value_call_values`, `collect_event_raise_values`) | `parity_values`: rows b, c, d |
| `TypeError::TypeMismatch` (lambda body and parameters against an expected signature) | E1206 | `value_obligations` (`judge_lambda_body`) | `parity_values`: row e |
| `TypeError::TypeMismatch` (contract-typed destination) | E1206 | `value_obligations` (`Destination::Contract`, `contract_accepts`) | `parity_values`: row f |
| `TypeError::TypeMismatch` (generic `type` literal fields, generic `enum` constructor arguments) | E1206 | `value_obligations` (`literal_generic_arguments`, `generic_declared_destination`) | `parity_values`: row g |
| `TypeError::TypeMismatch` (nested payload patterns) | E1206 | `value_obligations` (`judge_pattern`) | `parity_values`: row h |
| `TypeError::TypeMismatch` (`return <value>` in a `test` body; legacy result `unit`) | E1206 | `typing_obligations` (primitive), `value_obligations` (nominal) | `parity_literals_externs_clif`: `valued_return_in_a_test_is_a_type_mismatch`; `parity_values`: row i |
| `TypeError::UnknownValueType` (item named as a value, type-qualified value path) | E1201 | `gate_obligations::UnknownValueType` | `parity_resolution`: `COVERED_KINDS` |
| `TypeError::InvalidMemberTarget`, `UnknownStructField`, `UnknownStructType` (field paths of three or more segments) | E1213, E1211, E1201 | `gate_obligations` (`collect_member_obligations` path walk) | `parity_resolution`: `COVERED_KINDS` |
| `TypeError::JoinWouldDeadlock` | E1224 | `gate_obligations::JoinWouldDeadlock` (no reachable legacy emission shape; see phase 3) | `parity_literals_externs_clif`: `join_of_a_handle_inside_its_own_spawned_lambda_is_not_a_deadlock_finding` |
| `TypeError::NumericLiteralOutOfRange` (unsuffixed literal against a contextual destination) | T0905 | `gate_obligations::NumericLiteralOutOfRange` (`contextual_integer_literal_abi_type`) | `parity_literals_externs_clif`: `UNSUFFIXED_OUT_OF_RANGE` |
| `TypeError::ContractMethodMissingImplementation`, `ContractAssociatedTypeMissingBinding` (generic implementors, applied generic contracts) | E1601, E1607 | `unit_obligations` (`collect_conformance_obligations`) | `parity_resolution`: `COVERED_KINDS` |
| `TypeError::ContractImplementationSignatureMismatch` (generics) | E1602 | `unit_obligations`, closed signatures only; an open signature (mentioning a contract or implementor generic) is not judged | `parity_resolution`: `COVERED_KINDS`, `SILENT` |
| `TypeError::EnumConstructorMismatch` (pattern arity) | E1307 | `member_reference_legality::PatternArity` (ruling: E1307 is the code for pattern arity) | `parity_tests`: `COVERED` E1307 |
| `ResolveError::DuplicateSymbol`, `DuplicateItem` (across units of one module, `mod` declarations, builtin collisions) | E1102 | `unit_obligations` (`collect_cross_unit_duplicate_obligations`, `collect_module_declaration_obligations`, `collect_builtin_collision_obligations`) | `parity_resolution`: `duplicate_item_across_units_of_one_module_is_reported_in_the_later_unit`, `COVERED_KINDS` |
| `ResolveError::UnknownTypeInModule`, `PrivateItemInModule`, `UnknownModulePath` (type paths) | E1201, E1107, E1108 | `unresolved_type_reference` (classified kind) | `parity_resolution`: `qualified_type_paths_are_classified_like_the_legacy_resolver` |
| `ResolveError::UnknownValueInModule`, `PrivateItemInModule`, `UnknownModulePath` (non-call value paths) | E1101, E1107, E1108 | `unit_obligations::ValuePath` (`value_paths.rs`) | `parity_resolution`: `qualified_value_paths_are_classified_like_qualified_callees` |
| `TypeError::InaccessibleStructField` | E1211 | `member_reference_legality::InaccessibleStructField` | `parity_resolution`: `private_field_of_another_unit_is_inaccessible` |
| `TypeError::InvalidClifBlock` | E1232 | `gate_obligations::InvalidClifBlock` (`gate/clif.rs`) | `parity_literals_externs_clif`: `CLIF_CLASSES` |
| `TypeError::ExternInvalidOptional` | T0906 | `extern_profile_findings` | `parity_literals_externs_clif`: `invalid_optional_extern_contracts_are_reported_as_t0906` |
| `TypeError::UnknownType` (`where` bound parameter or contract) | E1201 | `unit_obligations::UnresolvedWhereBound` | `prepare_diagnostics_authority`: `prepare_diagnostics_rejects_*bound*` |
| `TypeError::GenericBoundNotSatisfied` (unconstrained forwarding of a caller generic) | E1610 | `gate_obligations::GenericBoundNotSatisfied` (`judge_unconstrained_forwarding`) | `prepare_diagnostics_authority`: `prepare_diagnostics_rejects_unconstrained_generic_forwarding_with_code` |

### Corelib false-positive patterns (query gate must stay silent)

`parity_tests.rs` negative cases, each asserting zero findings from the query
gate alone: generic-bound member call `r.Resolve(x)` with `where R: Resolver`;
`return`-ending arm in a value `match`; contextual `Result::Error(e)` assigned
to a declared `Result<i64, string>` local; hub `pub mod` declarations; a local
function named like an enum variant. Phase 2 adds
`well_typed_nominal_positions_produce_no_finding` (contract conformance,
contract-typed parameter, nominal struct, enum, method, and pattern
positions) and keeps `clean_root_items_produce_no_finding`. The legacy checker
is unchanged by this slice (another worker owns its corelib fixes), so
`beskid check` still reports the legacy false positives until that slice lands
or the legacy path is removed.

## Removal condition

Met in phase 3: every row of the former "not yet covered" table has a query obligation and a
parity fixture, and the legacy checker no longer renders diagnostics on the `check`, `analyze`,
or language-server path. `check_typing_obligations` stays a `check`-gate obligation set; the
codegen gate (`check_items`) keeps judging what lowering needs, and a build still fails closed on
the executable front end.

## Verification (coordinator, cwd `compiler/`)

- `cargo test --locked -p beskid_queries --lib parity` (every parity module; `parity_tests` keeps
  the negative corpus)
- `cargo test --locked -p beskid_queries --lib legality`
- `cargo test --locked -p beskid_queries --lib entry`
- `cargo test --locked -p beskid_queries --test prepare_diagnostics_authority --test
  unavailable_inventory --test try_diagnostics --test undefined_argument_diagnostics`
- `cargo test --locked -p beskid_analysis --lib prepare` and `-- diagnostic_kinds`
- `cargo test --locked -p beskid_cli analyze` / `check`
- `cargo test --locked -p beskid_tests_projects diagnostics_parity`
- `cargo test --locked -p beskid_lsp diagnostics`
