## Context

The `contract` construct is a first-class grammar rule (`beskid.pest:233`) but
the typechecker arm at `items.rs:333` is a no-op, contracts cannot declare
generic parameters, no syntax links an `impl` block to a contract, generic
parameters carry no bounds, and `This` does not exist. A general user-language
conformance check already exists at `analysis/rules/staged/contracts.rs:9-55`
(`stage6_contracts_and_methods`), driven by `type T : Contract { ... }` syntax;
the mod-SDK `registrations.rs` is a downstream consumer of the same
`type_conformances` table. The conformance comparison is arity-only
(`contracts.rs:167-170` → `format!("ret(N)")`), so return-type mismatches are
not flagged.

Contracts are already nominal types: `seed_types` (`helpers.rs:30-40`) interns
contracts as `TypeInfo::Named(item.id)`. So `This` does not require contracts
to "become types" — they already are. `This` is a placeholder substituted at
the impl site and at the monomorphized bound site.

`impl` is used zero times in corelib and runtime `.bd` source, so introducing
`impl T : Contract { ... }` has no existing call sites to break. `ImplBlock` is
currently flattened to individual `Node::Method` items at parse
(`doc_attached_items.rs:35-50`); `ExtendTypeDefinition` is a first-class `Node`
variant. The conformance clause attached to an `ImplBlock` would be lost when
flattened, so `ImplBlock` must become a `Node` variant.

The `beskid_queries` semantic-contract SOT (the authority for call lowering,
specialization, and ISLE) has no conformance fact today; the legacy
`beskid_analysis` layer owns `type_conformances` and `is_contract_compatible`
(`helpers.rs:349-367`). Gaps 2, 3, and 4 all need a conformance fact in the SOT.

Normative behavior remains owned by OpenSpec. The grammar owns syntax; the
typechecker owns conformance validation; `beskid_queries` owns the
generation-bound conformance fact and bound admission; ISLE and codegen own
monomorphization. No generated artifact or implementation becomes a second
authority.

## Goals / Non-Goals

**Goals:**

- Make `contract` a real type-system primitive: generic contracts, `impl`
  conformance, generic bounds, `This`, and associated types.
- Replace the arity-only conformance comparison with `FunctionSignature`
  equality so return-type and `This` mismatches are flagged.
- Mint one generation-bound conformance fact in `beskid_queries`, reused by
  `impl` conformance, generic bounds, and `This` substitution.
- Keep ISLE unaffected: bounds and `This` substitution complete before
  `DirectCallee::SpecializedItem` is minted.
- Keep `this` as the only receiver value name (a regular identifier, not a
  keyword); do NOT introduce `self` as a keyword, receiver name, or parameter
  name.

**Non-Goals:**

- Dynamic dispatch, vtables, trait objects, or existential boxing. Beskid is
  AOT and monomorphizes; dispatch remains static.
- Default method bodies in contracts (signatures only, as today).
- `requires`/`ensures` design-by-contract assertions.
- Migrating all corelib fluent implementors to `impl` form (the syntax is
  available; migration is a follow-on corelib task, not a contract-system
  requirement).
- Settling the `self` vs `this` receiver value name question: `this` stays (a
  regular identifier, not a keyword); `self` is excluded from the language.

## Decisions

### Generic contracts reuse the existing `GenericParameters` rule

`ContractDefinition` SHALL insert `GenericParameters?` between `Identifier`
and `{`, paralleling `EnumDefinition` (`beskid.pest:228`). No new grammar rule
is needed; `GenericParameters` (`:182`) and `GenericArguments` (`:183`) are
reused verbatim. PEG ambiguity is none: after `Identifier`, the next token is
either `<` (start of `GenericParameters`) or `{` (start of body). The
typechecker pushes the contract's params into `generic_params` before typing
signatures and pops them after, matching the enum pattern at `items.rs:301-331`.

`ContractEmbedding` SHALL gain `GenericArguments?` so a generic contract can
be embedded with type arguments (`Iterator<T>;`). `ContractMethodSignature`
SHALL NOT be individually generic — it inherits scope from the enclosing
contract, matching `ImplMethodDefinition` (`:208`).

### `impl` conformance is a new surface feeding an existing pipeline

`ImplBlock` SHALL gain an optional `ImplConformanceList = { ":" ~ PathList }`
after the receiver type, mirroring `TypeConformanceList` (`:222`). The
conformance edge is created in a new `Node::ImplBlock` resolver arm paralleling
the `Node::TypeDefinition` arm at `items_statements.rs:107-124`. The existing
`stage6_contracts_and_methods` check needs no new pass — it already finds impl
methods via `impl_method_signature_for_type` (`contracts.rs:123-165`).

`ImplBlock` SHALL become a first-class `Node::ImplBlock` variant and stop being
flattened at parse, so the conformance clause is preserved (like
`ExtendTypeDefinition`). `impl T : Contract` is the closed/in-module form with
private-member access; it is NOT subject to `ExtendTypePrivateMemberAccess`
(E1511).

### Generic bounds are a declaration property, not type identity

