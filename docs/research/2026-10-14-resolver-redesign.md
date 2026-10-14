# Resolver redesign: what it does, what others do, what a rewrite costs

Date: 2026-10-14. Read-only research. Code references are to compiler `release/v0.6.0` at
commit `33252049` (which contains round 3, `3a837a47`, of the compile-time work). Line numbers
are from `git show HEAD:<path>`.

Note on the worktree: the compiler worktree under `~/.codex/worktrees/v06-release/beskid/compiler`
has uncommitted edits (17 files) that remove round 3's `AssemblyDeclarationTables` from
`module_index/resolution.rs`, `spine.rs`, `rules/core.rs` and `name_resolution.rs`, and also touch
`runtime_fixture.rs` and `workflow/resolution.rs`. This document describes the committed state.
Someone should confirm whether that dirty state is intended work in progress or an accidental
revert. This research did not touch it.

## Summary

- Beskid has **two name resolvers**. The imperative `Resolver` in `beskid_analysis::resolve`
  (3,499 lines) serves rule diagnostics, the LSP and `beskid doc`. The demand-driven resolution in
  `beskid_queries::semantic_contract` (about 2,700 lines across `resolution.rs`, `locals.rs`,
  `local_type_resolution.rs`, `calls/resolution.rs` and `legality/value_paths.rs`) is the semantic
  authority for `check`, typing and codegen. They implement the same language rules twice, and
  their comments say so (`resolver.rs:48-52`, `collect.rs:449-453`).
- `beskid check` is quadratic because the imperative resolver has no shareable global state.
  Each own unit's rule pass builds a new `Resolver`, collects every other unit of the assembly
  into it, resolves the unit, and then merges every other unit's declaration tables and rebuilds
  a span index over all of them. With U own units and N assembly units, that is U x N collections
  plus U x N table merges. compiler-sdk has 262 own source units.
- **Cost of a rewrite**, from smallest to largest:
  - (a) Shareable seeded state: about 300-500 changed lines, 2-3 agent-days including
    equivalence. Removes the quadratic collection.
  - (b) Per-unit declaration summaries and a per-package DefMap as Salsa queries: about
    2,500-4,000 lines, 8-12 agent-days.
  - (c) Delete the imperative resolver and move its consumers onto the query layer: about
    5,000-7,000 lines touched, 15-25 agent-days, with diagnostic churn certain.
- **Recommendation:** ship 0.6.0 as it is. Do (a) in 0.6.1, after a fresh profile confirms the
  share. Plan (c) as the strategic direction for 0.7, taking (b)'s summaries as its first step
  inside `beskid_queries`. Do not build (b) as a third model in `beskid_analysis`.

## Part 1: What Beskid's resolver does today

### 1.1 Data structures

`Resolver` (`resolve/resolver.rs:17-59`) is one mutable struct. It holds both global state (all
collected items, the module graph, symbols) and per-unit state (imports, local scopes, the
current module, receiver context). The struct derives only `Debug` and `Default`, not `Clone`.

| Field group | Fields | Scope |
|---|---|---|
| Item arena | `items: Vec<ItemInfo>`, `builtin_items`, `constants`, `shared_constants` | global |
| Module tree | `module_graph: ModuleGraph` (`module_graph.rs:19-24`): `Vec<ModuleInfo>`, path map; each `ModuleInfo` has `scope: HashMap<String, ItemId>` that mixes declared and imported names | global, but mutated per unit by imports |
| Identity | `symbols: SymbolRegistry`, `by_symbol` (package-prefixed `SymbolQualifier`, spec D-COMP-SEM-0016) | global |
| Import state | `module_imports`, `imported_scope_origins`, `declaring_scope_origins`, `imported_scope_entries`, `pending_reexport_imports`, `module_import_origins` | per unit, cleared on each collect |
| Body state | `local_scopes`, `generic_scopes`, `current_module`, `current_receiver_item_id`, `current_type_sibling_methods`, `current_function`, `sdk_source_authority`, `current_source_path` | per body |
| Output | `tables: ResolutionTables`, `errors`, `warnings` | per run |

`Resolution` (`resolver.rs:154-165`) is the product. It owns `items`, `module_graph`, `tables`,
`span_index`, `symbols` and `by_symbol`. `take_resolution` (`resolve_refs/entrypoints.rs:126-140`)
moves them out of the resolver with `mem::take`, so a resolver produces exactly one resolution.

`ResolutionTables` (`tables.rs:72-89`) holds span-keyed facts: `resolved_values`,
`resolved_types`, `used_import_spans`, `locals`, `type_conformances`, and per-source-path
`scoped_resolved_values` and `scoped_resolved_types` for dependency units.

### 1.2 Phases

1. **Builtins.** `collect_builtins` (`collect.rs:206-246`) interns the builtin functions once per
   resolution (`entrypoints.rs:27-29`).
