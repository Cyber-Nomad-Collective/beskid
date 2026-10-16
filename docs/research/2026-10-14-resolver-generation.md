# Resolver generation: a resolver written in Beskid, measured

Date: 2026-10-14. Research and spike. No compiler source was changed and nothing was committed.
Companion to `docs/research/2026-10-14-resolver-redesign.md` (architecture and the Rust options).

Owner direction (relayed by the coordinator during this work): write the type/name resolver in
Beskid, because that makes the later type analysis easier. This document therefore puts a resolver
written in Beskid first. It also keeps the rule inventory and a short comparison with the generator
approaches (scope graphs, stack graphs, Datalog, attribute grammars), because their ideas carry
over to Beskid code.

Spike sources and raw outputs are in the session scratchpad
`/private/tmp/claude-501/-Users-mikserek-Projects-beskid/7da64e99-395f-4135-8f30-4243563f9470/scratchpad/resolver-spike/`:

| File | What it is |
|---|---|
| `dump/src/main.rs` (107 lines) | Rust syntax dumper: the compiler's own `beskid.pest`, rule and symbol interning |
| `beskid/resolver.bd` (1,480 lines) | Resolver v2 in Beskid, integer-interned (the measured one) |
| `beskid/resolver_v1.bd` (1,369 lines) | Resolver v1 in Beskid, string-keyed (kept for the performance comparison) |
| `out/refs-corelib.txt`, `out/refs-foundation.txt` | One binding fact per reference |
| `rules.md` | Full rule inventory with `file:line` citations (summarised in Part 1) |
| `research.md` | Primary-source notes on the generator approaches (summarised in Part 4) |
| `selfhost.md` | Survey of the Mod host and SDK for self-hosting (summarised in Part 3) |
| `oracle/lspq.py` | LSP client used for the failed oracle comparison (Part 2.6) |

## Summary

- **The job size is 136 name-binding rules** (about 125 that make up the core). The two existing
  implementations agree on 59 of them, differ visibly on 35, and implement 37 in only one place.
  Five more are specified but not implemented. 45 rules have no spec text. A rewrite must first
  decide the 35 divergences, because a third implementation cannot agree with both.
- **The spike worked.** A Beskid program of 945 rule lines (plus 500 lines of transport and
  driver code) implements 54 of the 136 rules. It ran on the v0.6 CLI on the builder and resolved
  the whole Corelib: 22 packages, 631 units, 792,350 syntax nodes, 107,336 path references.
  It bound 107,211 of them (99.88 %). All 125 unbound references are `__mod_semantic_*` and
  `__mod_query_*` intrinsics, which belong to one rule (K7) that the spike does not implement.
- **Correctness is checked only weakly.** A comparison with the current compiler's answers was
  attempted through the LSP and failed (Part 2.6). Instead:
  - Every item binding names a declaration whose name matches the spelled segment
    (43,289 of 43,289).
  - A 30-reference random sample was checked by hand against the source, and all 30 were right.
  - The string-keyed v1 and the integer v2 agree on all 17,591 Foundation references except
    the 78 primitive conversions that v2 newly classifies.

  Treat the coverage figure as "bound plausibly", not as "equal to the compiler".
- **Performance depends on how the code is written, not on the language as such.**
  - v1 used strings as keys, as most first drafts would. Body resolution of Foundation took
    11.1 s.
  - v2 interns every name and rule kind to `i64` and uses `I64Map` plus struct-of-arrays. The same
    work takes 0.2 s, which is 55 times faster.
  - On v0.6's runtime a string `==` costs 7.7 µs, a `StringMap` lookup 4.7 µs and a string
    interpolation 17 µs. An `I64Map` lookup costs 1.0 µs and an `i64` array read about 10 ns.
  - A `--release` build with the release runtime kit gave the same timings.
- **Corelib timings for v2.** All runs used `beskid run` (debug kit) on a shared builder with a
  load average of about 15:
  - collection: 0.19 s
  - import scopes: 0.16 s
  - body resolution: 1.46 s
  - re-resolving the bodies of the largest unit (`Core/Bsol/Schema.bd`, 44,817 nodes) against
    unchanged package tables: 72 ms
  - rebuilding that unit's import scope: 1 ms

  Reading and parsing the text dump took a further 11.6 s. An in-process transport (Part 3)
  removes that cost.
- **Language and runtime gaps found while writing it** (Part 2.5):
  - no `\t` or `\n` string escapes
  - `String.Join` is quadratic
  - `String.Trim` does not trim newlines
  - string operations are slow
  - `scope`, `skip`, `where` and `single` cannot be used as identifiers
  - `if a == b {}` with an empty block parses as a struct literal
  - one segfault around `Array.Of`, not root-caused
  - no interning in Corelib

  The workarounds were cheap, and none blocked the spike.
