# v0.5 Contract System — Transfer Plan

> **For agentic workers:** Planning artifact only — no build/test commands run
> to produce this plan. REQUIRED SUB-SKILL: `superpowers:test-driven-development`
> per slice; each slice starts with a focused failing test. Do not merge or
> cherry-pick from `archive/contract-system-four-gaps` — that tag is an idea
> source only (it conflicts with `main` in 11 files). Reimplement against
> current `main`.

**Goal:** Land the four contract-system gaps (generic contracts, `impl`-block
conformance, `where`-bound checking, `This`/associated types) from
`openspec/changes/extend-contract-system-generic-and-self/` as small,
independently testable, ordered slices against current `main`.

**Source of truth:** `openspec/changes/extend-contract-system-generic-and-self/{proposal.md,design.md,tasks.md}`
(tasks 1.3+ unchecked). This plan sequences those tasks; it does not restate
their normative content.

**Release-program placement:** independent lane, not gated by CYB-60/61/62.
See `docs/superpowers/plans/2026-09-19-beskid-v0-5-closure-rebaseline.md` §
"Independent contract-system lane."

## Coordination — busy paths

Before claiming a slice, check
`~/.claude/handoffs/networking-coordination.md`. As of 2026-09-22:
`crates/beskid_queries/src/semantic_contract/**` is owned by the `f6-release`
/ `binding` slices (generic Result provenance, nominal-binding field calls).
`crates/beskid_isle/src/context/{calls,control_flow,enums,aggregate}.rs` is
also live F/N/H territory. Slices 4-6 below touch
`beskid_queries/semantic_contract`; claim a narrow sub-path (the specific
file, not the whole directory) and coordinate before editing, or serialize
behind the current F/N/H worker on that file.

## Slice order and rationale

Parsing/AST before semantics before specialization/codegen, per the design's
own "Implementation order" (Gap 2 -> Gap 1 -> Gap 4 -> Gap 3). Each slice is
independently testable and revertible.

### Slice 1 — Grammar + AST: `impl`-block conformance (Gap 2, tasks 2.2)

- **Files:** `compiler/crates/beskid_analysis/src/beskid.pest` (`ImplBlock`
  rule, currently line 202); `crates/beskid_analysis/src/syntax/items/impl_block.rs`;
  `crates/beskid_analysis/src/syntax/items/node.rs` (add `Node::ImplBlock`
  variant); `crates/beskid_analysis/src/syntax/items/doc_attached_items.rs:35-50`
  (stop flattening `ImplBlock` into `Node::Method`).
- **Failing test first:** parser snapshot for `impl T : Contract { ... }`
  producing a first-class `Node::ImplBlock` with a non-empty conformance list
  (today it silently flattens to bare `Node::Method` items and the
  conformance clause is lost — confirm with a snapshot diff before touching
  code).
- **Done when:** `impl T : Contract { ... }` parses as `Node::ImplBlock`,
  `impl T { ... }` (no conformance) still parses unchanged, and every
  existing caller that pattern-matched on the old flattened `Node::Method`
  shape from an `impl` block is updated or proven unaffected.
- **Busy-path risk:** none — `syntax/items/**` is not on the F/N/H list.

### Slice 2 — Resolver: `impl`-block conformance edges (Gap 2, task 3.2)

- **Files:** `crates/beskid_analysis/src/resolve/resolve_refs/items_statements.rs`
  (new `Node::ImplBlock` arm, paralleling the existing `Node::TypeDefinition`
  arm and the existing `Node::ContractDefinition` arm at line 195).
- **Failing test first:** resolution test asserting `impl T : Contract { }`
  populates `resolution.tables.type_conformances` the same way
  `type T : Contract { }` does today.
- **Done when:** `stage6_contracts_and_methods`
  (`analysis/rules/staged/contracts.rs:10`) fires E1601/E1602 on an `impl`
  block with a missing or mismatched method, with no new pass — it already
  finds impl methods via `impl_method_signature_for_type` (line 123).
- **Busy-path risk:** none.

### Slice 3 — Conformance equality upgrade (Gap 2 #4 / Gap 4 #8, task 2.6)

- **Files:** `crates/beskid_analysis/src/analysis/rules/staged/contracts.rs`
  (`method_signature_string` at line 167, replace with `FunctionSignature`
  `TypeId`-based equality; `collect_contract_methods_recursive` at line 76;
  `impl_method_signature_for_type` at line 123).