2. **Collection** (`collect_program_in_module` `collect.rs:117-134`, `collect_program`
   `:136-147`, `collect_items` `:180-193`). This step runs over each unit's top-level items. It
   collects declarations first, then `use` declarations, then pending re-exports, then the
   implicit `Core` import. `collect_item` (`:248-432`) pushes `ItemInfo`s, registers symbols
   (`try_register_symbol`, `:83-115`, which reports a duplicate qualifier as `DuplicateSymbol`),
   and collects members (`collect_member_items`, `:722-760`).
3. **Imports** (`collect_use_declaration` `:434-466`, `import_public_items_from_module`
   `:468-496`, `insert_scope_imports` `:498-528`, re-exports `:530-631`). A `use` copies the
   target module's public items into the *importing module's* scope at collection time, in unit
   order. Re-exports through `pub mod` follow the distance rule in `reexported_item_route`
   (`:557-571`). Imports are therefore order-dependent. A unit that uses a module collected
   later sees that module's scope as it is at that moment. `prepare_collected_program`
   (`:149-176`) replays a unit's `use` declarations before its references are resolved, so only
   the analyzed unit gets an order-independent view.
4. **Module paths and qualified paths** (`resolve_refs/lookup.rs`). Unqualified names walk the
   module scope chain to the root (`resolve_item_in_scope`, `:19-29`). Qualified paths expand
   import aliases (`:31-41`) and try four heuristics in `resolve_item_in_module_path`
   (`:43-81`): the parent module, a member in an aliased module, a skipped homonymous type
   segment, and the homonymous leaf module. The module lookup checks visibility
   (`lookup_named_item_in_module`, `:88-119`).
5. **References and bodies** (`resolve_refs/items_statements.rs`, `expressions_patterns.rs`,
   `types_paths.rs`). These walk items, statements, expressions, patterns and types, and record
   `resolved_values` and `resolved_types` by span.
6. **Locals and generics** (`resolve_refs/scopes.rs:10-81`). This uses a stack of
   `HashMap<String, LocalId>` scopes and reports shadowing (`find_shadowed_local`).
7. **Members.** Method items are named `Receiver::Name` at collection. Inside type-body methods,
   bare calls bind to a unique sibling method (`current_type_sibling_methods`), as the query
   layer's `unqualified_enclosing_method_call` does.

Entry points (`resolve_refs/entrypoints.rs`): `resolve_program` (`:10`),
`resolve_entry_program_in_module` (`:19-36`), `resolve_collected_program` (`:61-74`), the
error-tolerant variant (`:77-91`) for `api.json`, and `resolve_collected_program_declarations`
(`:102-124`) for declaration annotations only.

### 1.3 Assembly integration (`projects/assembly/module_index/resolution.rs`)

- `seed_resolver_from_assembly` (`:102-158`) ensures every known module path exists. It then
  calls `collect_program_in_module` for **every assembly unit except `excluded`**, clears errors
  and imports, and sets the SDK authority.
- `resolve_entry_program` (`:55-79`) seeds a new resolver and excludes the entry. It then
  collects the entry *at the root* and binds its items into its logical module as well
  (`bind_root_items_in_module`, `entrypoints.rs:40-59`). Next it resolves the entry, and finally
  it merges dependency declaration tables.
- `assembly_declaration_tables` (`:188-201`, round 3) seeds one resolver with all units and
  resolves each unit's declaration annotations once.
- `merge_dependency_declaration_tables` (`:205-226`) copies every other unit's tables into the
  entry's `scoped_resolved_types` and `type_conformances`. It then calls `rebuild_span_index`,
  which sorts every value and type span of every merged unit (`span_index.rs:89-108`).
- `resolve_unit_program` (`:85-97`) seeds the resolver and excludes the *entry*, not the unit.
  It then collects the unit a second time at the root.

### 1.4 Callers

Counted with `git grep` at HEAD (tests included where noted).

| Caller | Site | What it resolves | Frequency |
|---|---|---|---|
| `check` / prepare: entry rule pass | `rules/staged/name_resolution.rs:23-29`, from `services/prepare/spine.rs:208-216` | entry unit | once per prepare |
| `check`: own-unit rule pass | `spine.rs:384-420` (`own_unit_rule_diagnostics`) -> `semantic_rule_diagnostics_for_program_with_pipeline` -> stage 1 | **each own unit as entry** | U times per `check` |
| Project-less rules | `name_resolution.rs:41-43` (`Resolver::new().resolve_program`) | one program | per call |
| LSP immediate edit pass | `beskid_lsp/src/session/lifecycle/documents.rs:274` -> `beskid_queries::entry_resolution_with_db` (`entry.rs:366-380`) | entry | every immediate edit; **result discarded** (`let _ =`) |
| LSP typed entry bundle | `beskid_queries/src/typed_entry_bundle.rs:302` | entry | debounced |
| LSP find references | `services/document/navigation.rs:211-218` | **every non-entry unit**, each with a full seed | per request, U x N |
| LSP completion, document model | `services/document/completion.rs`, `model.rs` | consume `Resolution` | per request |
| `beskid doc` (`api.json`) | `services/document/snapshot.rs:54-56` -> `resolve_for_api_documentation` (`resolution.rs:161-178`) | entry plus tables of all units | per doc build |
| Mod host | `mod_host/registrations.rs:228` (test fixture); `merge.rs` keys on spans | - | tests |
| Test harnesses | `beskid_tests_projects/src/projects/{assembly,corelib/compile,fixture_harness}.rs`, `services/document_tests.rs:126`, `collect.rs` and `visibility.rs` unit tests | entry | tests |