- **Measured authoring rate.**
  - v1: 23 minutes of agent wall time from an empty file to all of Foundation bound, including
    9 compile-and-debug iterations.
  - v2: a full rewrite for performance, 24 minutes.
  - The extrapolation in Part 5 uses only these measured rates and states what they do not cover.
    The largest uncovered costs are diagnostics parity and the 61-project equivalence gate.
- **Recommendation.** Build the resolver in Beskid as a separately built library that the Rust
  driver calls in process. It should take integer syntax arrays in and return integer binding
  facts out. Call it through three Salsa queries (unit summary, package scopes, unit bindings),
  so incrementality stays with Salsa. Do not use the native Mod worker path: it spawns a process
  per call and sends JSON over TCP for every callback.
- **Order of work.**
  1. Fix the language and runtime prerequisites.
  2. Run the Beskid resolver as a shadow next to the Rust authority, compared on Corelib and the
     61 projects.
  3. Make it the authority one rule group at a time.
  4. Only then move type analysis onto the same data.

  The stage gates and the Rust code each stage retires are in Part 6.

## Part 1: The rule list (the real size of the job)

Source: `rules.md` in the scratchpad. It was extracted from the specs (`name-resolution`,
`modules-and-visibility`, `resolver-contract`, corelib injection, contracts, enums, method
dispatch, extend type, types, DI), from the legacy `beskid_analysis/src/resolve/**` (3,499 lines)
with its rule stages, and from the query layer `beskid_queries/src/semantic_contract/**`
(about 2,670 lines of resolution). Every rule there has `file:line` citations.

Legend for the table below:
- `=` both implementations agree
- `DIV` both implement the rule but visibly differ
- `L`, `Q` implemented only in the legacy resolver, only in the query layer
- `R` only in a legacy rule stage
- `S` specified but not implemented

| Group | Rules | `=` | DIV | L | Q | R | S | Examples |
|---|---|---|---|---|---|---|---|---|
| A declarations, namespaces | 12 | 6 | 1 | 3 | 0 | 2 | 0 | one scope per module; first declaration wins (E1102); package-prefixed symbol qualifiers |
| B modules, files | 13 | 9 | 2 | 1 | 0 | 1 | 0 | path-derived module, homonymous collapse, `.generated/*.g.bd`, file-scoped `mod`, `pub mod` edges, inline `mod` |
| C `use` imports | 15 | 3 | 7 | 3 | 1 | 1 | 0 | alias = last segment; `as`; public items become unqualified; implicit `Core`; unused-import tracking |
| D re-exports | 7 | 3 | 2 | 0 | 1 | 0 | 1 | breadth-first `pub mod` distance rule; `pub use` (query only) |
| E qualified paths | 16 | 7 | 4 | 0 | 5 | 0 | 0 | alias expansion; absolute package-native paths; the four `lookup.rs` heuristics; `Type.Function` |
| F visibility | 11 | 2 | 5 | 1 | 2 | 1 | 0 | private by default; module privacy (legacy) vs unit privacy (query); field privacy |
| G locals, scopes | 14 | 10 | 2 | 1 | 0 | 1 | 0 | params, `let`, blocks, `for`, match arms, scoped `use`, lambdas, shadowing W1103 |
| H generics | 8 | 4 | 3 | 0 | 1 | 0 | 0 | function/type/impl generics; associated types; arity-keyed types (query) |
| I members | 11 | 2 | 4 | 1 | 4 | 0 | 0 | `this`; bare field via receiver; sibling method; `recv.M()`; contract members |
| J enums | 5 | 1 | 0 | 0 | 1 | 1 | 2 | `Enum::Variant`; patterns; contextual enum type |
| K builtins, Core, runtime | 10 | 5 | 3 | 0 | 2 | 0 | 0 | builtin manifest items; primitive conversions; SDK-only `__mod_*`; runtime corpus scope |
| L Mods, attributes, macros | 5 | 2 | 0 | 0 | 2 | 0 | 1 | macro registry; Mod-contributed items judged in their target unit |
| M type-level names | 6 | 3 | 1 | 0 | 1 | 0 | 1 | generic > type > alias homonymous; module in type position means its homonymous item |
| N composition (DI) | 3 | 2 | 1 | 0 | 0 | 0 | 0 | host and scope name spaces; registry paths |
| **Total** | **136** | **59** | **35** | **10** | **20** | **7** | **5** | |

91 rules cite some spec text, including informative provenance. 45 have none. The
re-export distance rule (D1) and the absolute namespace (E2) have no OpenSpec requirement at all.

These divergences need a ruling before any rewrite (details in `rules.md`):
1. **Scope model.** Legacy uses a shared per-module scope, so private items and private imports
   leak to sibling units. The query layer uses per-unit scopes.
2. **What `use` names.** Legacy accepts modules only. The spec says the final segment, which can
   be an item. D-COMP-SEM-0007 also requires imported enum constructors, which neither
   implementation provides.
3. **`pub use` as a re-export edge.** Only the query layer implements it.
4. **Ambiguity.** Legacy takes the first binding; the query layer fails closed. The error codes
   also differ (E1105 vs E1108).
