## Context

The rule inventory of 2026-10-14 (`docs/research/2026-10-14-resolver-generation.md`, Part 1;
full table in the spike scratchpad `resolver-spike/rules.md`) lists 136 name-binding rules with
`file:line` citations for both Rust implementations. This document rules on the 77 rules that
are not settled:

| Class | Count | Rules |
|---|---|---|
| Both implement, visibly different (`DIV`) | 35 | A1, B10, B12, C1, C3, C4, C6, C7, C9, C12, D4, D5, E5, E6, E10, E15, F1, F3, F4, F5, F8, G3, G14, H4, H6, H8, I2, I3, I4, I6, K1, K6, K8, M1, N2 |
| Legacy resolver only (`L`) | 10 | A7, A8, A11, B11, C8, C10, C13, F9, G11, I7 |
| Query layer only (`Q`) | 20 | C14, D6, E3, E8, E12, E13, E16, F6, F7, H7, I5, I9, I10, I11, J2, K4, K5, L2, L3, M3 |
| Legacy rule stage only (`R`) | 7 | A3, A6, B6, C11, F10, G12, J4 |
| Specified, not implemented (`S`) | 5 | D7, J1, J5, L5, M4 |
| **Total** | **77** | 37 single-implementation rules = 10 L + 20 Q + 7 R |

The 59 rules on which both implementations agree are not restated here. A resolver written in
Beskid implements them as the inventory describes them.

### Evidence legend

Line numbers are from the working tree `~/.codex/worktrees/v06-release/beskid` on 2026-10-14.
The compiler tree is dirty in `projects/assembly/module_index/resolution.rs` and related files
(`resolver-redesign`, note on the worktree); citations into those files can move. All paths are
under `compiler/crates/`:

- `L/` = `beskid_analysis/src/resolve/` (legacy resolver); `L/rr/` = `L/resolve_refs/`
- `LR/` = `beskid_analysis/src/analysis/rules/staged/` (legacy rule stages)
- `LA/` = other `beskid_analysis/src/` paths; `LA/mi/` = `projects/assembly/module_index/`
- `Q/` = `beskid_queries/src/semantic_contract/`; `QS/` = `beskid_queries/src/`

Spec abbreviations (`openspec/specs/<capability>/spec.md`): NR name-resolution, MV
modules-and-visibility, RC resolver-contract, CT contracts, EM enums-and-match, MD
method-dispatch, ET extend-type, TY types, API corelib-api-shape, CI corelib-injection, DI
dependency-injection.

### How "changes behavior for users" is judged

`beskid check` today runs both resolvers. Stage 1 of the legacy rule pipeline reports every
legacy `ResolveError` and resolver warning (`LR/name_resolution.rs:13-60`). The query gate
reports its own findings. Codegen reads only query facts. The language server (navigation,
completion, find references) and `beskid doc` read the legacy `Resolution`
(`resolver-redesign`, Part 1.4). So:

- A program compiles today only if neither resolver rejects it.
- The compiled meaning of a program is the query binding.
- Editor navigation and `api.json` follow the legacy binding.

Under a ruling, the user-visible column says one of: **no** (no program changes status or
meaning); **newly accepted** (a program rejected today compiles); **newly rejected** (a program
that compiles today fails); **meaning** (the compiled binding changes); **diagnostic** (only the
code, count or wording of a diagnostic changes); **tooling** (only editor navigation,
completion or `api.json` change). The "code to change" column names the implementation that
must change to conform: **Q** (query layer), **L** (legacy resolver or rule stage, normally by
retirement), **Q+L**, or **none**.

## Goals / Non-Goals

**Goals:**

- One normative answer for each of the 77 rules, so that the Beskid resolver has one target.
- Default to the query layer's behavior, because it is the semantic authority, unless it
  contradicts a spec requirement, an owner decision or an open v0.6 change.
- Show the blast radius of every ruling.

**Non-Goals:**

- No compiler code changes in this change set. Implementation is a separate task list
  (`tasks.md`, sections 2 and 3).
- No grammar changes. Where a ruling would want one (for example `pub const`), it is flagged.
- No restatement of the 59 agreed rules.

## Cross-cutting decisions

1. **One binding authority.** The generation-bound query facts are the only name-binding
   authority. The language server, `beskid doc` and every rule stage read them. This follows
   the v0.6 decision that the query layer is the semantic authority (`v06-query-front-end`,
   Why) and NR "Single resolver snapshot". The legacy `Resolver` is retired, not aligned.