`WhereClause = { "where" ~ TypeBound ~ ("," ~ TypeBound)* }` with
`TypeBound = { Identifier ~ ":" ~ Path }` SHALL slot after the parameter list
and before the body on `FunctionDefinition` and `ImplMethodDefinition`. A new
`GenericParameter { name, bounds: Vec<Spanned<Path>> }` AST struct replaces
`Vec<Spanned<Identifier>>` on the three generic-bearing definitions.
`TypeInfo::GenericParam(String)` and `GenericSubstitution.parameter` stay
name-only — bounds are consulted only at the admission gate, never during
substitution or ABI identity computation.

The bound check SHALL run inside
`generic_specialization_instance_for_call` (`abi/specialization.rs:9`) after
`substitutions` is populated and before `Ok(GenericSpecializationInstance)` is
returned. Non-conformance ⇒ `Err(SemanticError)` (fail closed). ISLE sees only
concrete specialized calls (`DirectCallee::SpecializedItem` carries the
already-concrete `abi_identity`), so ISLE is unchanged.

### `This` is a placeholder substituted at the impl site and bound site

`This` SHALL be a reserved keyword and a `BeskidType` variant (`Type::This`,
`TypeInfo::This_`). Inside a contract body, `This` refers to the eventual
implementing type, NOT the contract's own nominal type — contract-signature
seeding (`contracts.rs:102-111`) SHALL store a `This` marker, not
`TypeInfo::Named(contract_item)`. At an impl site, the compiler substitutes
`This` with the receiver type in `substitute_type_id` (`helpers.rs:243`) and
the lowering-prep mirror (`lowering_prep/substitution.rs:9`). At a monomorphized
bound site, the specialization substitution rewrites `This` together with the
bounded generic (Gap 3 prerequisite, deferred).

The receiver value local remains `this` (`items_statements.rs:38,57,134`) — a
regular identifier, not a keyword. `self` is NOT introduced as a keyword,
receiver name, or parameter name; `this` remains the sole receiver value. The
existing forbid-check on the parameter name `self`
(`method_definition.rs:99-101`) is retained so `self` cannot re-enter the
language.

### Associated types are a new `ContractItem` variant

`ContractAssociatedType = { "type" ~ Identifier ~ ("=" ~ BeskidType)? ~ ";" }`
SHALL be a new `ContractItem` variant (`ContractNode::AssociatedType`). An
associated-type reference `T::Item` (double-colon, paralleling `EnumPath` and
`Option::Some`) SHALL resolve via a new
`associated_type_bindings: HashMap<(ItemId, String), TypeId>` table populated
when a type declares `: Contract`. The compiler-sdk mirror
`ContractNode.bd` is auto-generated by `beskid_ast_reflect_gen` and propagates
without hand-edit.

### Conformance equality uses `FunctionSignature`

The arity-only `method_signature_string` at `contracts.rs:167-170` SHALL be
replaced with `FunctionSignature` (`TypeId`-based, `types/result.rs:227-232`)
equality, after `This`/associated-type substitution. This is the same fix for
Gap 2 #4 and Gap 4 #8.

### Generation-bound conformance fact in the SOT (option ii)

The `beskid_queries` semantic-contract SOT SHALL mint a generation-bound
conformance query directly from syntax (`type X : C` and `impl X : C` → fact),
not expose the legacy `type_conformances` table via a tracked fact. This keeps
the SOT self-sufficient and is reused by `impl` conformance, generic bounds,
and `This` substitution.

## Cross-gap dependencies

- Gap 2 #4 (conformance equality) is the same fix as Gap 4 #8.
- Gap 4 §5 (bounded-generic `This` substitution) presupposes Gap 3.
- Gap 1 generic-contract arity validation reuses the same mechanism as Gap 2
  `GenericArgumentMismatch`.
- The SOT conformance fact is minted once (Gap 3) and reused by Gaps 2 and 4.

## Implementation order

1. **Gap 2** (`impl` conformance) — largest surface, smallest grammar change,
   reuses most existing machinery. `FunctionSignature` equality is
   prerequisite for Gap 4.
2. **Gap 1** (generic contracts) — small grammar delta, unblocks
   `Iterator<T>` and `Rewriter<TSourceNode,TTargetNode>`.
3. **Gap 4** (`This` / associated types) — direct-impl `This` substitution
   (bulk of demand) does not depend on Gap 3. Associated types ride on Gap 1.
4. **Gap 3** (generic bounds) — mints shared SOT conformance fact; enables
   bounded-generic `This` (Gap 4 §5) and generic combinators.

## Observability

- Conformance failures surface as existing diagnostics E1601/E1602/E1606/E1607
  and a new `GenericBoundNotSatisfied` variant in `SemanticIssueKind`.
- `This`-out-of-context and invalid associated-type references surface as new
  diagnostics.
- The `Diagnostics.bd` compiler-sdk mirror is regenerated from the Rust enum.

## Security

No new attack surface. Bound checks are compile-time admission gates; no
runtime trust boundary changes.

## Source-of-truth boundaries

- OpenSpec owns normative contract behavior.
- `beskid.pest` owns grammar; AST nodes own structure.
- The typechecker owns conformance validation.
- `beskid_queries` owns the generation-bound conformance fact and bound
  admission.
- ISLE and codegen own monomorphization; they see only conforming concrete
  types.