5. **Members.**
   - Legacy does not bind member names.
   - The query layer binds inline and same-unit `impl` methods, but not `extend type` methods.
6. **`self`.** The query layer accepts `self`, but CT:202 forbids it.
7. **`let x = x`.** Legacy binds the initializer's `x` to the new local; the query layer binds it
   to the outer one.
8. **Generic and type precedence and arity keying.**
9. **Constants and runtime-corpus scope.**
10. **Builtin visibility.**

## Part 2: The spike

### 2.1 Shape

The owner direction and the coordinator asked for a resolver written in Beskid that is fed a
syntax dump from the current compiler.

1. **Transport (Rust, 107 lines).**
   - The dumper uses `pest_derive` on a copy of the compiler's own
     `compiler/crates/beskid_analysis/src/beskid.pest`.
   - It writes, per unit, a preorder node stream: `depth, rule id, start, end, symbol id`.
   - A header holds the rule table and the symbol table.
   - It only shapes the tree, with no binding logic: it drops keyword and doc tokens, splices doc
     wrappers, and collapses single-child precedence chains.
   - It includes `.generated/` units (B3) and interns module path segments.
   - On the Mac it parses all of Corelib (631 units, 0 parse failures) in 1.8 s.
2. **Resolver (Beskid, `resolver.bd`).** It runs in phases that correspond to the planned queries:
   - **Collection, per unit:** modules plus declarations, into struct-of-arrays tables with
     `I64Map` scopes.
   - **Package tables, once:** re-export tables, one per module (D1).
   - **Import scope, per unit:** aliases, unqualified imports, re-exports after direct imports,
     implicit `Core`.
   - **Body walk, per unit:** a scope stack of binder node ids, plus value, type and enum path
     resolution.
   - It writes one fact per reference: `unit | span | kind | tag | spelling | target`.
3. **Run.** `beskid run` (v0.6 CLI `dev-81fe8d4a09504939`, debug runtime kit) on builder slot w3
   through `.build/rgate-slot.sh` with `RGATE_NOSYNC=1`, so no cargo builds and no mirror sync.
   The release variant used `beskid build --release` with the w3 release prefix.

### 2.2 Rules implemented (54 of 136)

| Group | Implemented | Lines (code, excl. blank and comment) |
|---|---|---|
| A declarations | A1, A2, A4 (partial), A10, A12 | 88 |
| B modules/files | B1, B2, B3, B4, B5, B7, B9 | 65 |
| C+D imports, re-exports | C1, C2, C4, C5, C9 (order-free), C13; D1, D2, D3 | 109 |
| E+F qualified paths, visibility | E1, E2, E4, E5, E6, E7, E14; F1 (module privacy), F2 | 105 + 133 (value/type paths, shared with M) |
| G+H locals, scopes, generics | G1, G2, G4, G5, G6, G7, G8, G9, G13; H1, H2, H3, H5 | 75 + 188 (body walk) |
| I members | I1, I3, I4 (bare field via receiver, unique sibling method) | 20 |
| J enums | J1 (variant existence, no arity), J3 | 34 |
| K builtins | K1, K2, K3 | 29 |
| M type names | M1, M2, M5 | (in E+M above) |
| E8/E10 approximation | `Type.Member` / `Contract.Member` recorded as "type-qualified" (tag 7, 36 references) | (in E+M) |
| Infrastructure | transport loader, rule table, report, driver | 500 |
| **Total** | **54 rules** | **945 rule lines + 500 infrastructure** |

Not implemented:
- All diagnostics. The spike records failure tags, not E-codes, messages or spans.
- Unused-import tracking (C10) and shadowing warnings (G11).
- Duplicate reporting.
- Member resolution that needs types (I5-I11, H7, E12, E13, J2).
- Unit-level privacy (F3-F8).
- `pub use` (D4, D5).
- Ambiguity failures (C6, E16).
- Mod and macro rules (L).
- SDK and runtime admission (K4-K7).
- Composition (N).

### 2.3 Coverage

| Reference kind (Corelib, 107,336 references) | Count |
|---|---|
| local or parameter (tag 1) | 46,106 |
| module item (tag 2) | 36,547 |
| primitive type or conversion (tag 4) | 16,745 |
| enum variant `E::V` (tag 10) | 6,706 |
| generic or associated type (tag 3) | 984 |
| sibling method (6), receiver field (5), type-qualified (7) | 62 / 25 / 36 |
| **unbound** | **125**, all `__mod_semantic_*` / `__mod_query_*` intrinsics in `compiler-sdk` (rule K7) |

Foundation (127 units, 116,160 nodes, 17,591 references) binds 100 %.

### 2.4 Performance

The tables below show phase times in ms, from the program's own monotonic clock. The machine was
the builder: shared, load average about 15.