2. **The source unit is the scope and privacy unit.** Imports bind per source unit (Kotlin
   imports are file-scoped; C# `using` directives are compilation-unit-scoped). Privacy is per
   source unit, which extends the coordinator's 2026-10-07 field ruling (`v06-field-visibility`)
   to all items and members. Because a logical module path has exactly one source unit
   (decision 3), "private to its module" and "private to its source unit" differ only for
   inline modules (flagged, F1).
3. **One source unit per logical module path.** `v06-qualified-dependency-paths` already makes
   a path that two packages provide **E1104**. This change applies the same rule inside one
   package. No scope merging.
4. **Fail closed on ambiguity.** Two candidates for one name at one precedence level are
   **E1104** at the reference. No first-wins, no order dependence, no `Dynamic` fallback.
5. **Retire heuristics that guess.** Path heuristics that bind without proving the shape (legacy
   `lookup.rs` fallbacks, the query `Dynamic` fallback, the any-nesting type fallback, the
   macro "unique function" fallback) are replaced by stated rules.
6. **Spec over both implementations** where the spec has a clear requirement: `self` (CT:202),
   generic shadowing (NR:27), `extend type` members (MD:10), `extend type` privacy (ET:18),
   `use` of the final segment (NR:11).

## Decision table

Requirement keys: NR-use, NR-vis, NR-snap are the modified NR requirements "Use declaration
resolution and diagnostics", "Visibility, duplicates, and shadowing" and "Single resolver
snapshot and stable qualified names". Other keys name requirements this change adds or modifies
in the capability named; "existing" means the current spec text already states the ruling.

| Rule | Legacy | Query | Ruling | Changes behavior for users? | Code to change | Evidence | Requirement |
|---|---|---|---|---|---|---|---|
| A1 | One scope map per module for all kinds | Per-kind lookup | One namespace for uniqueness; lookup filtered by position (type or value) | Rarely newly accepted (legacy E1201 corner) | L | L/collect.rs:248-370, :355; Q/resolution.rs:650-681; Q/layouts/common.rs:425-458; Q/contracts.rs:420-460 | NR Module item namespace |
| A3 | Rule stage E1001/E1006 beside resolver E1102 | E1102 only | One duplicate diagnostic, E1102 | Diagnostic | L | LR/definitions.rs:29-68, 495-512; Q/legality/units.rs:212-240 | NR Module item namespace; TY Static type rules |
| A6 | Rule stage E1002 variant, E1003 contract method | None | Keep E1002 and E1003 | No | Q (add) | LR/definitions.rs:514-538 | existing EM:10, CT:8 |
| A7 | `SymbolQualifier` registry, `DuplicateSymbol` | `AstNodeKey` identity only | Package-prefixed qualified name derived from binding facts; duplicates impossible by E1102/E1104 | Tooling (none if names match) | Q (add) | L/collect.rs:83-115; L/symbol.rs:160-190 | RC D-COMP-SEM-0016 |
| A8 | Member shapes `Receiver::Name`, `Parent::child`, `Test::statement#N`, builtins in `beskid` | None | Keep the shapes as qualified-name grammar | No | Q (add) | L/collect.rs:16-37, 268-314; L/member_items.rs:20-131 | RC D-COMP-SEM-0016 |
| A11 | `qualifiedName` / `@ref` lookup | None | Keep; lookup over query facts | No | Q (add) | L/symbol_lookup.rs | RC D-COMP-SEM-0016; NR-snap |
| B6 | Rule stage E1505/E1506/E1507 | None | Keep | No | Q (add) | LR/definitions.rs:73-110, 160-185 | existing MV "Module forms and identity" |
| B10 | Units of one module path merge into one scope | Qualified path E1104; cross-unit E1102 | One source unit per module path, plus at most one generated companion `X.g.bd` sharing it (owner, Dart `part`); any other second unit E1104 | Newly rejected (same-package duplicate path) | Q+L | L/collect.rs:132; Q/resolution.rs:234-238; Q/legality/units.rs:639-646 | NR One source unit per logical module path |
| B11 | Entry unit also bound at root | Mirrors collision exemption | Retire; entry unit is an ordinary unit of its module | Tooling | Q+L | L/rr/entrypoints.rs:19-59; Q/legality/units.rs:621-625 | NR One source unit per logical module path |
| B12 | Every known path incl. empty intermediates is a module | Only registered exact paths | Query: a module exists only if a source unit provides it | Tooling | L | LA/mi/resolution.rs:109-111; QS/db.rs:56-62 | NR One source unit per logical module path |
| C1 | `use A.B;` binds alias to module | Binds only if one unit is that module | Binds last segment to the module (or item, C3); one unit by B10 | No | none | L/collect.rs:434-453; QS/typed_program.rs:213-232, 252-266 | NR-use |
| C3 | `use` of an item rejected (E1108) | Legality accepts, no binding | Spec: `use M.Item;` binds `Item`; a module wins a tie | Newly accepted | Q+L | L/collect.rs:445-448; Q/legality/imports.rs:10-13, 72-96 | NR-use |
| C4 | `use M;` copies public items into importing module scope | Unit's own import targets | Query: per unit | Tooling | L | L/collect.rs:468-494; Q/resolution.rs:595-648; Q/layouts/common.rs:326-344 | NR Unit-scoped imports; RC D-COMP-SEM-0007 |
| C6 | Two imported items, one name: first wins | Fails closed | Query; report E1104 at the reference | Diagnostic (E1101 becomes E1104) | Q | L/collect.rs:499-506; Q/resolution.rs:631-647; Q/layouts/common.rs:340-344 | NR Unit-scoped imports |
| C7 | Unknown import path E1108 | E1105 | E1105 (spec, query) | Diagnostic (legacy E1108 removed) | L | L/collect.rs:445-448; Q/legality/imports.rs:31-70 | NR-use |
| C8 | Two `use`s bind one name: E1102 + rule E1006 | None | E1102 once | Diagnostic | Q (add) | L/collect.rs:437-443; LR/definitions.rs:58-68 | NR-use |
| C9 | Imports bound in unit order | Order-free | Query | Tooling | L | L/collect.rs:149-175 | NR Unit-scoped imports |
| C10 | Unused import W1503 with credit rules | None | Keep W1503 and its credit rules | No | Q (add) | L/collect.rs:457-461, 633-674; LR/visibility.rs:106-119 | NR Import usage diagnostics |
| C11 | Missing-import suggestion | None | Keep as help text (MAY) | No | Q (add) | LR/missing_imports.rs:10-60 | NR Import usage diagnostics |
| C12 | Private `use` leaks to module scope | Unit-only | Query | Tooling | L | QS/db.rs:113-115; Q/resolution.rs:173-175 | NR Unit-scoped imports |
| C13 | Implicit `Core` alias | Subsumed by absolute lookup | Retire; absolute lookup covers it | No | L | L/collect.rs:195-204 | NR Unit-scoped imports |
| C14 | (merged instead) | Import edge to multi-unit module dropped | Superseded by B10: E1104 | Diagnostic | Q | QS/typed_program.rs:254-260; Q/resolution.rs:210-214 | NR One source unit per logical module path |
| D4 | `pub` on `use` ignored | `pub use` is a re-export edge | Query | Tooling | L | L/collect.rs:434; QS/typed_program.rs:229; Q/resolution.rs:372-388, 518-531 | MV Pub use re-exports |
| D5 | E1501 by same-unit heuristic | Item `use` not bound | E1501 when `pub use` names a non-`pub` item or private module | Newly rejected (rare) | Q+L | LR/visibility.rs:80-104 | MV Pub use re-exports |
| D6 | Not enforced | Private child module reachable only inside parent subtree | Query | Tooling | L | Q/resolution.rs:241-278 | MV Private child modules |
| D7 | None | None | Remove the prelude requirement (superseded by D-TOOL-MAN-0006) | No | none | API:169-180, API:414 | API REMOVED |
| E3 | Item root still tried as module | Lexical root shadows absolute lookup | Query (already in `v06-qualified-dependency-paths`) | Tooling | L | Q/resolution.rs:183-186, 215-221, 280-326 | v06-qualified-dependency-paths |
| E5 | `Alias.Type.Member`: member looked up in alias module | Also requires `Type` to be a `pub` type there | Query, as the type-qualified function rule | Tooling | L | L/rr/lookup.rs:56-64; Q/resolution.rs:419-436 | NR Qualified path forms |
| E6 | `A.B.T.T.M` skips homonymous type segment | Same function as E5 | Retire the skip; path must follow module, then type | Tooling | L | L/rr/lookup.rs:66-73; Q/resolution.rs:419-436 | NR Qualified path forms |
| E8 | None | `Type.Function` in the declaring unit | Keep | Tooling | L | Q/resolution.rs:395-417 | NR Qualified path forms |
| E10 | Any in-scope contract as namespace | Only `[Extern]` contracts of the unit | Only `[Extern]` contracts, wherever accessible | Newly accepted (imported extern contracts) | Q+L | L/rr/types_paths.rs:100-107; Q/calls/resolution.rs:288-349 | CT Contracts as static call namespaces |
| E12 | None | Unresolved qualified call on import binding lowers `Dynamic` | Retire; E1101 or E1108 | Newly rejected | Q | Q/calls/generics/callables.rs:147-175; Q/calls/resolution.rs:206 | NR Qualified path forms |
| E13 | Target only | Member call with module target becomes qualified path | Keep | No | L | Q/calls/resolution.rs:562-583 | NR Qualified path forms |
| E15 | Binds the item | E1201 | Non-generic function read as value is a function value; other items E1201 | Newly accepted | Q | L/rr/types_paths.rs:92-99; Q/legality/value_paths.rs:24-27 | NR Qualified path forms |
| E16 | (merged) | Ambiguous module path E1104 | Keep; extended by B10 | No | L | Q/resolution.rs:147-156 | NR One source unit per logical module path |
| F1 | Per module, root module exempt | Per unit | Per source unit, no exemption | Tooling | L | L/rr/lookup.rs:97-104; Q/resolution.rs:533-560; Q/legality/value_paths.rs:307-338 | MV Source unit privacy boundary |
| F3 | Scope chain reaches parent modules and sibling units | Unit-local | Query | Tooling | L | L/rr/lookup.rs:19-29 | NR Unqualified value name order |
| F4 | Fields carry visibility; only E1511 | Unit-private with attested admissions | Query (decided by `v06-field-visibility`) | No | L | L/member_items.rs:43-50; Q/layouts/field_access.rs:749-786; Q/legality/members.rs:195-235 | v06-field-visibility |
| F5 | Rule stage E1511 for every extend body | Only cross-unit via F4 | Spec: E1511 in every `extend type` body, same unit too | No (legacy stage reports it today) | Q | LR/visibility.rs:121-200 | ET Public-only access and visibility |
| F6 | None | `impl T : C` only in the unit of `T` | Keep | No | L | Q/calls/resolution.rs:695-731 | existing CT "Conformance satisfaction" |
| F7 | None | Private method callable only from its unit; gap on local-rooted path | Keep; close the gap | Newly rejected | Q | Q/calls/resolution.rs:553-559, 627-636 | MD Receiver member resolution |
| F8 | All builtins public | Private builtins denied outside admitted Corelib units | Query | Tooling | L | L/collect.rs:238; Q/calls/resolution.rs:207-221 | CI Builtin names and runtime corpus scope |
| F9 | Members inherit parent visibility | None | Retire; each member has its own visibility | Tooling (`api.json`) | L | L/collect.rs:722-731; L/member_items.rs:14-16 | MV Source unit privacy boundary |
| F10 | Rule stage W1504 | None | Keep | No | Q (add) | LR/visibility.rs:207-250 | existing MV + v06-query-front-end |
| G3 | `let x = x` sees new `x` | Sees outer `x` | Query | Tooling | L | L/rr/items_statements.rs:347-348; Q/locals.rs:344 | NR Local binding scopes |
| G11 | W1103 also for a local shadowing an item | None | W1103 only for a local shadowing a local | Diagnostic | Q+L | L/rr/scopes.rs:31-37 | NR-vis |
| G12 | Rule stage E1106 for a later `let` name | Not visible (outer binding or E1101) | E1106 only without an outer binding; else bind outer | Newly accepted | Q+L | LR/name_resolution.rs:225-265 | NR Local binding scopes; NR-use |
| G14 | Local, constant, field, scope chain | Separate facts; constants after lexical check | Local, field/sibling method, unit item or constant, import, builtin | Meaning (rare) | Q+L | L/rr/types_paths.rs:49-74; Q/locals.rs:98-117; Q/resolution.rs:44-53 | NR Unqualified value name order |
| H4 | Generic first | Lexical type first | Spec: generic first | Meaning (rare) | Q | L/rr/types_paths.rs:139-142; Q/layouts/common.rs:318 | NR Type name lookup |
| H6 | Only `impl` where-bounds | Function and impl where-bounds | Query (CT:164 already) | Tooling | L | L/rr/items_statements.rs:109-111; Q/contracts.rs:1514-1545 | existing CT "Generic parameter contract bounds" |
| H7 | None | Bounded receiver looks up `M` in `C` | Keep | No | L | Q/contracts.rs:639 | existing CT:164, 299 |
| H8 | Lookup by name | Lookup by (name, arity) | By name; arity mismatch E1203/E1204 | Diagnostic (E1201 becomes E1203/E1204) | Q | L/rr/types_paths.rs:132-149; Q/layouts/common.rs:304-312, 425-458 | NR Type name lookup |
| I2 | `this` only | `this` and `self` | Spec: `this` only | Newly rejected (implicit `self`) | Q | L/rr/items_statements.rs:58, 83, 140, 236; Q/locals.rs:47-55; Q/layouts/field_access.rs:982-990 | MD Implicit receiver and sibling methods |
| I3 | Bare field in any method | Inline-type methods only | Query | Tooling | L | L/rr/lookup.rs:151-160; Q/layouts/field_access.rs:982-990; Q/legality/value_paths.rs:184-191 | MD Implicit receiver and sibling methods |
| I4 | Sibling method before locals | Function-typed local wins | Query | Tooling | L | L/rr/expressions_patterns.rs:53-60; Q/calls/resolution.rs:226-274 | MD Implicit receiver and sibling methods |
| I5 | Not resolved | Unique inline, else same-unit `impl` method | Unique member of the full member set | Newly accepted (with I6) | Q | L/rr/expressions_patterns.rs:68-70; Q/calls/resolution.rs:513-560, 656-731 | MD Receiver member resolution |
| I6 | Collected | Not resolved by `call_lowering` | Spec: `extend type` methods join the member set | Newly accepted | Q | L/collect.rs:277-295; Q/legality/gate/expressions.rs:461-470 | MD Receiver member resolution |
| I7 | Target must be an in-scope type | None | Keep | No | Q (add) | L/rr/items_statements.rs:76 | existing ET "target binding" |
| I9 | Embeddings recorded only | Flattened; contract receivers dispatch | Keep | No | L | L/member_items.rs:104-111; Q/contracts.rs:639 | existing CT:8, 85 |
| I10 | Type path only | Literal field names must be declared (E1211) | Keep | No | L | L/rr/expressions_patterns.rs:76-81; Q/legality/members.rs:81-124 | MD Receiver member resolution |
| I11 | None | Field read binds a declared field (E1211) | Keep | No | L | Q/legality/members.rs:140-194 | MD Receiver member resolution |
| J1 | Type only; arity in rule stage | `Enum::Variant` with arity | `Enum::Variant` (grammar); fix EM text | No | none | L/rr/types_paths.rs:211-216; Q/layouts/enum_layout/constructor.rs:9-50; beskid.pest:288 | EM Qualified constructors; EM Match arm typing |
| J2 | None | Genericless constructor takes context type | Keep | No | L | Q/layouts/enum_layout/candidate_path.rs:13-40 | EM Qualified constructors |
| J4 | Rule stage E1303 | None | Keep E1303 for an unresolved variant name | No | Q (add) | LR/control_flow.rs:48-96 | EM Qualified constructors |
| J5 | None | None | Drop unqualified constructors; `use` brings `Enum`, hence `Enum::Variant` | No | none | RC:61 | RC D-COMP-SEM-0007 |
| K1 | All builtins items at their path; same-named item E1102 | Single-segment manifest builtins only | Builtins are the outermost scope; items shadow them | Newly accepted | Q+L | L/collect.rs:206-246; Q/calls/resolution.rs:203-206; QS/entry/parity_resolution.rs:50-53 | NR Unqualified value name order; CI |
| K4 | None | Syscall spellings only in admitted Corelib units | Keep | No | L | Q/calls/resolution.rs:733-752; QS/typed_program.rs:470-486 | CI Builtin names and runtime corpus scope |
| K5 | None | Runtime intrinsics only in canonical runtime corpus | Keep | No | L | Q/calls/resolution.rs:276-286 | CI Builtin names and runtime corpus scope |
| K6 | Shares agreeing constants only | Functions and constants without `pub` | Query (functions already in `v06-rust-glue-integration`) | Tooling | L | LA/mi/resolution.rs:83-108; QS/typed_program.rs:495-541; Q/resolution.rs:595-627; Q/locals.rs:150-178 | CI Builtin names and runtime corpus scope |
| K8 | Current module only | Unit top level, then import closure, no `pub` | Owner: `pub const`; private by default (grammar change) | Newly rejected (unmarked imported constants) | L+Q | L/rr/types_paths.rs:55-62; Q/locals.rs:98-193 | NR Constant names |
| L2 | None | Macro output without ancestry: unique function of the name | Retire fallback; expansion keeps the call site's module | Newly rejected (if relied on) | Q | Q/resolution.rs:563-591 | NR Names in macro expansions |
| L3 | None | Contributed items judged in the target's unit | Keep; `extend type` bodies still get no private access | No | L | QS/contribution_attribution.rs:24; Q/layouts/field_access.rs:763 | ET Public-only access and visibility |
| L5 | None | None | Keep spec; met by L3 plus F5 | No | Q | ET:26-28 | existing ET "Generated extend type contributions" |
| M1 | Generic, scope type, alias homonym | Also falls back to any same-named type in the unit | Lexical order without the any-nesting fallback | Newly rejected (rare) | Q | L/rr/types_paths.rs:132-159; Q/layouts/common.rs:304-345, 383-423 | NR Type name lookup |
| M3 | Not resolved | `This` only in receiver contexts (E1608) | Keep | No | L | L/rr/types_paths.rs:22-24; Q/locals.rs:399-411 | existing CT:202 |
| M4 | Resolves `C` only | Fails closed (E1609) | Keep spec; E1609 until implemented is a conformance gap | No | Q (later) | L/rr/types_paths.rs:29-32; Q/legality/units.rs:67 | existing CT:240 |
| N2 | Spelled string | Resolves as a type declaration | Query | Tooling | L | LA/composition/collect.rs:271-300; Q/composition.rs:107-127 | DI Registry implementation paths |

Totals: 77 rulings.

- Code to change: legacy only (normally by retirement) 38; query layer only 26 (of which 12 add
  a check the legacy side has: A6, A7, A8, A11, B6, C8, C10, C11, F10, I7, J4, and M4 later);
  both 9; none 4 (C1, D7, J1, J5).
- Rulings that go against the query layer's current behavior, not only add to it: B10, C3, C6,
  C14, D5, E10, E12, E15, F5, F7, G12, G14, H4, H8, I2, I6, K1, L2, M1 (19). Each is justified by a
  spec requirement, an open v0.6 change or cross-cutting decision 4.
- User-visible effect: no change 30; tooling only 23; diagnostic only 7 (A3, C6, C7, C8, C14,
  G11, H8); meaning 2 (G14, H4); newly accepted 8 (A1 rarely, C3, E10, E15, G12, I5, I6, K1);
  newly rejected 7 (B10, D5, E12, F7, I2, L2, M1).

## Per-rule rulings

Each entry gives the rule, both behaviors, a minimal example, the ruling with its reasoning, and
the blast radius. "Legacy" and "query" refer to the two Rust implementations.

### A. Declarations and namespaces

**A1. Kinds share one namespace per module.**
- Legacy: one `scope` map per module holds functions, types, enums, contracts and modules
  (L/collect.rs:248-370, insertion at :355). A type position that finds a function there
  reports E1201, even when an imported type of that name exists.
- Query: functions, nominal types and contracts are looked up separately (Q/resolution.rs:650-681,
  Q/layouts/common.rs:425-458, Q/contracts.rs:420-460).
- Example: `use Shapes;` (exports `pub type Box`) and a local `unit Box() {}`; a parameter
  `Box b`. Legacy: E1201. Query: binds `Shapes.Box`.
- Ruling: uniqueness uses one namespace per module (A2 stays: a type and a function of one name
  in one module are E1102). Lookup is filtered by position: a type position sees types, enums,
  contracts and generics; a value position sees locals, functions and constants. A declaration
  shadows an import only in its own position kind. Precedent: Rust keeps type and value
  namespaces apart (Reference, "Names: Namespaces").
- Blast radius: legacy only. The example compiles under the ruling; today the legacy stage
  rejects it.

**A3. Duplicate definition codes.**
- Legacy: the resolver reports E1102 (L/collect.rs:355-358) and the rule stage also reports
  E1001 for types, enums and contracts and E1006 for functions, tests, `mod` paths and `use`
  aliases (LR/definitions.rs:29-68, 495-512).
- Query: E1102 once (Q/legality/units.rs:212-240).
- Example: `pub type A {}` and `unit A() {}` in one file: two diagnostics today.
- Ruling: a duplicate binding in one scope (module item namespace, type member set, local
  scope) is reported once, as E1102. E1001 and E1006 are no longer duplicate-binding codes. TY
  "Static type rules and diagnostics" is modified to match.
- Blast radius: diagnostics only. The E1001/E1006 rule stage is retired.

**A6. Duplicate enum variant and duplicate contract method.**
- Legacy rule stage: E1002 and E1003 (LR/definitions.rs:514-538). Query: none.
- Example: `enum Color { Red, Red }`.
- Ruling: keep, as EM:10 and CT:8 already require. The query layer must report them.
- Blast radius: none for users while the legacy stage runs; the query layer gains the check.

**A7. Package-prefixed symbol identity.**
- Legacy: each exportable item gets a `SymbolQualifier {package, shape}`; a duplicate is a
  `DuplicateSymbol` error (L/collect.rs:83-115; L/symbol.rs:160-190).
- Query: identity is `AstNodeKey`; no qualified name.
- Example: `api.json` row `symbolKey` for `Core.Output.WriteLine` in package `corelib`.
- Ruling: keep a package-prefixed qualified name as the stable tooling identity (NR "stable
  qualifiedName", RC D-COMP-SEM-0016). Derive it from the binding facts (declaration key to
  name), not from a second registry. A duplicate qualified name cannot occur once E1102 and
  E1104 hold; if it occurs it is an internal compiler error, not a user diagnostic. The RC
  requirement is restated without `ItemId`, `SymbolRegistry` and `resolve/symbol_lookup.rs`.
- Blast radius: tooling, only if derived names differ from today's. Flagged (accepted ADR
  rewrite).

