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

## Status (2026-09-24): merged

All slices, including 9-11 and the follow-up gap fixes, are merged into
compiler `main` at `b1b9307f` (contracts merge; branch head `20c44e68`)
and corelib `main` at `3f2ab81`. Closed since the notes below: cross-unit
contract signatures and associated types, E1201 on unresolved contract
signatures, `this` as a value and receiver field chains, impl-block method
calls, and `This` in implementing signatures. Corelib uses `This`/`this` in
`StyleChain` and `ArrayIterator`. Verified on the merged tree: workspace
tests green apart from known environment-only targets, runtime semantics
7/7 targets, corelib tests 80/80 targets.

Still open: receiver field chains and impl owners in generic types, `This`
in contract signatures used through generic specialization, and impl
method qualified names that omit the owner type. The notes below are the
historical record.

## Status (2026-09-23)

Slices 1-8 landed on `codex/v05-contracts` in
`.worktrees/compiler-v05-contracts` (compiler submodule, branch cut from
`origin/main` `1bc4ec21`; not yet merged to the compiler's own `main` as of
this update). Commits, in order: `90e3877c` (1), `506af03a` (2), `aa278fd9`
(3), `f27b43f7` (4), `c2635bfe` (5), `6fe22fd7` (pipeline reorder, inserted
between 5 and 6 -- see "Slice 5a" below), `fd9f9ee1` (6), `580b43af` (7),
`eef88b5a` (8). All verified green: `cargo test -p beskid_analysis`
322/322, `-p beskid_queries` 227/227, `-p beskid_tests_surface` 266/266,
`-p beskid_isle` all green; `cargo check --workspace --all-targets` clean
except one pre-existing, unrelated `beskid_cli` bug. Full per-slice
red/green evidence and deviation rationale is in each commit message.
Slice 9 (associated types) landed, commit `eacd54e6`, fully verified:
`cargo test -p beskid_analysis` 331/331, `-p beskid_queries` 227/227, `-p
beskid_tests_surface` 266/266, `-p beskid_isle` all green.