| Phase | Foundation v1 (strings) | Foundation v2 (`i64`) | Corelib v2 |
|---|---|---|---|
| read dump file | 640 | 451 | 3,421 |
| parse text transport | 1,880 | 1,185 | 8,178 |
| collect declarations and module tables | 224 | 33 | 193 |
| import scopes, all units | 240 | 22 | 160 |
| **body resolution, all units** | **9,870 to 11,165** | **199** | **1,463** |
| re-resolve the largest unit's bodies (×1) | 760 (8.5k nodes) | 11 (8.5k nodes) | 72 (44.8k nodes) |
| rebuild the largest unit's import scope (×1) | 6 | 0.45 | 1.0 |

Micro-benchmarks, 100,000 operations each (debug kit; the `--release` build gave the same):

| Operation | Total ms | Per operation |
|---|---|---|
| `StringMap.GetOr` with an interpolated key `"${k}\|Name"` | 2,811 | 28 µs |
| string interpolation `"${k}\|Name"` alone | 1,738 | 17 µs |
| `string ==` against a 17-character literal | 766 | 7.7 µs |
| `StringMap.GetOr` with a constant key | 469 | 4.7 µs |
| `I64Map.GetOr` | 99 | 1.0 µs |
| `i64[]` reads (2 per iteration) | 1 | about 5 ns |

What this means:
- A Beskid resolver must work on integers. It needs a symbol interner on the Rust side of the
  transport, rule kinds as small integers, and `I64Map` or dense arrays as scopes.
- For comparison, the Rust resolver needs milliseconds for Foundation (redesign doc, 1.2).
- v2 body resolution of all of Corelib (1.46 s) is in the range the redesign doc reports for
  `beskid check` compiler-sdk after round 3 (8.3 s total).
- Per-keystroke re-resolution of a 45k-node unit (72 ms) is usable for the LSP. It is not as good
  as rust-analyzer.
- Text parsing of the dump (8 s) is an artefact of the spike. An in-process transport passes
  arrays and has no parsing step.

### 2.5 What did not work, and the gaps it exposed

These are in the order they were hit. All are reproducible from `resolver_v1.bd` and the run logs.

1. **Reserved words.** `scope`, `skip`, `where` and `single` cannot be identifiers. They are
   keywords in `beskid.pest:68`, for DI and tests. Each cost one compile round-trip.