**A8. Member identity shapes.**
- Legacy: methods `Receiver::Name` (receiver as written), members `Parent::child`, test
  statements `Test::statement#N`, builtins in package `beskid` (L/collect.rs:16-37, 268-314;
  L/member_items.rs:20-131). Query: none.
- Example: `extend type Panel { pub unit Render() {} }` has shape `Panel::Render`.
- Ruling: keep these shapes as the grammar of member qualified names (RC D-COMP-SEM-0016).
- Blast radius: none.

**A11. Lookup by qualified name.**
- Legacy: `qualifiedName` and `@ref` lookup by full package-prefixed path (L/symbol_lookup.rs).
  Query: none.
- Example: a doc comment `@ref Core.Results.Result`.
- Ruling: keep; the reverse lookup reads the query facts.
- Blast radius: none.

### B. Modules and files

**B6. File-scoped `mod` placement.**
- Legacy rule stage: E1505 (not first), E1506 (second `mod X;`), E1507 (inline `mod` in such a
  file) (LR/definitions.rs:73-110, 160-185). Query: none.
- Example: `use Core.Output; mod App.Main;` is E1505.
- Ruling: keep; MV "Module forms and identity" already requires it. The query layer must report
  it.
- Blast radius: none.

**B10. Several units with one logical module path.**
- Legacy: merges their items into one module scope (L/collect.rs:132).
- Query: a qualified path to the module is E1104 (Q/resolution.rs:234-238); items still collide
  across the units with E1102 (Q/legality/units.rs:639-646).
