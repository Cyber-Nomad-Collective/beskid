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

### Not yet covered (legacy checker retained for these)

| Legacy class | Code | Remaining shape |
| --- | --- | --- |
| `TypeError::TypeMismatch` | E1206 | arguments of generic callees (other than E1229 conflicts), contract-dispatch and callable-value calls, and event raises; lambda bodies and lambda arguments against an expected signature; contract-typed destinations (conformance); fields of generic `type` literals and arguments of generic `enum` constructors; nested payload patterns |
| `TypeError::ReturnTypeMismatch` | E1207 | `return` inside a `test` body |
| `TypeError::UnknownValueType` | E1201 | a single-segment path naming a non-local item as a value; a local without a typed declaration; a multi-segment value path whose base is not a local |
| `TypeError::InvalidMemberTarget`, `UnknownStructField` | E1213, E1211 | field paths of three or more segments through a primitive |
| `TypeError::JoinWouldDeadlock` | E1224 | obligation present in `gate/control.rs`; no fixture (needs a handle joined inside its own spawned lambda) |
| `TypeError::NumericLiteralOutOfRange` | T0905 | unsuffixed integer literals against a contextual destination (`i8 x = 300;`) |
| `TypeError::ContractMethodMissingImplementation`, `ContractImplementationSignatureMismatch`, `ContractAssociatedTypeMissingBinding` | E1601, E1602, E1607 | generic implementors and generic contracts |
| `TypeError::EnumConstructorMismatch` (pattern arity) | E1302 | the legacy checker reports pattern arity as E1302; the query reports E1307 (`member_reference_legality::PatternArity`) at the same pattern |
| `ResolveError::DuplicateSymbol`, `DuplicateItem` across units | E1102 | symbol collisions between units of one module or package, `mod` declarations, builtin collisions |
| `ResolveError::UnknownTypeInModule`, `PrivateItemInModule`, `UnknownModulePath` (type paths) | E1201, E1107, E1108 | the query reports every unresolved type path as E1201 (`unresolved_type_reference`); a private or module-missing type path keeps a different legacy code |
| `ResolveError::UnknownValueInModule`, `PrivateItemInModule`, `UnknownModulePath` (value paths that are not call targets) | E1101, E1107, E1108 | `Module.Constant` and other non-call value paths are not judged |

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

The legacy checker leaves `additional_root_diagnostics` and diagnostics-only
`check` when every row of the "not yet covered" table has a query obligation
and a parity fixture, and `check_typing_obligations` has been promoted into the
codegen gate (`check_items`) so build and check judge the same obligations.
After phase 2 the open rows are the table above; until they close, both
authorities run and the spine deduplicates.

## Verification (coordinator, cwd `compiler/`)

- `cargo test --locked -p beskid_queries legality` (typing fact unit tests)
- `cargo test --locked -p beskid_queries parity_tests` (query-only parity,
  `COVERED_KINDS`, Glue, and negative corpus; the `COVERED_KINDS` test lists
  every failing class in one run)
- `cargo test --locked -p beskid_queries entry` (roots gate, corelib service,
  runtime fixture, entry-less library through the spine)
- `cargo test --locked -p beskid_queries --test unavailable_inventory`
- `cargo test --locked -p beskid_analysis prepare`
- `cargo test --locked -p beskid_cli check`
- `beskid check` over the corelib packages (with the isolated `BESKID_HOME` and
  `BESKID_CONFIG_DIR`), to compare the error inventory against the rc11 logs
  in `.build/rc11-check-corelib*.log`