2. **Empty block in a condition.** `if c == skipNode { /* comment */ } else ...` failed to parse:
   `skipNode {}` is read as an empty struct literal. The error message ("recovery: inserted
   parser-expected block") does not point at the cause.
3. **No `\t` or `\n` escapes.** `StringEscape` in `beskid.pest:236` only has `\"`, `\\` and
   `\${`. `String.Tab()` and `String.Newline()` work around it.
4. **`String.Trim` keeps the trailing newline.** A file name built from a trimmed file read
   silently pointed at a missing file. The read then failed silently and every phase ran on zero
   units. A trap (exit 132) came much later, in unrelated code.
5. **A segfault (exit 139)** at `while Array.Len<i64>(frontier) > 0` after
   `mut i64[] frontier = Array.Of<i64>(module)`. Replacing `Array.Of` with `Empty` plus `Append`
   fixed it. **Not root-caused.** It may be a `bulk` parameter or GC rooting problem and should
   be filed.
6. **`String.Join` is quadratic** (`Core/String/Transform.bd:93-105` concatenates left to right).
   Joining 16k report lines did not finish in 10 minutes. A divide-and-conquer join took seconds.
   `StringBuilder.AppendText` copies byte by byte with `Array.Append` (`Builder.bd`).
7. **String-keyed maps and string comparisons are 5 to 30 µs each.** This forced the v2 rewrite
   (Part 2.4).
8. **Style lint.** PascalCase fields in the `Rules` struct raise 51 naming warnings. These are
   harmless, but a generated rule-id table should use constants.

The things that worked without trouble:
- generics (`I64Map<i64>[]`, `StringMap<V>`)
- `match` on `Result`
- `for x in array`
- recursion (tree walk, depth up to about 60)
- in-place array mutation through struct fields (`c.stack[c.sp[0]] = b`)
- `I64Map` of arrays
- the 1,480-line single file compiled in about 3 s

### 2.6 The oracle comparison that failed

The plan was to ask the current compiler for its answers through the LSP. `textDocument/definition`
is backed by the query layer's `syntax_definitions` (`beskid_lsp/src/features/definition/handler.rs`).
The LSP was run on 437 stratified Foundation samples.

- **Run 1: standalone copy of the package.** Every unit reported "unknown type `Result`" and
  similar errors: no Corelib context was assembled. 431 of 437 requests returned nothing, and
  the other 6 were declaration self-hits.
- **Run 2: the builder mirror's `CoreLib.bws`,** limited to 429 samples from the 121 of 126 files
  that are byte-identical between the Mac and the mirror.
  - The workspace diagnostics were clean for Foundation, so the workspace path does resolve.
  - The server logged "project preparation failed: mod `serialization_mod` ... failed to invoke"
    twice.
  - Definition requests then did not answer within the 25-minute client limit.

About 45 minutes were spent on this. A proper oracle should come from Rust instead: a
`beskid_queries` test helper that dumps `(unit, span) -> declaration` for a project. That needs a
cargo build and was outside this task's rules. Until it exists, the correctness evidence is the
three weaker checks in the Summary.

## Part 3: Architecture for a Beskid resolver

### 3.1 Where it runs

- **Not as a native Mod.** Evidence from `selfhost.md`:
  - Mods run through `beskid dev native-mod-worker`, one process per call
    (`mod_host/native_bridge.rs:21-75`).
  - Every SDK callback (`Children`, `Span`, `As*`) is a JSON message over localhost TCP
    (`native_services.rs`, `native_channel.rs`), capped at 16 MiB.
  - The SDK exposes only the entry unit's AST (`Compilation.bd:15-23`).
  - The semantic callbacks themselves use the Rust resolver (`mod_shapes.rs:160-175`).
  - A resolver touches every node, and the spike shows it needs bulk arrays, not per-node calls.
- **As an in-process library.**
  - A Beskid package (for example `corelib/packages/resolver` or `compiler/resolver/`) is built
    with `beskid build --kind Shared` and exports C-ABI entry points.
  - The export direction already exists: `[Export(Abi:"C", Symbol:..)]` (Glue layer A,
    `docs/research/2026-10-13-glue-design-review.md`; `beskid_tests_interop` `ManualExport.bd`,
    `export_caller.rs`).
  - Byte buffers already travel as `OwnedView { pointer, length, token }`, and `GlueProcess`
    (`glue/loader.rs`) already pins images by digest.
  - `beskid_queries` loads the library once per process and calls it directly.
- **Shipped like the runtime kit.** The library is a content-keyed, digest-pinned artifact in the
  toolchain prefix next to `lib/beskid-runtime/abi-5/<target>/<profile>`, with the same
  qualification as the kit and the prebuilt Corelib Mods.

### 3.2 Bootstrap

The resolver is Beskid code, so compiling it needs a resolver.

| Option | How | Cost | Verdict |
|---|---|---|---|
| A. Rust stage0 forever | Keep a Rust resolver only to compile `resolver.bd` | Two resolvers to keep in sync, which is the problem we want to remove | Reject as an end state; acceptable as the transition (stage S1 below) |
| B. Previous release as stage0 (rustc model) | Release N's CI compiles the resolver with release N-1's shipped resolver library (stage1), then compiles it again with stage1 (stage2), and requires the stage1 and stage2 **facts** on Corelib and the 61 projects to be identical | `resolver.bd` may only use language features release N-1 compiles; one pinned rollback artifact per target | **Recommended** end state |
| C. Committed binary per target | Check the library into the repo | Opaque binaries in git; no reproducibility | Reject |

Notes for option B:
- Compare binding facts, not image bytes. Cranelift output is not yet shown to be reproducible.
- The comparison is the same fact dump the spike produces, so the shadow tooling from stage S1
  becomes the bootstrap check.
- The Woodpecker pipeline (`scripts/ci/`) already builds kits per target; the resolver library
  is one more target product.
- To test a resolver change in a developer loop:
  1. Build the new library with the installed toolchain.
  2. Point an environment variable (for example `BESKID_RESOLVER_LIB`) at it.
  3. Run `beskid check --json` on the 61 projects and on Corelib and diff the results.

  This is the same loop as `BESKID_RUNTIME_PREFIX` for kits.

### 3.3 Data exchange

The spike's text dump is the logical format. In production it becomes arrays.

- **In, per unit:**
  - `kind[]`, `start[]`, `end[]`, `sym[]`, `parent[]`, `firstChild[]`, `nextSibling[]` as `i64`
    buffers built from the pest AST in Rust.
  - The rule table is a stable enumeration generated from `beskid.pest`, as `beskid_ast_derive`
    already does for the SDK nodes.
  - Rust keeps the string interner. Beskid sees only symbol ids, and its symbol table is a
    read-only view for diagnostics text.
- **Out, per unit:**
  - a summary: items (`sym`, `kind`, `pub`, `node`, `target module`), module path, `use` and
    `mod` declarations;
  - bindings: `node -> (tag, target item or binder)`;
  - diagnostic records: code, primary span, argument symbol ids. Rust renders the messages, so
    wording stays in one place and parity with today's text is checkable.
- **Out, per package:**
  - the def map: module tree, item arena, declaration scopes;
  - one re-export table per module;
  - per-unit import scopes.

  All of these are integer arrays plus `I64Map`s serialised to arrays.

### 3.4 Fit with Salsa (incrementality kept)

Three tracked queries in `beskid_queries`, each a pure call into the library. These are the
spike's phases.

1. `unit_summary(SyntaxUnitInput) -> Arc<UnitSummary>`.
   - It reads only the unit and is equal when only bodies change, which is the early cutoff
     (rust-analyzer's ItemTree).
   - Measured cost: about 0.3 ms per unit (Corelib collection 193 ms / 631 units).
2. `package_scopes(generation, assembly) -> Arc<DefMap>`.
   - It reads all summaries and is recomputed only when a summary changes.
   - Measured cost: about 0.35 s for all of Corelib (collect plus re-export tables plus imports).
3. `unit_bindings(SyntaxUnitInput, DefMap) -> Arc<UnitBindings>`.
   - A body edit recomputes only this query for the edited unit.
   - Measured cost: 72 ms for a 44.8k-node unit, 11 ms for an 8.5k-node unit.

This also removes the quadratic per-unit seeding (redesign doc 1.6). The def map is built once
and shared read-only, and the spike never re-collects other units per analyzed unit. The mutex
`SyntaxDependencyRegistry` becomes a by-product of `package_scopes`, so Salsa tracks the reads
(redesign doc 1.5).

### 3.5 Shared with type analysis (the owner's motivation)

The binding facts are exactly what a type checker indexes. In the spike they are `resTag[]` and
`resTarget[]` keyed by node id, over the struct-of-arrays item arena.

- **One arena.** Item ids, module ids and symbol ids are the same integers in the resolver and the
  checker. The checker adds `nodeType[]` (a type id per expression node) next to `resTarget[]`.
  It also adds a type table: nominal item id, generic arguments as type-id arrays, function and
  array types.
- **Members move into typing.** The rules the spike could not do (I5-I11 receiver methods and
  fields, H7 bounded receivers, E12/E13, J2 contextual enum type) are lookups in a *type's* member
  scope. This is the "Scopes as Types" idea (van Antwerpen et al., OOPSLA 2018,
  doi:10.1145/3276484): each nominal type's member table is a scope in the same tables. The
  resolver builds the member scopes from summaries (fields, inline methods, `impl` and
  `extend type` methods). The checker queries them once it knows the receiver type.
- **Scheduling.** Statix needs critical-edge scheduling because resolution and typing interleave
  (Rouvoet et al., OOPSLA 2020, doi:10.1145/3428248). Beskid avoids most of that: module and
  lexical scopes are complete after `package_scopes`, and only member lookups wait for types.
  This is the Kotlin K2 phase order described in the redesign doc.
- **Proof that the data model carries typing.** The spike already does a little type-directed
  work through the same arrays: `ImplBlock` receiver resolution sets the current type for
  field and sibling lookups.

### 3.6 Language and runtime features needed, checked against v0.6

| Need | v0.6 status | Evidence | Gap |
|---|---|---|---|
| Hash map with integer keys | `I64Map<V>` works, 1.0 µs per get | spike micro-benchmark | Faster hashing or dense-id arrays would help |
| String-keyed map | `StringMap<V>` works, 4.7 µs per get | same | Too slow for hot paths: intern instead |
| Sets | `Set`, `I64Map<bool>` | `Collections/Set.bd` | none |
| Growable arrays, in-place mutation | `Array.Append` amortized, `arr[i] = v` through fields | spike | none |
| Iteration | `for x in array`, `Keys()` | spike | none |
| Generics, nested (`I64Map<i64>[]`) | works | spike | none |
| `match`, enums with payloads | works | spike (`Result` arms) | none |
| String interning | none in Corelib | `selfhost.md` | Do it on the Rust side of the transport |
| String escapes `\t \n` | missing | `beskid.pest:236` | Add to the grammar |
| `String.Join`, `StringBuilder` | quadratic, byte-by-byte | `Transform.bd:93`, `Builder.bd` | Fix in Corelib |
| `String.Trim` of newlines | does not trim | spike | Fix or document |
| `Array.Of` (bulk) | segfault in one use | spike, not root-caused | File and fix |
| Arenas, bump allocation | none; GC is non-moving mark/sweep (`Runtime/Mem/Gc.bd`) | `selfhost.md` | Struct-of-arrays avoids most allocations, so it is not blocking |
| In-process C-ABI export of `i64` buffers | Export exists (Glue layer A); bulk `i64` view not shown | glue design review | Prerequisite P2 below |
| Compile-time constants for rule ids | `const N = <int>;` is integer-only, per module | grammar `ConstantDefinition` | Generate a `RuleKind` constants file from `beskid.pest` |

## Part 4: The other approaches, briefly

Full citations are in `research.md`. Line counts come from shallow clones made on 2026-10-14.

| Approach | Status (2026-10) | Incremental | Rule size for comparable languages | What to take into Beskid |
|---|---|---|---|---|
| Scope graphs / Statix (Néron et al. ESOP 2015, doi:10.1007/978-3-662-46669-8_9; Scopes as Types OOPSLA 2018; Knowing When to Ask OOPSLA 2020; Incremental Type-Checking for Free OOPSLA 2022, doi:10.1145/3563303) | Rust `scopegraphs` 0.3.3 (2024-11-22), README says "not ready for production", no users | Not in the Rust crate; Statix (Java) confirms queries per unit | `java.mstx` (Java 11 subset): 1,480 lines | Write the rules down as P/I edges, a path regex and a label order. Shadowing is a label order. That gives the OpenSpec change for the 35 divergences a precise form |
| Stack graphs + TSG (Creager and van Antwerpen, EVCS 2023, doi:10.4230/OASIcs.EVCS.2023.8) | **Archived 2025-09-09**; crates pinned to tree-sitter 0.24 | Per file, by design | Python 1,377 (938 code), Java 1,366 (1,017), JavaScript 5,058, TypeScript 6,297 lines | Nothing to adopt. It cannot do type-directed members; TypeScript skips 20 tests, mostly generics |
| Datalog: `ascent` 0.8.1 (CC 2022, doi:10.1145/3497776.3517779), `crepe` 0.2.0, datafrog, differential-dataflow 0.25.1, DDlog (archived 2023), Soufflé 2.5 | ascent active | **ascent: no** (author, issue #30); differential-dataflow yes but heavy | Lexical shadowing is about 6 rules | The fixed-point import resolution that Beskid needs for D1 and `pub use` cycles is a small Datalog fixpoint. Writing it as a worklist loop in Beskid is what the spike's re-export BFS does |
| Reference attribute grammars: JastAdd/ExtendJ (OOPSLA 2007, doi:10.1145/1297027.1297029), Kiama, Silver | ExtendJ active; no Rust RAG library | Memoized, demand-driven | ExtendJ Java 4 name analysis: 3,944 lines | The demand-driven lookup attribute maps onto Salsa tracked functions |
| Hand-written query-driven (rust-analyzer, Swift request evaluator) | Production | Salsa plus ItemTree early cutoff | rust-analyzer `nameres/` 4,552 lines excluding tests, about 9-10k with ItemTree and Resolver | The architecture of Part 3.4 is this one, with the rule bodies in Beskid |

The question was whether to semi-generate the resolver. No generator in the list fits Beskid's
pipeline (pest, Salsa, Rust), is maintained, and is incremental at once. The DSLs mainly save the
lexical-scoping boilerplate. In the spike that is 263 of 945 lines (G and H plus the body walk),
written in about 10 minutes. The hard parts are the import fixpoint, the path heuristics and the
divergence rulings, and those are not shorter in a DSL.

## Part 5: Effort from the spike's measured rates

### What was measured

| Item | Value |
|---|---|
| Rules implemented | 54 |
| Rule code | 945 lines (17.5 lines per rule) + 500 infrastructure |
| v1 authoring, empty file to all of Foundation bound | 23 min, including 9 compile and debug iterations (about 1.5 min per builder round-trip) |
| v2 rewrite (same rules, integer data model) | 24 min |
| Corelib run plus the generated-unit and primitive fixes | about 10 min |
| Oracle attempt (failed) | about 45 min |
| Transport dumper | about 10 min |

### Arithmetic

1. **Rule code for the remaining rules.**
   - Remaining rules: 136 - 54 = 82. Of those, 13 are composition, Mod/macro and runtime-admission
     rules that may stay in Rust, which leaves 69 resolver rules.
   - Size at the spike's density: 69 × 17.5 ≈ 1,210 lines.
   - Type-directed member rules (I5-I11, H7, E12, E13, J2: 12 rules) belong to type analysis.
     That leaves about 57 rules, or about 1,000 lines, for the resolver proper.
   - Total resolver: about 1,950 rule lines plus about 600 infrastructure lines. That is roughly
     a third of today's two Rust implementations combined (3,499 + about 2,670), which encode the
     rules twice.
2. **Authoring time for those rules at the spike rate.**
   - Spike rate: 54 rules in 23 min (v1), so about 0.43 min per rule.
   - 57 × 0.43 ≈ 25 min.

   **This number is not an estimate of the project.** The spike's 54 rules were the regular
   ones, written from a fresh reading of two implementations. It did not include:
   - **diagnostics with exact codes, spans and arguments.** These are the E11xx, E12xx and E15xx bands;
     the codes were not counted. Not measured.
   - **the 35 divergence rulings.** Each is an OpenSpec decision; owner time, not agent time.
   - **the equivalence gate.** The 61-project `beskid check --json` run takes about 1 builder
     hour per iteration (compile-time report). The number of iterations needed is unknown until a
     first shadow diff exists.
   - **porting the 124 existing tests** (15 resolver unit tests, 75 assembly, 34 rules) to fact
     snapshots.
   - **the Rust side:** transport arrays, the library loader, the three Salsa queries, diagnostic
     rendering, and the bootstrap pipeline.
3. **What to measure next to replace the unmeasured rows** (each a bounded experiment):
   - **Diagnostics rate.** Implement E1101, E1201, E1105 and E1107 with spans in the spike, then
     time that and diff against `beskid check --json` on Corelib's negative fixtures.
   - **First shadow diff.** Add a Rust test helper that dumps the query layer's
     `(unit, span) -> declaration`. Diff it against `refs-corelib.txt`. The count of differing
     references, bucketed by rule, sizes the equivalence work.
   - **Transport cost.** Build the `i64` arrays in Rust from `SyntaxIndex`. Expect milliseconds;
     confirm.

The only effort figures in this document are these measured ones, and the arithmetic above
extends them only to rule code. Everything else is listed as unmeasured.

## Part 6: Staged plan

### Prerequisites

Each prerequisite is a separate, small change with its own test.

- **P1. Language and Corelib.**
  - `\t` and `\n` escapes in the grammar and OpenSpec.
  - Linear `String.Join` and `StringBuilder`.
  - `String.Trim` newline behaviour.
  - Root-cause and fix the `Array.Of` segfault.
  - Generate a `RuleKind` constants file from `beskid.pest`.
- **P2. In-process bulk ABI.**
  - `[Export(Abi:"C")]` entry points that take and return `i64` buffers as owned views.
  - A loader in `beskid_queries` built on `GlueProcess` admission.
  - Test: round-trip 10^6 `i64` values in under 10 ms.
- **P3. Runtime string performance.** Not blocking if the resolver interns, but 7.7 µs per string
  `==` will hurt any Beskid compiler code. Profile `__str_eq` and `__str_concat` and the hashing
  in `Hash.String`.
- **P4. Oracle.** The Rust fact-dump helper from Part 5.3.

### Stages

| Stage | Release | What changes | What it replaces | Gate |
|---|---|---|---|---|
| S0 | 0.6.x | Owner rulings on the 35 divergences, written as an OpenSpec change in scope-graph form (P/I edges, label order, well-formedness); P1-P4 | nothing | `openspec validate`; P2 round-trip test; the Rust fact dump runs on Corelib |
| S1 shadow | 0.7 early | The resolver library is built in the toolchain pipeline. `beskid check` calls the three queries and **diffs** their facts against the query layer, without using them | nothing | Diff count trends to 0 on Corelib and the 61 projects; every remaining diff is an approved ruling |
| S2 authority: declarations, modules, imports | 0.7 | The Beskid `unit_summary` and `package_scopes` replace `beskid_analysis::resolve::collect` (975 lines), `module_index/resolution.rs` (467) and `SyntaxDependencyRegistry` | about 1,800 Rust lines | 61-project `beskid check --json` byte-equivalent except approved rulings; `cargo test -p beskid_analysis -p beskid_queries -p beskid_codegen` (1,743 tests); `beskid_tests_projects`, `beskid_tests_lsp`, `beskid_tests_mods` |
| S3 authority: bodies and diagnostics | 0.7 or 0.8 | `unit_bindings` replaces `resolve_refs/**` and the query resolution cluster (`resolution.rs`, `locals.rs`, `local_type_resolution.rs`, `legality/value_paths.rs`); Rust renders diagnostics from the records | about 3,500 Rust lines | same, plus LSP find-references and go-to-definition tests |
| S4 bootstrap switch | after S3 | Stage0 becomes the previous release's library (option B); the CI stage1/stage2 fact-identity check | the Rust stage0 path | stage1 and stage2 facts identical on Corelib and the 61 projects |
| S5 type analysis | 0.8+ | Member scopes and `nodeType[]` in Beskid (Part 3.5); migrate typing rule groups the same way, shadow first | parts of `semantic_contract/{calls,layouts,legality}` | as S1-S3 |

Independent of this plan:
- Option (a) from the redesign doc (the shareable seeded state, about 300-500 Rust lines)
  removes the quadratic `check` cost now.
- It does not conflict with S0-S5, because S2 deletes the code it touches. It is worth doing
  only if 0.7 is far away.

## Commands used

Builder runs went through slot w3 without a cargo build:

```sh
# Run the resolver (debug kit), from the Mac
RGATE_NOSYNC=1 SLOT=w3 .build/rgate-slot.sh rspike-v2e --sh \
  '. /workspace/v06-w3-state/env.sh; cd /workspace/resolver-spike/beskid; $BESKID_CLI_BIN run resolver.bd'

# Release variant
RGATE_NOSYNC=1 SLOT=w3 .build/rgate-slot.sh rspike-rel2 --sh \
  '. /workspace/v06-w3-state/env.sh; export BESKID_RUNTIME_PREFIX=/workspace/v06-w3-state/release-prefix-81fe8d4a09504939 BESKID_RUNTIME_KIT_PROFILE=release; cd /workspace/resolver-spike/beskid; $BESKID_CLI_BIN build --project Resolver.bproj --offline --release --output resolver-rel; ./resolver-rel'
```

On the Mac, the dumper ran with `CARGO_TARGET_DIR` inside the scratchpad:

```sh
cargo build --release
target/release/syndump data/corelib.syn <pkg>=<src>...
```

The Mac's installed `beskid` is 0.5.2, which lacks `StringMap`, `I64Map` and the v0.6 module
layout, so all Beskid runs used the v0.6 CLI on the builder.