- Example: `src/A.bd` with `mod Shared;` and `src/B.bd` with `mod Shared;`.
- Ruling: a logical module path has exactly one source unit in the assembly. A second unit with
  the same path (by file location or by file-scoped `mod`) is E1104 at its module identity, and
  every reference to the path is E1104 as well. Candidate files of one package for one path
  (flat, homonymous, `mod.bd`, generated) stay one provider, as `v06-qualified-dependency-paths`
  states for assembly. Precedent: Rust and Go map one module or package path to one definition
  site per crate or directory.
- Generated companion (owner, 2026-10-14): a file `X.g.bd` next to `X.bd` is the generated
  companion of that unit and provides the same logical module. Precedent: Dart `part` files, the
  convention build_runner uses for `*.g.dart`, and C# `*.g.cs` partial declarations. The primary
  and its companion form one module scope and one privacy unit (F1): items of either file bind
  unqualified in both, and private items are shared between them. One name declared in both files
  is E1102. `use` declarations stay per file, and W1503 is judged per file. A companion with no
  primary `X.bd` is E1105; a file-scoped `mod` in the companion that names another path is E1104.
  A primary has at most one companion.
- Blast radius: newly rejected for duplicate file-scoped `mod` paths inside one package; the
  companion form is new.

**B11. Entry unit bound at the root.**
- Legacy: collects the entry at the root module and re-binds its items into its logical module
  without collision reports (L/rr/entrypoints.rs:19-59). With F3, every unit then sees entry
  items unqualified.
- Query: mirrors only the collision exemption (Q/legality/units.rs:621-625).
- Example: `Main.bd` declares `unit Log() {}`; `Tools.bd` calls `Log()` without `use Main;`.
  Legacy binds it; query does not.
- Ruling: retire. The entry unit is an ordinary unit of its logical module.
- Blast radius: tooling; the query collision exemption is removed.

**B12. Intermediate module paths.**
- Legacy: every known path, including empty intermediates, is a module
  (LA/mi/resolution.rs:109-111). Query: only registered exact paths (QS/db.rs:56-62).
- Example: only `Net/Http/Client.bd` exists; `use Net.Http;`.
- Ruling: query. A module exists only when a source unit provides it. `use Net.Http;` is E1105.
  Qualified paths through `Net.Http.Client` still work.
- Blast radius: tooling.

### C. `use` imports

**C1. `use A.B;` binds a module alias.**
- Legacy: requires a module (L/collect.rs:434-453). Query: binds only when exactly one unit is
  that module (QS/typed_program.rs:213-232, 252-266).
- Example: `use Concurrency.Channel;` then `Channel.Create<i64>()`.
- Ruling: the last segment binds to what the path names: a module, or a public item (C3). With
  B10 there is always at most one unit.
- Blast radius: none.

**C3. `use` of an item.**
- Legacy: rejects with E1108 (L/collect.rs:445-448). Query: legality accepts (longest module
  prefix plus a top-level item) but no binding is registered (Q/legality/imports.rs:10-13,
  72-96), so later references fail.
- Example: `use Concurrency.Channel.SendOk;` then `SendOk(...)`.
- Ruling: NR:11 says `use Path;` imports the final segment. `use M.Item;` binds `Item` to the
  public item `Item` of module `M`, in the position kind of that item. When the full path names
  a module, the module binding wins; the homonymous-item rule (M2, E7) still reaches an item of
  the same name inside it. A non-`pub` item is E1107. Precedent: Rust `use path::item;`, Kotlin
  `import pkg.Name`.
- Blast radius: newly accepted. Flagged (module-versus-item tie).

**C4 and C12. Scope of an import.**
- Legacy: `use M;` copies `M`'s public items into the importing module's scope, where sibling
  units and child modules see them; a private `use` leaks the same way (L/collect.rs:468-494).
- Query: each unit consults its own import targets (Q/resolution.rs:595-648;
  Q/layouts/common.rs:326-344; Q/contracts.rs:455-460; QS/db.rs:113-115).
- Example: `A.bd` has `use Core.Output;`; `A/Child.bd` calls `WriteLine("x")` without a `use`.
  Legacy binds it; query does not.
- Ruling: query. Imports bind per source unit. `use M;` binds `M` and makes `M`'s public
  functions, types, enums and contracts nameable unqualified in that unit only, below the unit's
  own declarations (C5). Precedent: Kotlin imports and C# `using` directives are file-scoped.
- Blast radius: tooling.

