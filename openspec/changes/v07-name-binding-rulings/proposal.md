## Why

Beskid has two name resolvers. The legacy `Resolver` in `beskid_analysis/src/resolve/**` serves
rule-stage diagnostics, the language server and `beskid doc`. The query layer in
`beskid_queries/src/semantic_contract/**` is the semantic authority of `beskid check`, typing and
codegen (decision record `v06-query-front-end`). The 2026-10-14 rule inventory
(`docs/research/2026-10-14-resolver-generation.md`, Part 1) lists 136 name-binding rules. The two
implementations agree on 59. They differ visibly on 35. Of the rest, 37 exist in only one place
(10 legacy resolver, 20 query layer, 7 legacy rule stages) and 5 are specified but not
implemented. 45 rules have no spec text.

The owner wants the next resolver written in Beskid (`resolver-generation`, Summary). A third
implementation cannot agree with two that disagree. This change rules on each of the 77 open
rules before that work starts, and moves each ruling into normative text.

## What Changes

- One binding authority. The query layer's generation-bound facts are the only name-binding
  authority. The language server, `beskid doc` and every rule stage consume those facts. The
  legacy `Resolver` is retired when its consumers move (tasks section 3).
- One source unit per logical module path. A second source unit that has the same logical module
  path fails with **E1104**. Units do not merge into one module scope.
- Unit-scoped imports. A `use` declaration binds names only in its own source unit. It does not
  leak to sibling units or child modules. Import order has no effect.
- The source unit is the privacy boundary for items, members and fields. This extends the field
  privacy ruling of `v06-field-visibility` to all items and members. Member items do not inherit
  the visibility of their parent.
- `use Path;` binds the last segment, which can name a module or a public item. A `pub use` is a
  re-export edge. Ambiguous names fail closed with **E1104** at the reference.
- Unqualified value names follow one fixed order: locals, implicit-receiver fields and sibling
  methods, unit items and constants, imports, builtins. A function-typed local shadows a sibling
  method. Builtins are the outermost scope and items can shadow them.
- A generic parameter shadows a type of the same name (spec text kept; the query layer changes).
  A type name is looked up by name. A generic arity mismatch is **E1203** or **E1204**, not
  **E1201**.
- `self` is not a receiver name. The receiver is `this`. `self` is an ordinary identifier.
- `extend type` methods join the member set of the extended type. Method names are unique in the
  member set of a type. Overloading by arity is removed from the method-dispatch requirement.
- Enum constructors and enum patterns are spelled `Enum::Variant`, as the grammar and both
  implementations require. The `Enum.Variant` text in the enums spec is corrected.
- The query layer's `Dynamic` fallback for an unresolved qualified call whose receiver is an
  import binding is removed. Such a call fails closed with **E1101** or **E1108**.
- The superseded prelude requirement of the Corelib API shape spec is removed.
- **BREAKING**: some programs that compile today stop compiling (implicit `self`, a type
  shadowing a generic parameter, calls that reach codegen only through the `Dynamic` fallback,
  cross-unit calls of private methods through a local receiver). Some programs that fail today
  start to compile (`use` of an item, a qualified function read as a value, `extend type` method
  calls, `let` references that the legacy rule stage rejected with **E1106**). `design.md`
  lists each case. Beskid has no users to migrate (2026-10-12 owner ruling), so no compatibility
  path is kept.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `language-meta--program-structure--name-resolution`: `use` binding, unit-scoped imports,
  ambiguity, unqualified value order, type name lookup, qualified path forms, one source unit
  per module path, locals, constants, import diagnostics, macro expansion names, the binding
  authority.
- `language-meta--program-structure--modules-and-visibility`: the source unit privacy boundary,
  member visibility, private child modules, `pub use` re-exports and the re-export distance rule.
- `compiler--semantic-pipeline--resolver-contract`: the `use` import decision (D-COMP-SEM-0007)
  and the symbol identity decision (D-COMP-SEM-0016) restated without the legacy data structures.
- `language-meta--contracts-and-effects--contracts`: contracts as static call namespaces.
- `language-meta--type-system--enums-and-match`: the `Enum::Variant` spelling and the context
  type of a genericless constructor.
- `language-meta--type-system--method-dispatch`: the member set, the implicit receiver, sibling
  method calls and the removal of overloading.
- `language-meta--program-structure--extend-type`: private members stay inaccessible in the
  declaring unit too.
- `core-library--stability-and-api-shape--corelib-api-shape`: the prelude requirement is removed.
- `core-library--compiler-integration--corelib-injection-and-resolution`: builtin visibility and
  the canonical runtime corpus scope.
- `language-meta--composition--dependency-injection`: registry implementation paths bind type
  declarations.
- `language-meta--type-system--types`: a duplicate binding is reported once, as **E1102**.

## Impact

Compiler: `beskid_queries/src/semantic_contract/**` changes for the rulings that go against the
query layer (`design.md`, column "code to change"). The legacy `beskid_analysis/src/resolve/**`
and its rule stages are not changed in behavior; they are retired as their consumers move to the
query facts. The resolver written in Beskid implements this text, not either Rust
implementation.

Relation to open changes: this change builds on `v06-qualified-dependency-paths` (absolute
paths, root shadowing, cross-package **E1104**, qualified **E1107**), `v06-field-visibility`
(field privacy) and `v06-query-front-end` (query authority, **W1504** entry exemption). It does
not modify their requirements. Archive those changes first.

Corelib: the corelib sources that use `self` as an explicitly declared parameter are not
affected. Any method body that relies on an implicit `self` must use `this`.

Migration: none (no users). Fixtures and tests that encode a retired behavior move with the
implementation tasks.

Catalog: run `validate-standard` and regenerate `openspec/catalog.json` after this change is
applied.

Reversion: revert this change set. No persisted artifact records a binding rule.