- **Failing test first:** two methods with equal arity but different return
  types must be flagged mismatched (today `method_signature_string` only
  encodes `ret(N)` arity, so this passes incorrectly — write the red test
  against the *current* arity-only comparator first).
- **Done when:** return-type mismatches are flagged; existing arity-mismatch
  tests still pass.
- **Prerequisite for:** Slice 7 (`This` substitution needs signature equality
  to see through `This`).

### Slice 4 — Generic contracts grammar + AST (Gap 1, task 2.1)

- **Files:** `beskid.pest` (`ContractDefinition` rule, currently line 237 —
  add `GenericParameters?` between `Identifier` and `{`, reusing the rule at
  line 184, paralleling `EnumDefinition` at line 232);
  `crates/beskid_analysis/src/syntax/items/contract_definition.rs` (add
  `generics` field — confirmed absent today); `ContractEmbedding` AST (add
  `type_args`).
- **Failing test first:** parse `contract Iterator<T> { Option<T> Current(); }`
  and assert `generics == ["T"]` on the resulting `ContractDefinition`.
- **Done when:** generic and non-generic contracts both parse; `T` is visible
  in signature position only within the grammar/AST layer (typing lands in
  Slice 5).

### Slice 5 — Generic contracts typechecking (Gap 1, task 3.1)

- **Files:** `crates/beskid_analysis/src/types/checker/items.rs` (replace the
  no-op `Node::ContractDefinition(_) => {}` arm, currently line 278, with the
  push-into-`generic_params` / type-signatures / pop pattern used for
  `EnumDefinition`); add the `Node::ContractDefinition` arm to
  `seed_generics_from_items`.
- **Failing test first:** `contract Iterator<T> { Option<T> Current(); }`
  resolves `T` inside the method signature to the contract's own generic
  parameter, not an unresolved/global type.
- **Done when:** arity mismatches at the conformance site
  (`Iterator<i32, i32>` embedding a 1-param contract) are rejected.

### Slice 6 — SOT conformance fact reuse (Gap 3 prerequisite, task 2.5)

- **Files:** `crates/beskid_queries/src/semantic_contract/contracts.rs`
  (extend the existing conformance-witness resolution — this file already
  resolves `type X : Contract` against `TypeDefinition`/`GenericSpecializationInstance`,
  per the design-note added 2026-09-22; it is the correct extension point,
  not a new module). Add `impl X : Contract` as a second syntax source feeding
  the same fact.
- **Failing test first:** a query test asserting the same conformance fact
  results whether conformance was declared via `type X : Contract { }` or
  `impl X : Contract { }`.
- **Done when:** one fact serves both syntaxes; no duplicate table.
- **Busy-path risk:** HIGH — this file/directory is actively edited by the
  `f6-release`/`binding` slice per the coordination board. Claim only this
  specific file, post to the board before editing, and expect merge
  friction; consider scheduling this slice after the live F6 generic-Result
  work lands, rather than in parallel.

### Slice 7 — `This` type (Gap 4, tasks 2.4, 3.4, 3.5)

- **Files:** `beskid.pest` (add `ThisType` token + `Keyword` entry);
  `crates/beskid_analysis/src/syntax/**` (`Type::This` variant); typechecker
  `TypeInfo::This_`; substitution sites: `types/checker/helpers.rs:243`
  (`substitute_type_id`), `types/checker/types.rs:217`
  (`type_id_for_type_path`), `types/lowering_prep/substitution.rs:9`
  (mirror `substitute_type_id`), `crates/beskid_queries/src/semantic_contract/abi/specialization.rs`
  (`generic_abi_type`, currently line 825); contract-signature seeding in
  `analysis/rules/staged/contracts.rs` stores a `This` marker instead of
  `TypeInfo::Named(contract_item)`.
- **Failing test first:** a contract method `This Method();` implemented by
  `impl Foo : C { Foo Method() { ... } }` type-checks; implementing it with
  the wrong concrete return type is rejected via the Slice-3 equality
  upgrade.
- **Done when:** `This` resolves correctly at direct-impl sites; bounded
  generic `This` (deferred, needs Slice 8) is explicitly out of scope for
  this slice.
- **Busy-path risk:** `abi/specialization.rs` overlaps the busy
  `semantic_contract/**` directory — same caution as Slice 6.

### Slice 8 — Generic bounds (`where T: Contract`) (Gap 3, tasks 2.3, 2.7, 3.3, 3.6)

