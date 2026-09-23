## 1. Validate and establish RED evidence

- [x] 1.1 Create the proposal, design, tasks, and complete capability delta.
- [x] 1.2 Validate this change strictly and validate the repository OpenSpec
  standard without running compiler or Cargo commands.
- [x] 1.3 Add failing tests proving `impl T : Contract { ... }` produces a
  conformance edge and `stage6` fires E1601/E1602 on missing/mismatched
  methods (Gap 2). Note: `stage6_contracts_and_methods` (the `run_rules`
  diagnostics-layer stopgap) was later *deleted*; conformance equality now
  lives in `TypeChecker::check_contract_conformances`, reusing the same
  E1601/E1602 diagnostic codes via new `TypeError` variants. See the
  "Semantic-pipeline reorder" task below.
- [x] 1.4 Add failing tests proving `contract Iterator<T> { Option<T> ... }`
  resolves `T` in method signatures and rejects arity mismatches at the
  conformance site (Gap 1).
- [x] 1.5 Add failing tests proving `This` in a contract signature substitutes
  to the impl receiver type and that a return-type mismatch is flagged by
  `FunctionSignature` equality (Gap 4).
- [x] 1.6 Add failing tests proving a `where T: Contract` bound rejects a
  non-conforming call inside `generic_specialization_instance_for_call`
  (Gap 3). Scope note: bound checked on standalone generic functions only
  (`FunctionDefinition.where_bounds`); `type`/`enum`/impl-method/contract
  generics do not yet carry bounds. See task 2.3's scope note.
- [x] 1.7 Add failing tests proving `This` out of context and an unresolved
  associated-type reference are rejected (Gap 4). Landed on
  `codex/v05-contracts` (slice 9): `this_used_outside_contract_or_impl_is_rejected`
  and `unresolved_associated_type_reference_is_rejected`
  (`crates/beskid_analysis/src/types/checker/contracts.rs`). Scope note: the
  associated-type case only covers the "no early binding available yet"
  path (`Type::Associated` always fails closed with `UnresolvedAssociatedType`
  during the main per-item typing pass, since per-implementor bindings are
  only known after `check_contract_conformances` runs later) -- see task
  3.5's note below for the same deferral.

## 2. Introduce replacement authorities

- [x] 2.1 Add `GenericParameters?` to `ContractDefinition` and
  `GenericArguments?` to `ContractEmbedding` in `beskid.pest`; add
  `generics` to `ContractDefinition` and `type_args` to `ContractEmbedding`
  AST nodes (Gap 1).
- [x] 2.2 Add `ImplConformanceList` to `ImplBlock` in `beskid.pest`; add
  `conformances` to `ImplBlock` AST; make `ImplBlock` a first-class
  `Node::ImplBlock` variant and stop flattening at parse (Gap 2).
- [~] 2.3 Add `WhereClause` and `TypeBound` to `beskid.pest` -- done. Scope
  narrowed: instead of a `GenericParameter { name, bounds }` struct
  *replacing* `Vec<Spanned<Identifier>>` everywhere generics are declared
  (which ripples through every `.generics` consumer across
  `beskid_analysis`/`beskid_queries`), added an additive
  `where_bounds: Vec<WhereBound>` field on `FunctionDefinition` only.
  `TypeDefinition`/`EnumDefinition`/impl-method generics still have no
  bounds. The `GenericParameter` unification remains the right design for
  a future slice that adds bounds to more than one generic-parameter-
  bearing declaration kind.