**C6. Two imported items provide one name.**
- Legacy: the first bound wins, sorted by name and id (L/collect.rs:499-506). Query: no binding
  (Q/resolution.rs:631-647; Q/layouts/common.rs:340-344).
- Example: `use A; use B;` where both export `pub unit Run()`; a call `Run()`.
- Ruling: query, with a stated code: E1104 at the reference, naming both candidates. No error
  when the name is not used. Precedent: C# CS0104 and Rust glob-import ambiguity (E0659) are
  reported at the use.
- Blast radius: diagnostic (an unbound reference that reports E1101 today reports E1104).

**C7. Unknown import path code.**
- Legacy: E1108 (L/collect.rs:445-448). Query: E1105 (Q/legality/imports.rs:31-70).
- Example: `use Missing.Module;`.
- Ruling: E1105, as NR:11 requires.
- Blast radius: diagnostic (the second, legacy E1108 disappears).

**C8. Two `use`s bind one name.**
- Legacy: E1102 in the resolver and E1006 in the rule stage (L/collect.rs:437-443;
  LR/definitions.rs:58-68). Query: none.
- Example: `use A.Codec; use B.Codec;`.
- Ruling: E1102 once, whether the targets differ or not. Precedent: Rust E0252.
- Blast radius: diagnostic.

**C9. Import order.**
- Legacy: imports bind in unit order, except that the analyzed unit is replayed
  (L/collect.rs:149-175). Query: order-free.
- Example: unit `A` uses `B` before `B` is collected.
- Ruling: query; binding never depends on unit or declaration order.
- Blast radius: tooling.

**C10. Unused imports.**
- Legacy: W1503, with credit by scope name, alias, or a qualified path through the imported
  module (including its homonymous item), credited to the declaring import
  (L/collect.rs:457-461, 633-674; LR/visibility.rs:106-119). Query: none.
- Example: `use Core.Output;` with no reference: W1503.
- Ruling: keep W1503 and these credit rules. The query layer must report it.
- Blast radius: none.

**C11. Missing-import suggestion.**
- Legacy rule stage: an unresolved single segment that is a known module tail gets a
  suggestion (LR/missing_imports.rs:10-60). Query: none.
- Example: `Output.WriteLine("x")` without `use Core.Output;` suggests the import.
- Ruling: keep as optional help text (MAY). It never changes a binding.
- Blast radius: none.

**C13. Implicit `Core` alias.**
- Legacy: every non-`Core` module gets an implicit `Core` alias when module `Core` exists
  (L/collect.rs:195-204). Query: no alias; the absolute lookup (E2) reaches `Core.*`.
- Example: `Core.Output.WriteLine("x")` without `use`.
- Ruling: retire. The absolute lookup of `v06-qualified-dependency-paths` covers it, and
  D-TOOL-MAN-0006 forbids a prelude.
- Blast radius: none.

**C14. Import edge to a module with more than one unit.**
- Legacy: merged (B10). Query: the edge is dropped silently (QS/typed_program.rs:254-260;
  Q/resolution.rs:210-214).
- Example: `use Shared;` where two units are `Shared`.
- Ruling: superseded by B10: the `use` reports E1104.
- Blast radius: diagnostic.

### D. Re-exports

**D4. `pub use` is a re-export edge.**
- Legacy: ignores `pub` on `use` (L/collect.rs:434). Query: a public re-export edge followed by
  the distance rule D1 (QS/typed_program.rs:229; Q/resolution.rs:372-388, 518-531).
- Example: hub `Net.bd` has `pub use Net.Http.Client;`; an importer of `Net` names `Client`.
- Ruling: query, as MV "Pub use re-exports" requires. The distance rule (D1-D3, agreed by both
  implementations) becomes normative text in the same requirement.
- Blast radius: tooling.

**D5. `pub use` of a private item.**
- Legacy: E1501 only when the `use` tail equals a private item of the same unit
  (LR/visibility.rs:80-104). Query: item `use` is not bound (C3), so no check.
- Example: `pub use Codec.Normalize;` where `Normalize` is not `pub`.
- Ruling: E1501 when a `pub use` names an item that is not `pub` or a module that is not
  reachable from the importer (D6), in any unit. A plain `use` of a private item stays E1107.
  Precedent: Rust E0364/E0365.
- Blast radius: newly rejected in the rare cross-unit case.

**D6. Private child modules.**
- Legacy: not enforced. Query: a module declared by `mod` without `pub` is reachable by path only
  from inside its parent's subtree (Q/resolution.rs:241-278).
- Example: `Net.bd` declares `mod Net.Internal;`; `App.bd` calls `Net.Internal.Reset()`.
- Ruling: query. Precedent: Rust private modules.
- Blast radius: tooling (the legacy navigation stops binding it).

**D7. Corelib prelude tiers.**
- Spec API:169-180 requires the aggregate prelude to re-export only Standard-tier modules. API:414
  records that D-TOOL-MAN-0006 ("explicit use, no prelude") superseded it on 2026-06-07. Neither
  implementation has a prelude.
- Ruling: remove the requirement.
- Blast radius: none.

### E. Qualified paths