- **Files:** `beskid.pest` (`WhereClause`, `TypeBound`, reserved `where`
  keyword); `GenericParameter { name, bounds }` AST struct replacing
  `Vec<Spanned<Identifier>>` on `FunctionDefinition`/`TypeDefinition`/`EnumDefinition`;
  `crates/beskid_queries/src/semantic_contract/abi/specialization.rs`
  (`generic_specialization_instance_for_call`, currently line 89 — add the
  bound check after `substitutions` is populated, before returning `Ok`);
  `SemanticIssueKind::GenericBoundNotSatisfied` plus the compiler-sdk
  `Diagnostics.bd` mirror; `crates/beskid_queries/src/semantic_contract/calls/resolution.rs`
  (`method_declaration_for_member_receiver`, currently line 242).
- **Failing test first:** `where T: Contract` rejects a call with a
  non-conforming inferred type, at `generic_specialization_instance_for_call`
  — before monomorphization, so ISLE never sees the rejected call.
- **Done when:** non-conformance is `Err(SemanticError)` (fail closed); ISLE
  fixtures (`cargo test -p beskid_isle`) are unaffected, confirming the
  design's claim that ISLE only sees already-concrete specialized calls.
- **Busy-path risk:** HIGH, same file as Slice 6/7. This is also the slice
  most likely to actually collide with in-flight F6 generic-specialization
  work (`generic_specialization_instance_for_call` is exactly the function
  the coordination board's `binding`/`binding2` slices are fixing bugs in
  right now) — schedule last and re-read the coordination board immediately
  before starting.

### Slice 9 — Associated types (Gap 4, remainder)

- **Files:** `ContractAssociatedType` grammar rule and `ContractNode::AssociatedType`
  variant; `associated_type_bindings: HashMap<(ItemId, String), TypeId>` table
  populated at `: Contract` declaration; `T::Item` path resolution.
- **Failing test first:** `contract Iterator<T> { type Item; Option<Item> Current(); }`
  resolves `Item` per-implementor; an unresolved `T::Item` reference outside
  a conforming context is rejected.
- **Done when:** `This` out-of-context and unresolved associated-type
  references both produce diagnostics (design task 1.7).

### Slice 10 — Corelib migration (tasks 4.1-4.4)

- **Files:** `corelib/.../Query/Iterator.bd` (replace the empty marker with
  `contract Iterator<T> { type Item; Option<Item> Current(); This MoveNext(); }`);
  `corelib/.../compiler-sdk/.../Collect.bd:114-116` (migrate `Rewriter`'s
  bare `TSourceNode`/`TTargetNode` to declared type parameters/associated
  types); `console/Ansi/Contracts.bd` fluent contracts to `This` returns;
  regenerate fixtures via `regen_mod_sdk_surfaces.sh`.
- **Done when:** `just corelib` (not run by this plan — verification only,
  no build in this planning pass) is green per task 5.3.
- **Depends on:** Slices 4, 7, 9 (generic contracts, `This`, associated
  types) all landing first.

### Slice 11 (follow-on, unblocked by Slice 10) — Fluent `Iterator<T>` combinators

- **Files:** `corelib/.../Query/Operators.bd` generic combinators; the seven
  0.4-stub glue contract `impl` blocks; `Rewriter<TSourceNode,TTargetNode>`
  rewrites. Becomes possible only once Slices 1-10 land — this is explicitly
  a corelib-only follow-up, not a language-surface change, matching the
  design's "Follow-on" note.

## Concepts vs. existing v0.5 decisions

No hard conflict found. Two things to flag:

1. `where` and `This` both become reserved keywords (Slices 7-8). No
   existing v0.5 Foundations/Networking/HTTP requirement uses either as an
   identifier (not grepped exhaustively in this pass — re-check corelib
   identifiers named `where`/`This` before Slice 7/8 land).
2. Slices 6-8 share files with live F6/binding work in
   `crates/beskid_queries/src/semantic_contract/**` and
   `abi/specialization.rs`. This is a scheduling risk, not a design
   conflict — sequence those slices after the coordination board shows the
   generic-specialization bugfix work quiescent, to avoid two independent
   agents editing `generic_specialization_instance_for_call` concurrently.

## Verification (not run in this planning pass)

Per `tasks.md` §5: `cargo test -p beskid_analysis`, `cargo test -p
beskid_queries`, `just corelib`, `pnpm run openspec:validate`, `cargo test -p
beskid_isle`. None of these were run to produce this plan.