Totals at HEAD: `resolve_entry_program` has 6 call sites (4 in tests or harnesses).
`Resolver::new` has 17 sites (9 in tests). `seed_resolver_from_assembly` has 4 sites.
`Resolution` is consumed in 28 files of `beskid_analysis`, 3 of `beskid_queries`, 1 of
`beskid_lsp`, 1 of `beskid_tests_projects` and 1 of `beskid_cli` (`commands/doc/execution.rs`).

Codegen and typing do **not** consume the imperative `Resolution`. `beskid_codegen` and
`beskid_abi` have no reference to it. Since the 2026-10-09 ruling ("the query gate is the sole
semantic authority of `beskid check`", `docs/reports/2026-10-04-v06-decisions.md`), the rule
pipeline keeps only structural and style rules. Stage 1 still emits resolve errors, and stages
`missing_imports` (`missing_imports.rs:20`) and `visibility` (`visibility.rs:33`, unused imports
`:106`) read the `Resolution` (`rules/staged.rs:43-58`).

### 1.5 Relation to the query layer: duplication

`beskid_queries` resolves names on its own and demand-driven, per AST node, through Salsa:

- `resolved_item_tracked` (`semantic_contract/resolution.rs:5-16`, `#[salsa::tracked(persist)]`)
  resolves one path expression.
- `resolve_item_declaration_candidate` (`:37-75`) checks lexical declarations first, then
  same-unit functions (`SyntaxIndex::ids_named`), then imported functions.
- `qualified_module_resolution` (`:187-244`) handles import routes first, then the
  package-native absolute namespace (the 2026-10-09 "qualified dependency paths" ruling; E1104 on
  ambiguity).
- `nearest_reexport_route` (`:462-516`) repeats the re-export rule that `collect.rs:557` also
  implements.
- `locals.rs` (496 lines) and `local_type_resolution.rs` (339 lines) resolve locals separately.
- Cross-unit facts come from `SyntaxDependencyRegistry` (`beskid_queries/src/db.rs:26-104`):
  import edges `(unit, generation) -> Vec<SyntaxImport>` and `(generation, module path) -> units`.
  The registry is a mutex-guarded side table, not a Salsa input. It is safe because every
  `AstNodeKey` carries its `SyntaxGenerationId`, but Salsa does not track reads through it.

So the query layer does not re-run the imperative resolver. It re-implements the language's
name-binding rules, and both copies must agree. The resolver's comments acknowledge this
directly: `resolver.rs:48-52` mirrors `unqualified_enclosing_method_call` ("the production
authority"), `resolver.rs:106-112` keeps a conversion-name list "in sync" with
`calls/facts.rs`, and `collect.rs:449-453` mirrors `nearest_reexport_route`. The spec requires
"one resolution snapshot per compilation"
(`openspec/specs/language-meta--program-structure--name-resolution/spec.md:34-41`). Today that
holds per consumer, but not across the two implementations.

### 1.6 Why `check` is quadratic

For compiler-sdk, the own units are the 262 `.bd` files under `src/`. N also includes the
dependency units in the assembly (Core and others). Per own unit X, `own_unit_rule_diagnostics`
(`spine.rs:399-418`) does the following:

1. `seed_resolver_from_assembly(excluded = X)`: `collect_program_in_module` for N-1 units. Each
   call allocates `ItemInfo` names, symbol qualifiers and member items, hashes module scopes, and
   replays imports and re-exports. **O(N) per unit, O(U x N) per check.**
2. Collect X at the root and resolve X's bodies. This is O(|X|) and is the only work that must
   happen per unit.
3. `merge_dependency_declaration_tables`: round 3 made the *resolution* of the tables shared, but
   each unit still clones N-1 units' type maps into its own `scoped_resolved_types` and then sorts
   all spans in `rebuild_span_index`. **O(N log N) per unit.**
4. Smaller linear scans per unit:
   - `collect_known_type_names` walks every assembly unit (`rules/staged/definitions.rs:405`).
     `assembly_programs_excluding_entry` (`control_flow.rs:120-131`) has 4 call sites.
   - `(*assembly.module_index).clone()` and `known_module_paths.clone()` run per unit
     (`spine.rs:406-407`).
   - `run_stages` clones the program (`staged.rs:33`).

`Resolver` is not `Clone`, and the entry is collected differently from its siblings (at the root,
then bound into its module). Because of this, step 1 cannot reuse a base resolver. The base would
already contain X in its module, and collecting X again at the root registers its items twice.
That is what the compile-time report means by "the entry unit must be collected without
duplicating its items".

The same pattern makes LSP find-references O(U x N) per request (`navigation.rs:211-218`). It also
makes every immediate edit pay a full O(N) seed for a resolution that is thrown away
(`documents.rs:274`; `entry_resolution_with_db` has no side effects, because the assembly is
already present and `assemble_resolved_input_with_db` only clones it).

Two smaller latent issues came up while reading:

- `span_index_from_tables` flattens the scoped tables of all units into one index keyed only by
  `SpanInfo`, so two units with identical spans can collide in `SpanIndex::lookup_*`.
- Collection-time import binding is order-dependent for every unit except the one that is
  analyzed.

Neither is known to cause a wrong diagnostic today. A redesign should keep both in mind.

### 1.7 Size

| Area | Lines |
|---|---|
| `beskid_analysis/src/resolve/**` | 3,499 (`collect.rs` 975, `items_statements.rs` 382, `tables.rs` 322, `types_paths.rs` 217, ...) |
| `projects/assembly/module_index/**` | 467 |
| Rule stages consuming `Resolution` (`analysis/rules/staged/*.rs`) | 2,777 |
| Query-layer resolution cluster | about 2,670 (`resolution.rs` 700, `calls/resolution.rs` 752, `locals.rs` 496, `local_type_resolution.rs` 339, `legality/value_paths.rs` 338, `model/resolution.rs` 44) |
| Tests | 15 unit tests in `resolve/`, 75 in `projects/assembly` (mostly loader), 34 in `analysis/rules`; integration tests `beskid_analysis/tests/{scoped_use,module_namespace_v06,module_constants,...}.rs`; 15 files in `beskid_tests_projects` and 9 in `beskid_tests_mods` reference resolution |

## Part 2: How other implementations do it

The same pattern appears everywhere. Each file (or module) gets a **cheap summary of its
declarations, built once and independent of other files**. A **global table is merged from the
summaries once per package**, or lazily. **Bodies resolve against that shared table, read-only**,
so per-file work is proportional to the file. No production compiler rebuilds the global scope
per analyzed file.

### rust-analyzer: ItemTree, DefMap, Salsa

- **Per-file summary.** `ItemTree` is a per-file, position-independent list of top-level items.
  It is a Salsa query, so an edit inside a function body produces an equal ItemTree, and nothing
  downstream is invalidated.
- **Per-crate DefMap.** `crate_def_map` builds the module tree and per-module scopes for one
  crate. The `hir-def/src/nameres.rs` module docs describe collecting raw items per file, then a
  module walk, then **fixed-point import resolution**: unresolved imports are kept in a list,
  each pass resolves some, globs are populated recursively, and passes repeat until nothing
  changes. Macro expansion is interleaved
  ([nameres.rs](https://github.com/rust-lang/rust-analyzer/blob/master/crates/hir-def/src/nameres.rs)).
  Block-level items get their own `block_def_map`.
- **Bodies** resolve lazily per function against the DefMap (`Resolver` in `hir-def` is a cheap
  stack of scope references, not a copy).
- **Why not per-file laziness.** matklad's "Three Architectures for a Responsive IDE" names three
  designs: map-reduce indexing of per-file stubs (IntelliJ, Sorbet), header snapshots (clangd,
  Merlin), and query-based (Salsa). He argues that Rust's macros and `#[path]` force crate-level
  name resolution, which is then made cheap through fine-grained incrementality and early cutoff
  ([blog](https://rust-analyzer.github.io/blog/2020/07/20/three-architectures-for-responsive-ide.html);
  architecture: [rust-analyzer book](https://rust-analyzer.github.io/book/contributing/architecture.html)).
- **Avoiding quadratic work.** The DefMap is computed once per crate and shared, and an edit
  inside a body leaves ItemTrees unchanged.

### rustc_resolve

rustc builds the whole crate's module graph once. `BuildReducedGraphVisitor` defines items in
modules, `ImportResolver` runs a fixed-point loop over indeterminate imports, and then
**late resolution** (`rustc_resolve::late`) walks every body once, with ribs (scope stacks) for
locals and generics, against the shared module graph. Its output is the `Res` map keyed by
`NodeId`, which later HIR lowering consumes
([rustc dev guide: name resolution](https://rustc-dev-guide.rust-lang.org/name-resolution.html)).
This is batch rather than incremental, but it is linear: one graph, one late pass per body.
Beskid's `Resolver` follows this design (collect, imports, ribs for locals). What it lacks is the
property of building the graph once and walking all bodies against it.

### Roslyn (C#)

- **Per-tree declarations.** Each syntax tree produces a `RootSingleNamespaceDeclaration`.
- **Merged lazily.** `DeclarationTable` keeps an immutable set of "older" roots with a cached
  merged root, plus one "latest" root for the file being edited. It is "optimized for a large,
  stable set of declarations plus one root declaration for the file being edited". A keystroke
  re-merges only the latest root with the cached rest
  ([DeclarationTable.cs](https://github.com/dotnet/roslyn/blob/main/src/Compilers/CSharp/Portable/Declarations/DeclarationTable.cs)).
- **Symbols.** `MergedNamespaceSymbol` presents namespaces spread across trees and assemblies as
  one symbol, and members are created on demand.
- **Binders** are a lazily created chain per syntax position (`BinderFactory`), so binding one
  method body touches only its binder chain
  ([Roslyn overview](https://github.com/dotnet/roslyn/blob/main/docs/wiki/Roslyn-Overview.md)).
- **Avoiding quadratic work.** The global declaration space is immutable and shared, and only the
  edited tree's contribution is recomputed.

### TypeScript

The **binder runs once per file** and creates symbol tables (`locals`, `exports`, `members`) on
containers. The binder sees one file at a time, so cross-file merging of global or ambient
declarations happens **once**, in `initializeTypeChecker` through `mergeSymbolTable`
([compiler notes: binder](https://github.com/microsoft/TypeScript-Compiler-Notes/blob/main/codebase/src/compiler/binder.md)).
Module imports resolve lazily through alias symbols (`resolveAlias`), and the checker computes
types on demand with per-symbol caching (`getTypeOfSymbol`). Per-file work is proportional to the
file.

### Kotlin K2 (FIR)

FIR resolves in ordered **phases**: RAW_FIR, IMPORTS, SUPER_TYPES, TYPES, STATUS,
IMPLICIT_TYPES_BODY_RESOLVE, BODY_RESOLVE, CHECKERS. The ordering guarantees that "everything a
phase can see" is already resolved to the previous phase. Cross-file lookup goes through
**symbol providers** (`FirSymbolProvider` by `ClassId` or `CallableId`) and scopes. Providers
compose current-module sources, plugin-generated declarations and binary dependencies. The CLI
runs phases in batch, and the Analysis API (IDE) runs them **lazily per declaration**
([fir-basics.md](https://github.com/JetBrains/kotlin/blob/master/docs/fir/fir-basics.md)).
The relevant lesson for Beskid is that **checkers are a separate phase that reads resolved
state**. Beskid's rule stages are the equivalent.

### Go (`go/types`, `types2`)

`collectObjects` declares every package-level object of every file into **one package scope**,
once. Each file gets a child **file scope** that holds only its imports (dot-imports copy
exported objects). Duplicates between file and package scope are reported once. `packageObjects`
then type-checks objects lazily through `objDecl`, in phases for types, aliases and the rest, with
cycle detection
([resolver.go](https://github.com/golang/go/blob/master/src/go/types/resolver.go)).
This model is the closest to Beskid's needs: package scope shared and immutable after collection,
file scope private and small. The entry-at-root special case does not exist in Go.

### Swift: request evaluator

Swift replaces ad hoc mutable lookups with **requests**: hashable value types evaluated by a
central evaluator that memoizes, detects cycles, and records name-lookup dependencies per source
file for incremental builds. An example is `DirectLookupRequest(Foo, "bar")`, a "dependency sink"
recorded against the active file
([RequestEvaluator.md](https://github.com/swiftlang/swift/blob/main/docs/RequestEvaluator.md)).
Unqualified and qualified lookup are requests (`UnqualifiedLookupRequest`,
`QualifiedLookupRequest` in `lib/AST/NameLookupRequests.cpp`). The query layer's
`resolved_item_tracked` is this design.

### Sorbet

Sorbet keeps symbols and interned names in flat arrays in `GlobalState`, referenced by 32-bit
ids. The per-file phases (parse, desugar, rewriter, then the namer that enters definitions) run
in parallel over files. The resolver (constants, ancestors, signatures) runs on the merged
global state. Inference is **local-only** and runs in parallel over read-only copies of
`GlobalState`
([Elhage, "Why the Sorbet typechecker is fast"](https://blog.nelhage.com/post/why-sorbet-is-fast/);
[Sorbet internals](https://github.com/sorbet/sorbet/blob/master/docs/internals.md)). The LSP has
a fast path: when an edit does not change any file's definitions (a symbol-table hash), only the
edited file is re-typechecked. Avoiding quadratic work comes from one shared global state and
per-file local passes.

### Research

- **Scope graphs.** Néron, Tolmach, Visser and Wachsmuth, "A Theory of Name Resolution", ESOP
  2015 ([Springer](https://link.springer.com/chapter/10.1007/978-3-662-46669-8_9)). Programs are
  graphs of scopes with declaration, reference, parent (P) and import (I) edges. Resolution is
  path search under a well-formedness regex and a path-specificity order, which encodes
  shadowing. The import fixed-point (an import's target is itself resolved) is part of the
  calculus. Beskid's rules map onto it directly: lexical parent edges (`resolve_item_in_scope`),
  `use` as I-edges, `pub mod` re-export as transitive I-edges with a distance order
  (`reexported_item_route`), and the private-module check as a well-formedness condition.
- **Scopes as Types.** van Antwerpen, Bach Poulsen, Rouvoet and Visser, OOPSLA 2018
  ([ACM](https://dl.acm.org/doi/10.1145/3276484)). Scope graphs used as the type
  representation for records, modules and classes. It introduces **Statix**, a declarative
  constraint language whose solver needs a sound scheduling of queries ("Knowing When to Ask",
  Rouvoet et al., OOPSLA 2020, [ACM](https://dl.acm.org/doi/10.1145/3428248)).
- **Incremental type-checking for free.** Zwaan, van Antwerpen and Visser, OOPSLA 2022
  ([ACM](https://dl.acm.org/doi/10.1145/3563303),
  [PDF](https://research.tudelft.nl/files/142378366/3563303.pdf)). Each unit's scope-graph
  fragment is built context-free. Cross-unit dependencies are the name-resolution *queries* a
  unit made. After an edit, only queries whose answers changed are re-confirmed, so only the
  affected units are re-checked. Reported speedups are up to 21x on real projects, with initial
  overhead under 10%. This is the formal version of "per-unit summaries plus lazy cross-unit
  lookup, invalidated by answer change", which is what Salsa's early cutoff provides.
- **Stack graphs.** Creager and van Antwerpen, "Stack graphs: name resolution at scale", EVCS 2023
  ([arXiv](https://arxiv.org/abs/2211.01224)); GitHub's
  [announcement](https://github.blog/open-source/introducing-stack-graphs/). These are scope
  graphs with symbol and scope stacks. Each file's graph is built **in isolation** and stored.
  Cross-file paths are stitched **at query time** from per-file partial paths. The stated
  motivation is that per-change reanalysis of dependents grows quadratically.
- **Incremental computation.**
  - Salsa ([book](https://salsa-rs.github.io/salsa/)): red-green verification with early cutoff.
  - Adapton: Hammer, Phang, Hicks and Foster, PLDI 2014
    ([ACM](https://dl.acm.org/doi/10.1145/2594291.2594324)). Demand-driven change propagation.
  - Mokhov, Mitchell and Peyton Jones, "Build Systems à la Carte", ICFP 2018
    ([ACM](https://dl.acm.org/doi/10.1145/3236774)). Salsa-style query systems are "suspending
    scheduler plus verifying traces" builds. The design point that matters for Beskid is
    **early cutoff**: a declaration summary that compares equal after a body edit stops
    invalidation.

### What Beskid lacks compared with all of them

1. An immutable, shared package scope. Beskid rebuilds it per analyzed unit.
2. A per-unit declaration summary that is independent of other units and of body contents.
   Collection works on the full AST and writes into global mutable state.
3. A single binding authority. Two implementations encode the same rules.

## Part 3: Options

Profile basis: `beskid check` compiler-sdk takes 8.3 s wall and 7.7 s user after round 3. At the
round-2 baseline the own-unit rule pass was 84% of samples. Round 3 removed shared declaration
resolution and canonicalize cost, and the report names the per-unit entry seeding as "the main
per-unit cost" that remains. It gives no fresh share for it. Every speedup below is therefore an
estimate that must be confirmed with the existing sampler (`scratchpad/stk.py` on the builder)
before work starts. The profile costs about one hour.

### (a) Minimal: shareable seeded state

**What changes**

1. Derive `Clone` for `Resolver`. Every field is already `Clone`.
2. Build one **base** resolver per assembly: seed it with *all* units collected in their logical
   modules (`excluded = None`, as `assembly_declaration_tables` already does). Record each unit's
   collection errors in the base, keyed by unit. Today they are cleared at `resolution.rs:147`,
   and the entry's own duplicates are reported only because it is collected again.
3. Per analyzed unit, clone the base. Do not collect the unit again. Bind the unit's
   already-collected top-level items into the root scope (the inverse of
   `bind_root_items_in_module`, so the entry still resolves "at the root" as today). Run
   `prepare_collected_program` for its `use` declarations. Resolve bodies. Re-emit its recorded
   collection errors.
4. Store the dependency declaration tables once, as `Arc<HashMap<PathBuf, ...>>` in
   `ResolutionTables`, instead of copying them into each resolution. Build the span index from
   the entry's own tables plus a shared, prebuilt dependency span index. Keying that shared index
   by source path also closes the collision noted in 1.6.
5. Use the same base for LSP find-references (`navigation.rs`) and drop the discarded
   `entry_resolution_with_db` call in `documents.rs:274`.
6. Optionally, compute `collect_known_type_names` once per assembly and stop cloning the module
   index per unit.

`im` or `rpds` persistent maps are not needed at first. A clone is a memcpy-and-allocate of the
item arena and module scopes, far cheaper than collection, which formats names, interns symbols,
canonicalizes paths and replays imports. Add persistent maps or an overlay (base
`Arc<SeededScope>` plus a per-unit delta for the module-scope inserts that
`prepare_collected_program` makes) only if the clone shows up in the profile. That option needs
a new dependency, which no profile supports yet.

**Files.** `resolve/resolver.rs`, `resolve/collect.rs` (error recording, about 40 lines),
`resolve_refs/entrypoints.rs` (new seeded entry path, about 60), `resolve/tables.rs` and
`span_index.rs` (shared dependency tables, about 120), `module_index/resolution.rs` (about 120),
`services/prepare/spine.rs` (about 30), `services/document/navigation.rs` (about 20),
`beskid_lsp/.../documents.rs` (about 5). Total **about 300-500 lines changed**, one crate plus
two call sites.

**Semantic risk.** Moderate, and it can be checked:

- The entry's items keep their *module* `ItemInfo` and symbol (the root-bound alias reuses the
  same `ItemId`), whereas today the entry is collected at the root. Qualified names in any
  diagnostic text for entry items can therefore change.
- The entry's module scope now also holds seed-time imports. Lookups of the form
  `OwnModule.Name` could find an imported name that was previously missing.
- Today a unit sees siblings that were collected *without* itself in the seed. Imports in other
  units of names declared in the entry now see the entry. This is the round-3 ruling ("units of
  one package see each other"), so the change is intended, not a regression.

Gate: the 61-project `beskid check --project <p> --offline --plain --json` byte-equivalence run
from the compile-time report. Any difference is either justified by the round-3 ruling or fixed.

**Tests.**

- `cargo test --locked -p beskid_analysis -p beskid_queries -p beskid_codegen --no-fail-fast`
  (1,743 tests).
- `beskid_tests_projects`, `beskid_tests_lsp` (references), `beskid_tests_mods`.
- New unit tests: an own-unit pass that reports entry duplicate items, and an entry referenced by
  its logical path from a sibling.

**Expected gain.** Removes the U x N collection and the U x N table merge and span sort. What
remains per unit is the clone plus O(|X|). If, as the report suggests, seeding and merging are
most of the remaining own-unit cost, `check` compiler-sdk should drop from 8.3 s to roughly 3-5 s.
This must be confirmed with the profile. LSP find-references goes from U x N to N, and immediate
edits stop paying an O(N) seed. There is no incrementality gain.

**Timeline.** About 0.5 day profiling, 1-1.5 days implementation, and 0.5-1 day for the
equivalence run and builder gates. **2-3 agent-days.**

### (b) Medium: per-unit declaration summaries plus a per-package DefMap (Salsa)

**What changes**

1. A tracked query `unit_declarations(SyntaxUnitInput) -> Arc<UnitDeclarations>`, the ItemTree
   equivalent. It holds the top-level and member items (kind, name, visibility, span,
   receiver), the `use` and `mod` declarations, and the file-scoped module path. It is built from
   the AST alone, compares equal when only bodies change, and gives early cutoff.
2. A tracked query `package_def_map(generation, assembly) -> Arc<DefMap>`. It contains the module
   tree, the item arena, the symbol registry and per-module scopes, with **fixed-point import and
   re-export resolution** over the summaries. That replaces today's order-dependent
   collection-time binding.
3. The `Resolver` becomes a body walker over `&DefMap` plus a small per-unit file scope (imports,
   aliases), Go-style. `collect.rs` (975 lines) is mostly replaced. `lookup.rs` and
   `types_paths.rs` switch to the DefMap API. `Resolution` refers to the DefMap through an `Arc`
   instead of owning `items` and `module_graph`, which touches the 28 consumer files (mostly
   mechanically).
4. The query layer's `SyntaxDependencyRegistry` import and module maps can be derived from the
   same DefMap. This is the first step toward one authority, but in this option the query
   layer's lookup rules stay as they are.

**Files and size.** `beskid_analysis/src/resolve/**` (about 2,000 of 3,499 lines rewritten),
`module_index/**` (about 300), the consumers of `Resolution` (about 400 mechanical), new
`beskid_queries` queries (about 400-600), and registry wiring in `db.rs` and `typed_program.rs`.
**About 2,500-4,000 lines.**

**Risk.** Higher than (a). The fixed-point import semantics differ from today's in-order binding
wherever two units import each other or a hub, and that is exactly where Corelib uses `pub mod`
hubs. Some 61-project diffs are likely and must be justified against `language-meta`
`modules-and-visibility` and the resolver contract (D-COMP-SEM-0007), or spec changes must be
written first. Collection lives in `beskid_analysis` but Salsa lives in `beskid_queries`, so
either the summary type moves down to `beskid_analysis` with the query wrapper in
`beskid_queries`, or `check` and the LSP must always go through the database (they already do,
apart from tests).

**Gain.** Everything (a) gives, plus incrementality. An edit inside a body leaves
`unit_declarations` equal, so the DefMap is reused and only the edited unit's bodies resolve
again. This is the rust-analyzer and Roslyn behavior for the LSP. `check` from cold is about the
same as (a).

**Timeline.** 8-12 agent-days, plus spec work if the import semantics change.

### (c) Full: one query-driven resolver

**What changes.** Delete the imperative `Resolver`. The query layer already resolves on demand,
per node and persisted (`resolved_item_tracked`, `qualified_module_resolution`, `locals.rs`), in
the Swift and rust-analyzer style. Move the remaining consumers onto it:

- Rule stages: name-resolution errors, `missing_imports`, `visibility` and unused imports. The
  unused-import rule needs `used_import_spans`, which only the imperative resolver produces
  today. These stages move into `beskid_queries` or read facts through the existing
  `SemanticFactAuthority` seam.
- LSP navigation, completion and references.
- `api.json` (needs `SymbolRegistry` and qualified names from query facts).
- Mod host span keys.

The resolver half of the "two implementations, keep in sync" comments goes away. Add (b)'s
per-unit summaries and a per-generation module-scope query *inside* `beskid_queries`, so that
lookups stop scanning `SyntaxIndex` and the mutex registry per call and become Salsa-tracked
dependencies, which also tracks reads properly. Scope graphs are a useful *specification* model
for writing the rules down: P, I and re-export edges with a specificity order, and the private
module as a well-formedness condition. A Statix-style engine is not needed. The Zwaan et al.
result is achieved here by Salsa's early cutoff.

**Size.** Delete about 3,500 (resolve) plus about 470 (module_index resolution). Port about 2,800
lines of rule stages and about 1,500 of document and doc services. Add about 1,000-1,500 lines of
new query facts (used imports, shadowing warnings, symbol identity). **About 5,000-7,000 lines
touched.**

**Risk.** High. Many rule diagnostics (E11xx resolve errors, unused-import and shadowing
warnings) are produced only by the imperative path today. Their wording and spans will change
unless they are reproduced exactly. The 61-project run will show diffs that each need a ruling.
The LSP must keep working through the transition.

**Gain.**

- One authority, which meets the "single resolver snapshot" requirement.
- No quadratic work: per-node queries, shared per-generation module scopes.
- The LSP gets the best incrementality, because references and diagnostics come from persisted
  per-node facts.
- `check` cold time ends at or below (a), because the rule pass stops resolving at all and reads
  facts that the query gate already computes for typing. The query gate already runs for every
  own unit (2026-10-09 ruling), so today `check` resolves every own unit twice, once per
  implementation.

**Timeline.** 15-25 agent-days in 3-4 slices: summaries and module scopes; rule stages; LSP and
doc; deletion. Each slice is gated by the 61-project equivalence run.

### Comparison

| | (a) shareable seed | (b) summaries + DefMap | (c) query-driven only |
|---|---|---|---|
| Lines changed | 300-500 | 2,500-4,000 | 5,000-7,000 |
| Crates | `beskid_analysis` (+2 call sites) | `beskid_analysis`, `beskid_queries` | `beskid_analysis`, `beskid_queries`, `beskid_lsp`, `beskid_cli` |
| Removes quadratic `check` work | yes | yes | yes (and double resolution) |
| `check` compiler-sdk (est., needs profile) | 8.3 s -> about 3-5 s | about (a) | at or below (a) |
| LSP incrementality | no (fewer seeds) | yes (body edits) | yes (per node) |
| Diagnostics-equivalence risk | low-moderate | moderate-high | high |
| Removes the duplicate implementation | no | partly | yes |
| Agent-days | 2-3 | 8-12 | 15-25 |

## Recommendation

1. **0.6.0: no resolver change.** The release is in qualification. `check` already went from 77 s
   to 8.3 s, and every option changes what the resolver binds for at least the entry unit. One
   change is a one-line fix with no semantic effect: removing the discarded
   `entry_resolution_with_db` call in `beskid_lsp/src/session/lifecycle/documents.rs:274`. Even
   that should go in only if the owner wants LSP fixes in the qualification window.
2. **0.6.1: option (a).** Profile first and confirm the seeding and merge share. Then implement
   the cloned base seed, the shared dependency tables and span index, and the single base for
   LSP references, and run the 61-project equivalence gate. It is cheap and reversible. It also
   removes the special case where the entry is collected twice, which (c) would have to remove
   anyway.
3. **0.7: option (c), starting with (b)'s summaries inside `beskid_queries`.** Option (b) as a
   standalone `beskid_analysis` redesign would create a third model of name binding next to the
   two that already have to be kept in sync. The industry pattern (rust-analyzer, Roslyn, Swift,
   K2) and the project's own 2026-10-09 ruling both point to one query-driven authority. Write
   the binding rules down as a scope-graph-style OpenSpec change before porting the rule stages,
   so that each equivalence diff can be judged against the spec instead of against the old
   implementation.