- [x] 2.4 Add `ThisType` to `beskid.pest` and the `Keyword` list; add
  `Type::This` variant (Gap 4). Deviation: `TypeInfo::This_` was *not*
  added as a new variant -- `This` is represented as a synthetic,
  always-in-scope generic parameter (`TypeInfo::GenericParam("This")`),
  reusing `substitute_type_id`/`generic_mapping_for_type_id` verbatim
  instead of adding a new, more central `TypeInfo` variant. See the
  contracts-system slice-7 commit message for the full rationale.
  `ContractAssociatedType`/`ContractNode::AssociatedType` landed in slice 9
  (`type Item;` / `type Item = Default;` inside a contract body;
  `AssociatedTypeBinding` -- `type Item = Concrete;` -- inside an
  implementor's `type X : C { }` / `impl X : C { }` body).
- [x] 2.5 Mint the generation-bound conformance query in `beskid_queries`
  from `type X : C` and `impl X : C` syntax (Gap 3, reused by 2/4).
- [x] 2.6 Replace the arity-only `method_signature_string` with
  `FunctionSignature` (`TypeId`-based) equality after `This` substitution
  (Gap 2 #4 / Gap 4 #8). Landed in two steps: first a structural
  (declared-syntax-shape) stopgap comparator (since
  `stage6_contracts_and_methods` ran before type-checking on `main` at the
  time), then replaced by the real `TypeId`-based comparator once the
  semantic-pipeline reorder task (below) moved conformance checking after
  type-checking. Associated-type substitution not started (slice 9).
- [ ] 2.7 Add the `GenericBoundNotSatisfied` diagnostic variant to
  `SemanticIssueKind` and regenerate the compiler-sdk `Diagnostics.bd`
  mirror (Gap 3). Not started: the where-bound check (task 3.3) returns
  `Err(SemanticError::new(...))` from `beskid_queries`, satisfying "fail
  closed" for ISLE, but does not yet surface through
  `SemanticIssueKind`/`emit_type_error` as a compiler diagnostic the way
  E1601/E1602 do.

### 2a. Semantic-pipeline reorder (added 2026-09-23, owner ruling)

`stage6_contracts_and_methods` originally ran inside the `run_rules`/
`RuleContext` diagnostics pipeline (`analysis/rules/staged.rs`), which
never runs full type checking (`stage2_type_check` there is structural-
immutability-only; "full type-check runs in the lower spine" per its own
doc comment). A stage living there could only ever compare declared syntax
shapes, never real types -- so task 2.6's `FunctionSignature` (`TypeId`-
based) equality could not be implemented in place. Owner ruling: move
contract conformance checking into the real `TypeChecker` itself, as its
own task, before `This` (slice 7).

- [x] 2a.1 Delete `stage6_contracts_and_methods` and its `analysis/rules/
  staged/contracts.rs` module (the structural stopgap and its call site in
  `staged.rs`).
- [x] 2a.2 Add `TypeChecker::check_contract_conformances`
  (`types/checker/contracts.rs`), called once per unit from `check_entry`
  after the main per-item typing loop (needs both the contract's declared
  signature and every implementor's actual signature). Reuses the
  pre-existing `seed_contract_signatures`/`self.contract_signatures`
  (already generation-bound and embedding-recursive) and
  `self.function_signatures`.
- [x] 2a.3 Fix `seed_contract_signatures` to push a contract's own generic
  parameters into scope before resolving its declared signatures (a latent
  gap: `T` inside `contract Box<T> { T Get(); }` silently fell back to
  `unit` before this fix, invisible until slice 4/5 gave contracts generics
  at all).
- [x] 2a.4 Add two new `TypeError` variants
  (`ContractMethodMissingImplementation`,
  `ContractImplementationSignatureMismatch`, carrying `FunctionSignature`)
  and `emit_type_error` arms mapping them to the *same* `SemanticIssueKind`s
  (and E1601/E1602 diagnostic codes) the deleted stopgap used, via a new
  `render_function_signature` helper.
- [x] 2a.5 Root-cause and fix a real, pre-existing, unrelated bug found
  while wiring 2a.2: `resolve/member_items.rs`'s `Node::TypeDefinition`
  branch double-registered every inline method (and its parameters) as a
  second, receiver-less, symbol-less `ItemId` alongside
  `resolve/collect.rs`'s already-correct dedicated registration --
  `record_signature`'s `canonical_item_id_for_span` silently dropped the
  duplicate's signature, while `item_id_for_span`/`item_id_for_name` had
  two identically-named, identically-spanned candidates to choose between.
  Fixed by removing the duplicate registration (methods stay covered by the
  dedicated block). This also incidentally fixed three pre-existing,
  unrelated `mod_host::registrations` test failures caused by the same
  ambiguity.

## 3. Wire typechecker, resolver, and queries

- [x] 3.1 Replace the no-op `Node::ContractDefinition` arm with the
  push-into-`generic_params` / type signatures / pop pattern; add the
  `Node::ContractDefinition` arm to `seed_generics_from_items` (Gap 1).
- [x] 3.2 Add the `Node::ImplBlock` resolver arm paralleling
  `Node::TypeDefinition` to create conformance edges (Gap 2).
- [x] 3.3 Add the bound check inside
  `generic_specialization_instance_for_call` after `substitutions` is
  populated; non-conformance ⇒ `Err(SemanticError)` (Gap 3). Scope: see
  task 2.3's note (standalone generic functions only).
- [~] 3.4 `This` substitution: done via `substitute_type_id`/
  `generic_mapping_for_type_id` (`helpers.rs`, unchanged, reused as-is
  since `This` is `TypeInfo::GenericParam("This")`) and the new
  `Type::This` arm in `type_id_for_type`/`type_id_for_type_path`
  (`types.rs`). The lowering-prep mirror (`lowering_prep/substitution.rs`)
  needed *no* edit -- it already substitutes any `TypeInfo::GenericParam`
  generically. `generic_abi_type` (`abi/specialization.rs`) and every other
  exhaustive `Type` match in the ABI/source-identity layer
  (`calls/generics.rs`, `abi/types.rs`, `layouts/*.rs`, `typing.rs`) fail
  closed on `Type::This` rather than substituting it -- `This` reaching
  that layer is the bounded-generic case (Gap 3 dependency), out of scope
  for direct-impl sites.
- [x] 3.5 Contract-signature seeding stores `This` as
  `TypeInfo::GenericParam("This")` (not `Named(contract_item)`) --
  `seed_contract_signatures` pushes it into scope alongside the contract's
  real generics; `check_contract_conformances` substitutes it with the
  conforming type's own `TypeId` (`self.named_types[type_item_id]`).
  `associated_type_bindings: HashMap<(ItemId, String), TypeId>` landed in
  slice 9, populated by `check_contract_conformances` from the
  implementor's own binding or the contract's declared default (missing
  both is `TypeError::ContractAssociatedTypeMissingBinding`, E1607). A
  contract's own declared associated-type names are in scope as bare
  identifiers in its method signatures, the same way `This` is (pushed
  into `generic_params` by `seed_contract_signatures` and the per-item
  `type_item` pass). Deviation: `Type::Associated` (`T::Item` double-colon
  resolution) is NOT yet wired to consult this table during the main
  per-item typing pass -- that pass runs *before*
  `check_contract_conformances` populates it, so every `Type::Associated`
  reference outside a contract's own bare-name scope fails closed with
  `TypeError::UnresolvedAssociatedType` (E1609) rather than resolving.
  Full early/bound-site `T::Item` resolution (spec scenario "Associated
  type reference uses double-colon syntax at a bound site") is deferred to
  a future slice, mirroring the already-documented Gap 3 dependency for
  bounded-generic `This`.
- [ ] 3.6 Teach `method_declaration_for_member_receiver` to consult a
  `where T: C` bound for generic receivers, resolving `x.Method()` against
  the contract signatures (Gap 3). Not started -- the where-bound check
  (3.3) validates the bound at the call site but does not yet extend
  member-call resolution through a bounded generic receiver.
- [ ] 3.7 Generalize `ContractDispatch` to consult `type_conformances` →
  `methods_by_receiver` → static `MethodDispatch` for contract-typed
  receivers (Gap 2). Not started.

## 4. Migrate corelib and fixtures

- [x] 4.1 Replace the empty `Iterator` marker at `Query/Iterator.bd:8` with
  `contract Iterator<T> { type Item; Option<Item> Current(); This MoveNext(); }`
  (Gaps 1, 4). Landed on corelib branch `codex/v05-contracts-slice10`,
  commit `1a75f58`. No corelib type declared `: Iterator` conformance
  before this, so this was an isolated leaf edit; a concrete conformance
  (`ArrayIterator<T> : Iterator<T>`) landed separately in slice 11.
- [x] 4.2 Migrate `Rewriter` in `Collect.bd:114-116` from bare
  `TSourceNode`/`TTargetNode` to declared contract type parameters or
  associated types (Gaps 1, 4). Landed in the same corelib commit
  (`1a75f58`) as real declared generics: `contract Rewriter<TSourceNode,
  TTargetNode> { ... }`. The identical heredoc in `regen_mod_sdk_surfaces.sh`'s
  `write_collect` (`Collect.bd`'s actual regeneration source) updated to
  match.
- [x] 4.3 Update `AnsiStyleStep` and sibling fluent contracts in
  `console/Ansi/Contracts.bd` to use `This` return types (Gap 4). Landed
  in `1a75f58`, all six step contracts (`AnsiStyleStep`, `AnsiCursorStep`,
  `AnsiEraseStep`, `AnsiScreenStep`, `AnsiOscStep`, `AnsiInputModeStep`).
  A concrete conformance (`StyleChain : AnsiStyleStep`) landed separately
  in slice 11.
- [x] 4.4 Update generated fixtures, `regen_mod_sdk_surfaces.sh` outputs,
  and informative docs to the new syntax. `regen_mod_sdk_surfaces.sh`
  (`cargo run -p beskid_ast_reflect_gen`) re-run on the remote builder;
  output committed in `1a75f58` alongside pre-existing, previously-never-
  regenerated drift from already-landed unrelated Rust-side renames (see
  the commit message for the itemized list) -- kept per design.md's "the
  mirror propagates without hand-edit" rule rather than hand-picked.

## 5. Verify

- [x] 5.1 Run `cargo test -p beskid_analysis` and confirm contract
  conformance, generic-contract, `This`, and bound tests pass. Green:
  322/322 (remote NixOS builder, worktree `.worktrees/compiler-v05-
  contracts`, branch `codex/v05-contracts`).
- [x] 5.2 Run `cargo test -p beskid_queries` and confirm the
  generation-bound conformance fact and bound admission tests pass. Green:
  227/227.
- [ ] 5.3 Run `just corelib` and confirm the corelib matrix is green. Not
  run. Slice 10's contract-declaration-only edits (`Query/Iterator.bd`,
  `Collect.bd`'s `Rewriter`, `console/Ansi/Contracts.bd`) verified via
  `beskid_cli analyze` instead (see slice-10 note above). Slice 11's
  concrete conformances (`ArrayIterator<T> : Iterator<T>`, `StyleChain :
  AnsiStyleStep`) and their corelib tests are written but **unverified**
  -- interrupted mid-verification by the remote builder (10.66.0.2) going
  offline (2026-09-23). See the plan doc's "Status" section
  (`docs/superpowers/plans/2026-09-22-v05-contract-system.md`) for the
  exact resume state before running this.
- [ ] 5.4 Run `pnpm run openspec:validate` and confirm the OpenSpec
  standard validates. Not run.
- [x] 5.5 Run `cargo test -p beskid_isle` and confirm ISLE is unaffected.
  Green, all tests pass -- confirms `DirectCallee::SpecializedItem` is only
  minted from a successful specialization, so the where-bound check (3.3)
  is invisible to ISLE by construction.

Slice 9 (associated types, `codex/v05-contracts`) verification: `cargo test
-p beskid_analysis` green, 331/331 (322 baseline + 9 new: parser tests in
`contract_associated_type.rs`/`associated_type_binding.rs`, conformance
tests in `types/checker/contracts.rs`). `cargo test -p beskid_queries`
227/227, `cargo test -p beskid_tests_surface` 266/266, `cargo test -p
beskid_isle` all green -- no regressions from the shared-file
`NodeKind`/`ContractNode`/`Type` exhaustive-match updates required to keep
the workspace compiling (`beskid_isle/src/facts.rs`,
`beskid_queries/src/semantic_contract/contracts.rs`, and several
`beskid_analysis` exhaustive matches over `ContractNode`).

Also verified: `cargo test -p beskid_tests_surface` 266/266;
`cargo check --workspace --all-targets` clean except one pre-existing,
unrelated `beskid_cli` test-target `include_str!` path bug (present before
any of this change's commits, not touched by it); `cargo test -p
beskid_lsp` has 8 pre-existing, environment-only failures (missing
`beskid_vscode` submodule / corelib dependency paths in the remote
builder's slice copy) unrelated to this change.
