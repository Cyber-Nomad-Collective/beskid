## 1. Validate and establish RED evidence

- [x] 1.1 Create the proposal, design, tasks, and complete capability delta.
- [x] 1.2 Validate this change strictly and validate the repository OpenSpec
  standard without running compiler or Cargo commands.
- [ ] 1.3 Add failing tests proving `impl T : Contract { ... }` produces a
  conformance edge and `stage6` fires E1601/E1602 on missing/mismatched
  methods (Gap 2).
- [ ] 1.4 Add failing tests proving `contract Iterator<T> { Option<T> ... }`
  resolves `T` in method signatures and rejects arity mismatches at the
  conformance site (Gap 1).
- [ ] 1.5 Add failing tests proving `This` in a contract signature substitutes
  to the impl receiver type and that a return-type mismatch is flagged by
  `FunctionSignature` equality (Gap 4).
- [ ] 1.6 Add failing tests proving a `where T: Contract` bound rejects a
  non-conforming call inside `generic_specialization_instance_for_call`
  (Gap 3).
- [ ] 1.7 Add failing tests proving `This` out of context and an unresolved
  associated-type reference are rejected (Gap 4).

## 2. Introduce replacement authorities

- [ ] 2.1 Add `GenericParameters?` to `ContractDefinition` and
  `GenericArguments?` to `ContractEmbedding` in `beskid.pest`; add
  `generics` to `ContractDefinition` and `type_args` to `ContractEmbedding`
  AST nodes (Gap 1).
- [ ] 2.2 Add `ImplConformanceList` to `ImplBlock` in `beskid.pest`; add
  `conformances` to `ImplBlock` AST; make `ImplBlock` a first-class
  `Node::ImplBlock` variant and stop flattening at parse (Gap 2).
- [ ] 2.3 Add `WhereClause` and `TypeBound` to `beskid.pest`; introduce
  `GenericParameter { name, bounds }` AST struct; replace
  `Vec<Spanned<Identifier>>` on `FunctionDefinition`, `TypeDefinition`,
  `EnumDefinition` (Gap 3).
- [ ] 2.4 Add `ThisType` to `beskid.pest` and the `Keyword` list; add
  `Type::This` and `TypeInfo::This_` variants; add
  `ContractAssociatedType` rule and `ContractNode::AssociatedType` variant
  (Gap 4).
- [ ] 2.5 Mint the generation-bound conformance query in `beskid_queries`
  from `type X : C` and `impl X : C` syntax (Gap 3, reused by 2/4).
- [ ] 2.6 Replace the arity-only `method_signature_string` at
  `contracts.rs:167-170` with `FunctionSignature` (`TypeId`-based) equality
  after `This`/associated-type substitution (Gap 2 #4 / Gap 4 #8).
- [ ] 2.7 Add the `GenericBoundNotSatisfied` diagnostic variant to
  `SemanticIssueKind` and regenerate the compiler-sdk `Diagnostics.bd` mirror
  (Gap 3).

## 3. Wire typechecker, resolver, and queries

- [ ] 3.1 Replace the no-op `Node::ContractDefinition` arm at `items.rs:333`
  with the push-into-`generic_params` / type signatures / pop pattern; add the
  `Node::ContractDefinition` arm to `seed_generics_from_items` (Gap 1).
- [ ] 3.2 Add the `Node::ImplBlock` resolver arm paralleling
  `Node::TypeDefinition` at `items_statements.rs:107-124` to create
  conformance edges (Gap 2).
- [ ] 3.3 Add the bound check inside
  `generic_specialization_instance_for_call` after `substitutions` is
  populated; non-conformance ⇒ `Err(SemanticError)` (Gap 3).
- [ ] 3.4 Add `This` substitution to `substitute_type_id`
  (`helpers.rs:243`), `type_id_for_type_path` (`types.rs:217`), lowering-prep
  `substitute_type_id` (`lowering_prep/substitution.rs:9`), and
  `generic_abi_type` (`specialization.rs:426`); seed the `THIS_KEY` in
  `generic_mapping_for_type_id` and `method_dispatch_signature` (Gap 4).
- [ ] 3.5 Store a `This` marker (not `Named(contract_item)`) in
  contract-signature seeding (`contracts.rs:102-111`); add the
  `associated_type_bindings` table populated at `: Contract` declaration
  (Gap 4).
- [ ] 3.6 Teach `method_declaration_for_member_receiver` (`resolution.rs:200`)
  to consult a `where T: C` bound for generic receivers, resolving
  `x.Method()` against the contract signatures (Gap 3).
- [ ] 3.7 Generalize `ContractDispatch` (`walker.rs:590-641`) to consult
  `type_conformances` → `methods_by_receiver` → static `MethodDispatch` for
  contract-typed receivers (Gap 2).

## 4. Migrate corelib and fixtures

- [ ] 4.1 Replace the empty `Iterator` marker at `Query/Iterator.bd:8` with
  `contract Iterator<T> { type Item; Option<Item> Current(); This MoveNext(); }`
  (Gaps 1, 4).
- [ ] 4.2 Migrate `Rewriter` in `Collect.bd:114-116` from bare
  `TSourceNode`/`TTargetNode` to declared contract type parameters or
  associated types (Gaps 1, 4).
- [ ] 4.3 Update `AnsiStyleStep` and sibling fluent contracts in
  `console/Ansi/Contracts.bd` to use `This` return types (Gap 4).
- [ ] 4.4 Update generated fixtures, `regen_mod_sdk_surfaces.sh` outputs,
  and informative docs to the new syntax.

## 5. Verify

- [ ] 5.1 Run `cargo test -p beskid_analysis` and confirm contract
  conformance, generic-contract, `This`, and bound tests pass.
- [ ] 5.2 Run `cargo test -p beskid_queries` and confirm the
  generation-bound conformance fact and bound admission tests pass.
- [ ] 5.3 Run `just corelib` and confirm the corelib matrix is green.
- [ ] 5.4 Run `pnpm run openspec:validate` and confirm the OpenSpec
  standard validates.
- [ ] 5.5 Run `cargo test -p beskid_isle` and confirm ISLE is unaffected.