**E3. Root shadowing.** Already ruled by `v06-qualified-dependency-paths` ("Fully qualified
dependency module paths"): a `use` binding, inline module, type, enum or contract in scope
shadows the absolute lookup. Legacy still tries an item root as a module path; query implements
the rule (Q/resolution.rs:183-186, 215-221, 280-326). Example: `use Tools as Core;` then
`Core.Run()`. Ruling: keep that change's text; no delta here. Blast radius: tooling.

**E5, E6 and E8. Type-qualified static functions.**
- Legacy E5: `Alias.Type.Member` looks `Member` up directly in the alias module, whatever
  `Type` is (L/rr/lookup.rs:56-64). Legacy E6: a 4+ segment path `A.B.T.T.M` skips the
  homonymous type segment (L/rr/lookup.rs:66-73).
- Query: `Q.T.F` binds only when `Q` names one module, `T` is a `pub` type or enum of that module
  with the written arity, and `F` is the unique `pub` function of that module
  (Q/resolution.rs:419-436). E8: inside the declaring unit, `T.F` binds the same way
  (Q/resolution.rs:395-417).
- Example: `Concurrency.Channel.Channel.Create<i64>()` (E6) and `Channel.Create<i64>()` inside
  `Concurrency/Channel.bd` (E8).
- Ruling: query. `T.F` and `M.T.F` bind `F` when `T` names one type or enum of module `M` (or of
  the current unit) and `F` is a function of that module, accessible from the reference. The
  homonymous segment skip is retired: `Concurrency.Channel.Channel.Create` binds because
  `Concurrency.Channel` is the module and `Channel` its type, not because a segment is skipped.
- Blast radius: tooling. Flagged: the convention binds any module function through any type of
  that module; the owner may want `F` to be tied to `T` (for example by its return or first
  parameter type).

**E10. Contracts as namespaces.**
- Legacy: any in-scope contract root when the module lookup misses (L/rr/types_paths.rs:100-107).
- Query: only an `[Extern]` contract of the current unit (Q/calls/resolution.rs:288-349).
- Example: `[Extern(Abi:"C", Library:"libc.so.6")] pub contract Libc { i32 getpid(); }` in
  `Native.bd`; `Libc.getpid()` in `Native.bd` and in `Tools.bd` after `use Native;`.
- Ruling: `C.M` binds a contract method only when `C` is an `[Extern]` contract. It works
  wherever `C` is in scope and accessible (pub rules), not only in its own unit. A non-extern
  contract is never a call namespace (its methods have no static body); `C.M` is E1101.
  Precedent: C# requires an implementation for static interface calls; Rust `Trait::f()`
  needs a `Self` type.
- Blast radius: newly accepted for imported extern contracts; legacy acceptance of non-extern
  contracts ends (it never compiled through the query gate). Flagged.

**E12. `Dynamic` fallback.**
- Legacy: none. Query: an unresolved qualified call whose receiver matches exactly one import
  binding lowers as `CallLowering::Dynamic` instead of failing
  (Q/calls/generics/callables.rs:147-175; Q/calls/resolution.rs:206).
- Example: `use Codec;` then `Codec.Missing()`.
- Ruling: retire. A qualified call binds a declaration or fails with E1101 (no member) or E1108
  (no module). Cross-cutting decision 4.
- Blast radius: newly rejected; the size is unknown until the gate runs on Corelib and the 61
  projects. Flagged.

**E13. Member call with a module target.**
- Legacy: resolves the target only. Query: `Path.Member(...)` whose target path is not a value
  is flattened into one qualified path (Q/calls/resolution.rs:562-583).
- Example: `Core.Output.WriteLine("x")` parsed as a member call on `Core.Output`.
- Ruling: keep. When the leftmost segment is a local, the path is a field chain (E14);
  otherwise the whole spelling is a qualified path.
- Blast radius: none.

**E15. Module-qualified item read as a value.**
- Legacy: binds the item (L/rr/types_paths.rs:92-99), and the retired checker reported E1201.
  Query: E1201 (Q/legality/value_paths.rs:24-27).
- Example: `Apply(4, MathUtil.Double)`.
- Ruling: a non-generic function reached through a qualified path and read as a value is a
  function value, exactly like an unqualified one (`v06-function-values`, "Function values and
  indirect calls"). A generic function follows "Generic function values". A type, enum,
  contract or module read as a value stays E1201.
- Blast radius: newly accepted. Flagged (depends on `v06-function-values`).

**E16. Ambiguous module path.** Query: E1104 (Q/resolution.rs:147-156); legacy merges. Ruling:
keep; B10 extends it inside one package. Blast radius: none beyond B10.

### F. Visibility and privacy

**F1. Privacy boundary.**
- Legacy: per module, and the root module is exempt (L/rr/lookup.rs:97-104).
- Query: per source unit (Q/resolution.rs:533-560; Q/legality/value_paths.rs:307-338).
- Example: `Shapes.bd` declares `unit Helper() {}` (no `pub`); `Main.bd` calls
  `Shapes.Helper()`.
- Ruling: an item, member or field without `pub` is private to the source unit that declares
  it. There is no root-module exemption. Inline modules are not privacy boundaries: a private
  item in `mod inner { }` is visible to the whole unit. Precedent: Kotlin `private` top-level
  declarations are file-private.
- Blast radius: tooling. Flagged: Rust would make `inner`'s private items invisible to the
  enclosing module.

**F3. Unqualified names from parent modules and sibling units.**
- Legacy: unqualified lookup walks the module scope chain to the root (L/rr/lookup.rs:19-29),
  so a unit sees private items of sibling units and parent modules.
- Query: unit-local only.
- Example: `Net.bd` declares `unit Trace() {}`; `Net/Http.bd` calls `Trace()`.
- Ruling: query. Unqualified names come only from the unit's lexical scopes, its imports and
  the builtins. Precedent: Rust needs `super::` or `use`.
- Blast radius: tooling.

**F4. Field privacy.** Decided by `v06-field-visibility` (coordinator ruling 2026-10-07): a field
without `pub` is private to the declaring unit, with attested compiler admissions. Legacy only
enforces E1511 (L/member_items.rs:43-50); query implements the ruling
(Q/layouts/field_access.rs:749-786; Q/legality/members.rs:195-235). Example: `request.token` from
another unit is E1211. Ruling: keep that change's text; no delta. Blast radius: none.

**F5. `extend type` and private members.**
- Legacy rule stage: E1511 for any non-public member touched in any `extend type` body
  (LR/visibility.rs:121-200).
- Query: only cross-unit field access is denied (F4); an `extend type` in the declaring unit can
  read private fields.
- Example: `Account.bd` declares `pub type Account { i64 balance, }` and
  `extend type Account { pub i64 Peek() { return this.balance; } }`.
- Ruling: spec (ET:18, and `v06-field-visibility` "extend type bodies SHALL keep E1511"). An
  `extend type` body never reads, writes or calls a non-`pub` member of the target, also in the
  declaring unit. Precedent: Kotlin extension functions cannot reach private members.
- Blast radius: no change for users while the legacy stage runs (it reports E1511 today). The
  query layer must add the same-unit case.

**F6. `impl T : C` location.** Query: same-unit lookup only (Q/calls/resolution.rs:695-731).
Legacy: none. CT "Conformance satisfaction and diagnostics" already requires "only in the module
that defines T". Example: `impl Panel : Renderable { ... }` in another unit fails. Ruling: keep.
Blast radius: none.

**F7. Private methods.**
- Query: a private method is callable only from its own unit (Q/calls/resolution.rs:553-559),
  but the two-segment local-rooted path (`local.M()`) skips the check (:627-636). Legacy: none.
- Example: `Account.bd` declares `type Account { unit Audit() {} }`; `Main.bd` calls
  `account.Audit()`.
- Ruling: keep, and close the gap: every call spelling checks method privacy.
- Blast radius: newly rejected for code that calls a private method through a local receiver
  from another unit.

**F8. Builtin visibility.**
- Legacy: every builtin is a public item (L/collect.rs:238).
- Query: private builtins and adapters are denied outside admitted Corelib units
  (Q/calls/resolution.rs:207-221).
- Example: a user unit calls a private runtime adapter `__str_concat(...)`.
- Ruling: query.
- Blast radius: tooling.

**F9. Member visibility inheritance.**
- Legacy: member items inherit the parent's visibility unless they declare their own
  (L/collect.rs:722-731; L/member_items.rs:14-16). Query: none; members use their own `pub`.
- Example: `pub type Panel { unit Layout() {} }`. Legacy treats `Layout` as public.
- Ruling: retire. Each member has its own visibility; without `pub` it is private to the
  declaring unit (consistent with F4).
- Blast radius: tooling (`api.json` marks such members private).

**F10. Unused private items.** Legacy rule stage W1504 with compiler exemptions
(LR/visibility.rs:207-250); query none. MV and `v06-query-front-end` already state W1504 and the
`Main` exemption. Example: an unreferenced private `unit Helper() {}`. Ruling: keep; the query
layer reports it. Blast radius: none.

### G. Locals and scopes

**G3. `let x = ... x ...`.**
- Legacy: the initializer sees the new `x`, which is bound before the value
  (L/rr/items_statements.rs:347-348). Query: the initializer sees the outer `x`
  (Q/locals.rs:344).
- Example: `unit F(i64 x) { let x = x + 1; }`.
- Ruling: query. A `let` binding starts after its initializer. Precedent: Rust shadowing.
- Blast radius: tooling.

**G11. Shadowing warning.**
- Legacy: W1103 when a local shadows a local, and also when it shadows a module item
  (L/rr/scopes.rs:31-37). Query: none.
- Example: `unit Run() {}` and in another function `let Run = 1;`.
- Ruling: W1103 only when a local shadows a local or parameter (NR:27 speaks of locals). A
  local that shadows an item is silent.
- Blast radius: diagnostic (fewer warnings). The query layer must add W1103.

**G12. Use before a `let` in the same block.**
- Legacy rule stage: E1106 when a single-segment reference names a `let` declared later in the
  same block, even when an outer binding of that name exists (LR/name_resolution.rs:225-265).
- Query: the later `let` is not visible; the reference binds an outer binding or is E1101.
- Example: `unit F(i64 x) { let y = x; let x = 2; }`.
- Ruling: the reference binds the nearest earlier binding (here the parameter). E1106 is
  reported only when no earlier binding exists and a later `let` of the block declares the name;
  it replaces E1101 there. NR:11 worded E1106 for `use`; imports are order-free (C9), so the
  `use` wording is replaced. Precedent: Rust (binds outer; error with a note otherwise).
- Blast radius: newly accepted (the example fails today with E1106). Flagged.

**G14. Order of unqualified value names.**
- Legacy: local, then constant, then implicit-receiver field, then the module scope chain
  (L/rr/types_paths.rs:49-74).
- Query: constants and functions are separate facts; constants are tried after the lexical
  check (Q/locals.rs:98-117; Q/resolution.rs:44-53).
- Example: `const limit = 4;` and `type Pool { i64 limit, i64 Get() { return limit; } }`.
  Legacy: the constant. Ruling: the field.
- Ruling: one order: (1) locals and parameters, innermost first; (2) in an inline type method,
  the receiver's fields and sibling methods (I3, I4); (3) items and constants of the unit,
  nearest inline module outward; (4) names imported into the unit; (5) builtins. The first
  level with a match decides; two matches on one level are E1104. Precedent: C#, Java and Kotlin
  resolve members of the enclosing type before outer declarations.
- Blast radius: meaning, in the rare case of a field and a constant with one name. Flagged.

### H. Generics

**H4. Generic parameter versus a type of the same name.**
- Legacy: the generic first (L/rr/types_paths.rs:139-142). Query: the lexical type first
  (Q/layouts/common.rs:318).
- Example: `type T {}` and `T Id<T>(T value) { return value; }`.
- Ruling: spec NR:27: the generic parameter shadows the type in its declaring signature and body.
  Precedent: Rust, C#, Kotlin.
- Blast radius: meaning, for code that names a type like a generic of the same signature.

**H6. `where` bounds on functions.** Legacy resolves only `impl` where-bounds
(L/rr/items_statements.rs:109-111); query resolves function and `impl` bounds
(Q/contracts.rs:1514-1545; Q/legality/units.rs:71-72). CT "Generic parameter contract bounds"
already requires function bounds. Example: `string Render<T>(T c) where T : Control`. Ruling:
query. Blast radius: tooling.

**H7. Bounded receivers.** Query looks `M` up in `C` for `x.M()` with `T : C` (Q/contracts.rs:639);
legacy none. CT:164 and CT:299 already require it. Ruling: keep. Blast radius: none.

**H8. Generic arity in type lookup.**
- Legacy: by name (L/rr/types_paths.rs:132-149). Query: by (name, arity)
  (Q/layouts/common.rs:304-312, 425-458), so `Box<i64>` with only a non-generic `Box` is E1201.
- Example: `pub type Box { i64 v, }` and a parameter `Box<i64> b`.
- Ruling: look up by name; then check the arity and report E1203 or E1204 (TY:26). A bare
  qualifier in a type-qualified call (E8) names the type whatever its arity.
- Blast radius: diagnostic. Flagged (query keying changes).

### I. Members

**I2. Receiver name.**
- Legacy: `this` only (L/rr/items_statements.rs:58, 83, 140, 236). Query: `this` and `self`
  (Q/locals.rs:47-55; Q/layouts/field_access.rs:982-990; Q/calls/resolution.rs:226-274).
- Example: `type Counter { i64 n, i64 Get() { return self.n; } }`.
- Ruling: spec CT:202: the receiver is `this`; `self` is not a receiver name. `self` is an
  ordinary identifier and binds only where it is declared, for example as a parameter
  (`Result<WsFrameIn, WsError> ReadFrame(WsConnection self)` in
  `corelib/packages/websocket/src/WebSocket/WsConnection.bd:424`).
- Blast radius: newly rejected for method bodies that use an undeclared `self`. The 16 Corelib
  source files that contain `self.` were sampled, not all checked; the sample declares `self`
  as a parameter.

**I3. Implicit receiver fields.**
- Legacy: a bare field name means `this.field` in any method, including `impl` and
  `extend type` (L/rr/lookup.rs:151-160; L/rr/types_paths.rs:63-68). Query: only in inline
  type-body methods (Q/layouts/field_access.rs:982-990; Q/legality/value_paths.rs:184-191).
- Example: `extend type Account { pub i64 Peek() { return balance; } }`.
- Ruling: query. TY:18 grants implicit receiver access to inline methods only. `impl` and
  `extend type` methods write `this.f`.
- Blast radius: tooling.

**I4. Sibling method calls.**
- Legacy: a bare `Name(...)` in an inline method binds the unique sibling method before locals
  (L/rr/expressions_patterns.rs:53-60; L/rr/lookup.rs:147-149).
- Query: binds the sibling, but a function-typed local of that name wins; `this.Name(...)` also
  binds (Q/calls/resolution.rs:226-274).
- Example: `type Job { unit Run() {} unit Go((unit) => unit Run) { Run(); } }`.
- Ruling: query. Locals come first (G14), as `v06-function-values` requires for function-typed
  locals.
- Blast radius: tooling.

**I5 and I6. Member set of a type.**
- Legacy: `recv.M()` is not resolved (L/rr/expressions_patterns.rs:68-70); `extend type` methods
  are collected (L/collect.rs:277-295).
- Query: `recv.M()` binds the unique inline method of the receiver's nominal type, else the
  unique method in same-unit `impl` blocks; ambiguity fails closed
  (Q/calls/resolution.rs:513-560, 656-731). `extend type` methods are not resolved by
  `call_lowering` (Q/legality/gate/expressions.rs:461-470).
- Example: `extend type Panel { pub unit Extra() {} }` and `panel.Extra()` in another unit.
- Ruling: spec MD:10: the member set of a type is its fields, its inline methods, its `impl`
  methods and its `extend type` methods, plus contract methods for bounded and contract-typed
  receivers (H7, I9). A member name is unique in the set (E1102). `recv.M()` binds that member,
  subject to visibility.
- Blast radius: newly accepted for `extend type` method calls.

**I7. `extend type` target.** Legacy: the target must be an in-scope type
(L/rr/items_statements.rs:76); query none. ET:10 already requires it. Example:
`extend type Missing { }`. Ruling: keep; the query layer reports it. Blast radius: none.

**I9. Contract members.** Query flattens embeddings and dispatches contract-typed receivers
(Q/contracts.rs:639); legacy records embeddings only (L/member_items.rs:104-111). CT:8 and CT:85
already require it. Ruling: keep. Blast radius: none.

**I10 and I11. Field names in literals and reads.** Query binds each struct literal field and
each field read to a declared field of the receiver's nominal type, else E1211
(Q/legality/members.rs:81-124, 140-194). Legacy resolves only the literal's type path
(L/rr/expressions_patterns.rs:76-81). Example: `Point { x: 1, z: 2 }`. Ruling: keep; stated in
MD "Receiver member resolution". Blast radius: none.

### J. Enums

**J1. Constructor spelling.**
- Grammar: `EnumPath = { Path ~ "::" ~ Identifier }` (beskid.pest:288), used by constructors and
  patterns (:474-475, :497). Legacy resolves the type only, arity in a rule stage
  (L/rr/types_paths.rs:211-216; LR/control_flow.rs:400-450). Query resolves type, variant and
  arity (Q/layouts/enum_layout/constructor.rs:9-50; Q/legality/members.rs:284-315).
- EM:18 and EM:26 write `Enum.Variant`; RC:61 writes `Type::Variant`.
- Example: `return Result::Ok(value);`.
- Ruling: `Enum::Variant`. Correct the EM text.
- Blast radius: none (documentation).

**J2. Context type of a genericless constructor.** Query takes the applied enum type from a
proven value context (Q/layouts/enum_layout/candidate_path.rs:13-40); legacy none. Example:
`Option<i64> o = Option::None;`. Ruling: keep; stated in EM. Blast radius: none.

**J4. Unqualified variant call.** Legacy rule stage: E1303 for an unresolved call whose name is
a variant of a known enum (LR/control_flow.rs:48-96); query none. EM:18 lists E1303. Example:
`Some(x)`. Ruling: keep; the query layer reports E1303 instead of E1101 there. Blast radius:
none.

**J5. Enum constructors through `use`.** RC D-COMP-SEM-0007 requires `use` to bind public enum
constructors as `Type::Variant` and unqualified when the type is in scope; neither
implementation does the unqualified part. Example: `use Core.Results;` then `Ok(1)`. Ruling:
there are no unqualified constructors. `use` makes the enum nameable, and `Enum::Variant` follows
from that. This matches J4 (E1303) and EM. Blast radius: none. Flagged (accepted ADR rewrite).

### K. Builtins, Core and the runtime corpus

**K1. Builtin names.**
- Legacy: every builtin table entry is an item at its `beskid_path` module; a user item of the
  same name is E1102 (L/collect.rs:206-246).
- Query: only single-segment manifest builtins resolve unqualified (Q/calls/resolution.rs:203-206;
  QS/entry/parity_resolution.rs:50-53).
- Example: a user declares `unit Panic(string message) {}` while `Panic` is a builtin.
- Ruling: builtins are the outermost scope (G14 level 5). A local, item or import of the same
  name shadows a builtin without a diagnostic. Only public single-segment manifest builtins are
  nameable from ordinary code. Precedent: the Rust prelude and C# `global::` names are shadowed
  by declarations.
- Blast radius: newly accepted. Flagged.

**K4 and K5. Compiler-minted Corelib services and runtime intrinsics.** Query: legacy syscall
spellings bind only in admitted Corelib units (Q/calls/resolution.rs:733-752;
QS/typed_program.rs:470-486); runtime intrinsics only in the canonical runtime corpus
(Q/calls/resolution.rs:276-286). Legacy none. Example: a user unit calls `__hub_create()`.
Ruling: keep; stated in CI. Blast radius: none.

**K6. Runtime corpus scope.** Query: the canonical runtime corpus is one private scope for
functions and constants (QS/typed_program.rs:495-541; Q/resolution.rs:595-627;
Q/locals.rs:150-178). Legacy shares only constants with agreeing values (LA/mi/resolution.rs:83-108).
`v06-rust-glue-integration` already specifies the function part ("Private canonical runtime
helpers require verified corpus scope"). Ruling: query; CI adds the constants part. Blast radius:
tooling.

**K8. Constants.**
- Legacy: only the current module, inline modules included (L/rr/types_paths.rs:55-62).
- Query: the unit's top level, then the unit's import targets without a `pub` requirement;
  several import targets with one equal value count as one (Q/locals.rs:98-193).
- Example: `Limits.bd` has `const MaxFrame = 16384;`; `Codec.bd` has `use Limits;` and reads
  `MaxFrame`.
- Ruling (owner, 2026-10-14): constants take `pub` like every other item. `ConstantDefinition`
  becomes `{ Visibility? ~ KwConst ~ Identifier ~ "=" ~ IntegerLiteral ~ ";" }` (beskid.pest:328).
  A constant without `pub` is private to its source unit (F1, E1107); `pub const` is visible to
  every unit that imports its module. Distinct values for one public name are E1104. The runtime
  corpus private scope (K6) still shares constants without `pub`.
- Blast radius: newly rejected. Corelib and fixture constants read from other units need `pub`.

### L. Mods, attributes, macros

**L2. Names in macro expansions.**
- Query: a macro-expanded function that lost its module ancestry falls back to "the unique
  function of that name in the unit" (Q/resolution.rs:563-591). Legacy: none.
- Example: a macro emits a call `Helper()` inside an inline module.
- Ruling: retire the fallback. Expansion output keeps the module of its invocation site and
  resolves by the ordinary rules.
- Blast radius: newly rejected only if a program relies on the fallback. Flagged.

**L3 and L5. Mod-contributed items.** Query judges privacy of contributed items as if they were
in the unit that declares their target (QS/contribution_attribution.rs:24;
Q/layouts/field_access.rs:763); legacy none. ET:26-28 requires generated `extend type` blocks to
obey hand-written rules, which no implementation checks (L5). Ruling: keep L3; with F5 an
`extend type` body never gains private access in any unit, so L3 and L5 agree. Example: a
`Generator` emits `extend type Account { ... this.balance ... }`: E1511. Blast radius: none.

### M. Type-level names

**M1. Single-segment type names.**
- Legacy: generic, then a type, enum or contract in scope, then a module alias's homonymous
  item, else E1201 (L/rr/types_paths.rs:132-159).
- Query: lexical types of the nearest inline module outward, contracts separately, then imports,
  with a final fallback to any same-named type anywhere in the unit
  (Q/layouts/common.rs:304-345, 383-423; Q/contracts.rs:420).
- Example: `mod a { pub type Node {} }` and `mod b { unit F(Node n) {} }`. Query binds `a.Node`
  through the fallback.
- Ruling: (1) generic parameters; (2) types, enums and contracts of the unit, nearest inline
  module outward; (3) types imported into the unit, with the unit's own declaration first
  (`v06-serialization-bsol`, "Local nominal type precedence"); (4) the homonymous item of a
  module alias (M2). No fallback to other inline modules.
- Blast radius: newly rejected in the rare inline-module case.

**M3. `This`.** Query: valid only in contract, `impl`, `extend type` and inline method
signatures, else E1608 (Q/locals.rs:399-411; Q/legality/units.rs:65); legacy does not resolve it
(L/rr/types_paths.rs:22-24). CT:202 already requires it. Ruling: keep. Blast radius: none.

**M4. Associated-type references `C::Item`.** CT:240 requires resolution through the
implementor's binding. Legacy resolves `C` only (L/rr/types_paths.rs:29-32); query fails closed
with E1609 (Q/legality/units.rs:67). Example: `pub T::Item First<T>(T it) where T : Iterator`.
Ruling: keep the spec. E1609 while it is unimplemented is a conformance gap, recorded in
tasks, not a rule. Blast radius: none now.

### N. Composition

**N2. Registry implementation paths.** Legacy keeps the spelled string
(LA/composition/collect.rs:271-300); query resolves the path as a type declaration
(Q/composition.rs:107-127). Example: `registry { single ConsoleLogger for Logger; }` with
`ConsoleLogger` imported. Ruling: query; an unresolved path is E1201. Blast radius: tooling.

## Rulings flagged for the owner

These rulings rest on a judgment that the owner confirmed on 2026-10-14. Rows 1, 2 and 13 record the owner's own decisions; the owner accepted the remaining rulings as drafted.

| # | Rules | Question | Ruling taken |
|---|---|---|---|
| 1 | F1 | Are inline modules privacy boundaries? | Decided by the owner on 2026-10-14: no, the source unit is the boundary (Kotlin). |
| 2 | B10 | Do generators need a companion unit that shares a module path ("partial module")? | Decided by the owner on 2026-10-14: yes, one generated companion `X.g.bd` per unit (Dart `part`). |
| 3 | C3 | `use A.B;` when `A.B` is both a module and an item `B` of `A` | The module wins; the item stays reachable through M2. |
| 4 | E5, E6, E8 | Should `T.F` bind any function of `T`'s module? | Yes (current Corelib convention); retire the segment skip. |
| 5 | E10 | Imported `[Extern]` contracts as namespaces | Allowed wherever accessible; non-extern contracts never. |
| 6 | E12 | Remove the `Dynamic` fallback | Yes; blast radius unknown until the Corelib and 61-project gate runs. |
| 7 | E15 | Qualified function read as a value | A function value (depends on `v06-function-values`). |
| 8 | G12 | Later `let` with an earlier outer binding | Bind the outer binding (Rust); relaxes today's E1106. |
| 9 | G14 | Field versus constant precedence | The field (C#, Kotlin). |
| 10 | H8 | Arity-keyed type lookup | Name lookup, then E1203/E1204. |
| 11 | I5, MD | Remove overloading by arity from MD | Yes: member names are unique; MD:18 contradicts E1102. |
| 12 | K1 | Items shadow builtins without E1102 | Yes. |
| 13 | K8 | Constants have no visibility | Decided by the owner on 2026-10-14: `pub const`, private by default. |
| 14 | A3 | Duplicate codes | E1102 only; E1001/E1006 leave the duplicate rule. |
| 15 | A7, A8, A11, J5 | Rewrite accepted ADRs D-COMP-SEM-0016 and D-COMP-SEM-0007 | Restated without legacy structures and without unqualified constructors. |
| 16 | L2 | Remove the macro "unique function" fallback | Yes; expansion keeps the call-site module. |

## Relation to open changes

- `v06-qualified-dependency-paths` owns E2, E3, cross-package E1104 and qualified E1107. B10 and
  C14 extend its E1104 inside one package. No requirement of it is modified.
- `v06-field-visibility` owns F4. F1 and F9 extend the same boundary to items and members.
- `v06-query-front-end` modifies MV "Default privacy and pub export". This change adds a separate
  MV requirement ("Source unit privacy boundary") instead of modifying that one, so the two
  changes do not conflict. After both are archived, the owner may merge the two texts.
- `v06-serialization-bsol` adds NR "Local nominal type precedence over imported types". M1 uses
  it as level 3 and does not restate it.
- `v06-rust-glue-integration` adds TY "Private canonical runtime helpers require verified corpus
  scope" (K6 functions). It modifies TY "Type expression grammar"; this change modifies TY
  "Static type rules and diagnostics" only.
- `v061-attributes-and-isolate-prerequisites` modifies CT "Conformance satisfaction and
  diagnostics" and adds MD "Generic methods and method type arguments". This change does not
  touch those requirements.
- `v06-function-values` owns function values; E15 depends on it.

Archive order: the v0.6 changes above, then this change.

## Risks / Trade-offs

- [Newly rejected programs: E12, I2, F7, M1, L2, B10] Run the query gate with each ruling on
  Corelib and the 61 projects before the ruling becomes the authority; record the count in tasks.
- [Two resolvers stay alive during migration] The legacy stage keeps reporting legacy errors in
  `beskid check` until it is retired. Retire it per rule group (tasks section 3), so that a
  relaxed ruling (A1, C3, G12, K1) takes effect when its legacy check goes.
- [Diagnostic churn in tests] Expected; the fixtures move with the implementation tasks.

## Migration Plan

None for users (no users). Implementation order is in `tasks.md`: query layer conformance
first, then retirement of the legacy consumers, then the Beskid resolver as a shadow against the
query facts (`resolver-generation`, Part 6).

## Open Questions

The 16 flagged rulings above.