Slice 10 (corelib migration -- `Query.Iterator`, `Collect.Rewriter`,
`console/Ansi/Contracts.bd`'s six fluent step contracts) landed on
corelib branch `codex/v05-contracts-slice10`, corelib commit `1a75f58`
(the compiler-repo submodule pointer to this commit is **not yet
committed** on `codex/v05-contracts` -- see slice 11 below, it depends on
slice-11 corelib work that is itself unverified). Verified via `beskid_cli
analyze` on the three touched packages (foundation, compiler-sdk,
console); full detail and the two pre-existing, unrelated parse/resolution
gaps it surfaced (an `Args.bd`/`ArgsError.bd` duplicated-path-segment bug,
a semicolon-only `Query.bd` function declaration) are in the commit
message.

Slice 11 (`Iterator<T>` + fluent `This`-returning contracts, corelib
tests through the real CLI) is **mid-way, interrupted by the remote
builder (10.66.0.2) going offline** (stale WireGuard handshake) partway
through rebuilding `beskid_cli` to pick up the fixes below. Status as of
this update:

- **Done and fully verified** (commit `ea6a6620` on `codex/v05-contracts`,
  compiler repo): four compiler bugs found and fixed while wiring
  `ArrayIterator<T> : Iterator<T>` (the first real generic-contract,
  generic-implementor, applied-associated-type, and multi-method `This`-
  returning conformance in this codebase) --
  1. generic-implementor `This` substitution (was the bare unparameterized
     name, now the implementor applied to its own generics),
  2. the resolver never walked a conformance list's own generic type
     arguments (`Iterator<T>`'s `T`),
  3. `check_contract_conformances` never pushed the implementor's own
     generics into scope before resolving conformance type arguments or
     associated-type binding syntax,
  4. a **general, contract-system-independent** bug: every method beyond
     the first in any `type X { }` / `impl X { }` / `extend type X { }`
     body shared one `receiver_type` span, so `this` (explicit or an
     implicit bare-field access) failed to type-check in the second and
     later methods of any multi-method body.
  Each has isolated red/green evidence plus a clean full-suite rerun
  (`beskid_analysis` 334/334, `beskid_queries` 227/227,
  `beskid_tests_surface` 266/266, `beskid_isle` all green) in the commit
  message.
- **Drafted but NOT verified** (uncommitted, corelib working tree --
  branch `codex/v05-contracts-slice10`, on top of `1a75f58`; drafted in
  two passes, both while the builder was offline -- the second pass added
  the remaining five step-contract conformances at the coordinator's
  explicit request to draft the full surface before the build/fix pass):

  Real conformances:
  - `packages/foundation/src/Query/ArrayIterator.bd` --
    `ArrayIterator<T> : Iterator<T>`, real `Current()`/`MoveNext()`
    methods alongside the pre-existing free functions `Query.Operators`
    still calls.
  - `packages/console/src/Ansi/StyleChain.bd` -- `impl StyleChain :
    AnsiStyleStep`, 14 methods each delegating to the pre-existing free
    function of the same name (unambiguous: the free function always
    takes one more explicit arg than the method, its own receiver).
  - `packages/console/src/Ansi/Cursor.bd`, `Erase.bd`, `Screen.bd`,
    `InputMode.bd` -- `: AnsiCursorStep`/`AnsiEraseStep`/`AnsiScreenStep`/
    `AnsiInputModeStep` added to each type's existing inline-method body
    (the methods already matched each contract's method set 1:1 before
    this change; only the conformance declaration is new). **Unverified
    risk specific to these four:** their inline methods make bare,
    unqualified `Append(...)` calls (implicit-`this` method dispatch)
    that no existing test ever exercised before this draft (the
    pre-existing `AnsiBuildersTests.bd` only calls the free-function
    form, `Ansi.Cursor.Position(...)`) -- this whole call-resolution path
    is unverified independent of the contract-conformance work.
  - `packages/console/src/Ansi/Osc.bd` -- `: AnsiOscStep`, plus a new
    `Hyperlink(string, string)` method (the pre-existing free function of
    that name is stateless, not builder-shaped, so there was no matching
    method to just annotate). Deliberately does **not** delegate to the
    free function by a bare call: the free function and the new method
    share the identical name AND arity (both take two `string`s, unlike
    every other delegating method here, where the free function always
    has one more explicit arg), so an unqualified call would be
    ambiguous between "call the free function" and self-recursion --
    duplicates the free function's logic inline instead, with a comment
    explaining why.

  New corelib tests (method-dot-call syntax, mirroring the free-function
  goldens in the pre-existing `QueryTests.bd`/`AnsiBuildersTests.bd`/
  `AnsiStyleChainTests.bd`):
  `beskid_corelib/tests/corelib_tests/src/query/QueryIteratorConformanceTests.bd`,
  `.../console/AnsiStyleStepConformanceTests.bd`,
  `.../console/AnsiFluentStepConformanceTests.bd`.

  **None of this has been compiled.** The four compiler-side fixes in
  `ea6a6620` were red/green-verified through the Rust test suites, but
  `beskid_cli` was mid-rebuild picking them up when the builder went
  offline, so `beskid_cli analyze`/`test` was never run against this
  corelib state at all (not before, not after the fixes). **Do not
  assume any of it compiles or passes tests -- verify from scratch**
  (rebuild `beskid_cli`, `beskid_cli analyze --project
  corelib/packages/foundation/corelib_foundation.bproj --plain` and
  `.../console/corelib_console.bproj --plain`, then `beskid_cli test` on
  `corelib_tests` with a rebuilt runtime kit if `analyze` is clean)
  before committing any of it. Expect to actually debug and fix issues,
  not just confirm green -- this is an intentionally unverified draft.

- **Deliberately not drafted** (explicitly out of scope for this
  drafting pass, not merely forgotten): `Rewriter<TSourceNode,
  TTargetNode>` rewrites -- no `.bd` file anywhere in corelib implements
  `Rewriter` (confirmed by `grep -rl Rewriter`), so there is no concrete
  rewrite site to migrate yet; `Query.Operators`'s generic combinators --
  migrating `Map`/`Take`/`Skip`/etc. from `ArrayIterator<T>`-specific
  parameters to a real `where TIter: Iterator<T>`-bounded generic
  receiver would be a substantial, blind signature redesign of code 16
  existing `QueryTests.bd` tests already depend on, too risky to draft
  without any way to verify it in this outage; `just corelib` / the full
  test matrix (task 5.3).

**Resume instructions:** once the builder is back, sync the compiler
worktree (now includes commit `ea6a6620`) and the corelib working tree
(uncommitted) to `/workspace/compiler-contracts`, rebuild `beskid_cli`,
then verify the corelib state exactly as described above before
committing it as a slice-11 corelib commit and bumping the compiler
repo's `corelib` submodule pointer.

**Slice 11 build/fix pass (2026-09-23, uncommitted, verified on the builder).**
The drafts above now compile and pass. `cargo test -p beskid_analysis -p
beskid_queries -p beskid_codegen -p beskid_ast_reflect_gen --tests` is green
(isle_adapter 236/236), and 23 corelib targets (all console, query, and
compiler-sdk targets, including the three new conformance targets) pass
through `beskid_cli test`. Fixes and rulings:

- Compiler: the unit type surface (`types/surface/builder.rs`) now seeds a
  contract's generics, `This`, and associated types, so a contract declared
  in another unit keeps its real signatures (they fell back to `unit`). It
  also carries `contract_associated_types` across units and registers
  `impl`-block methods. `check_contract_conformances` checks only the
  conformances written in the unit being checked.
- Generator: `beskid_ast_reflect_gen` escapes a variant named `This` to
  `_This` (the mirror `Type.bd` did not parse after `This` became a
  keyword). `ReflectSdkNodeKind` and the golden inventory list the three new
  syntax node types.
- Corelib: implementors write their concrete receiver type in method
  signatures, as the spec scenario does (`StyleChain Bold()`), because
  `This` in an implementing method signature is not typed or lowered yet.
  `StyleChain` conforms through inline type-body methods (the step-builder
  convention); the `impl` block form does not lower yet.
- Ruling, `OscBuilder.Hyperlink`: a bare call inside a type-body method
  binds to the sibling method of that name first
  (`unqualified_enclosing_method_call`), so delegating would recurse. The
  method keeps its own body, like every other method and free-function pair
  in the step builders. A test asserts that both forms return the same bytes.
- `Query.Operators` migration: not started. The combinators still take
  `ArrayIterator<T>` directly and `QueryTests` (18/18) passes against them.

Three deviations from this plan's original slice descriptions, each
recorded in detail in its commit message: slice 3's comparator started
structural (syntax-shape) rather than `TypeId`-based, corrected by the
pipeline-reorder task; slice 7 represents `This` as a synthetic
`TypeInfo::GenericParam("This")` rather than adding a new `TypeInfo::This_`
variant; slice 8 adds an additive `where_bounds` field to
`FunctionDefinition` rather than the `GenericParameter` struct replacing
`Vec<Spanned<Identifier>>` everywhere generics are declared (bounds are
implemented for standalone generic functions only).

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

### Slice 5a — Semantic-pipeline reorder (added 2026-09-23, owner ruling)

Not in the original plan; inserted here after slice 3's structural
(declared-syntax-shape) comparator was found to be a necessary stopgap,
not a full implementation of task 2.6's `FunctionSignature` (`TypeId`-
based) equality: `stage6_contracts_and_methods` ran inside the
`run_rules`/`RuleContext` diagnostics pipeline, which never runs full type
checking (`stage2_type_check` there is structural-immutability-only --
"full type-check runs in the lower spine" per its own doc comment). Owner
ruling: move contract conformance checking into the real `TypeChecker`
itself, replacing the structural stopgap with real `TypeId` equality,
before `This` (slice 7) so slice 7's `This` substitution can rely on real
type identity from the start.

- **Files:** `crates/beskid_analysis/src/analysis/rules/staged.rs` and
  `staged/contracts.rs` (deleted -- the stopgap and its call site);
  `crates/beskid_analysis/src/types/checker/contracts.rs` (new
  `check_contract_conformances`, called from `check_entry` after the main
  per-item typing loop; fix to `seed_contract_signatures` to push a
  contract's own generics into scope); `crates/beskid_analysis/src/types/
  result.rs` (two new `TypeError` variants); `crates/beskid_analysis/src/
  analysis/rules/types.rs` (`emit_type_error` arms mapping them to the same
  E1601/E1602 `SemanticIssueKind`s the deleted stopgap used).
- **Root cause found while wiring this, unrelated to the reorder itself:**
  `resolve/member_items.rs`'s `Node::TypeDefinition` branch
  double-registered every inline method as a second, receiver-less,
  symbol-less `ItemId` alongside `resolve/collect.rs`'s already-correct
  dedicated registration -- silently dropping the duplicate's
  `FunctionSignature` and making `item_id_for_name` pick the wrong
  candidate. Fixed by removing the duplicate registration.
- **Done when:** `stage6`'s old test coverage (E1601/E1602, now via
  `resolve_and_type_program` instead of `analyze()`, since that is the
  only driver that can observe a `TypeError`) passes against real `TypeId`
  equality; slices 1-5's own test suites stay green.

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
