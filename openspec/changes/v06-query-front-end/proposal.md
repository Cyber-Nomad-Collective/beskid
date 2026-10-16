## Why

Beskid 0.6 made the `beskid_queries` gate the sole semantic authority of `beskid check`,
`analyze` and the language server (`docs/reports/2026-10-05-v06-query-check-authority.md`, phase
3), but the executable path still ran the legacy `beskid_analysis` `TypeChecker` to produce a typed
result that lowering never read: codegen builds its `TypedProgram` from the rewritten syntax
assembly and reads every fact from the generation-bound queries. The legacy pass survived only as
a second gate, so constructs the query layer types and ISLE lowers (a named function as a value, a
function-typed field, a call on a call result, some generic inference) passed `beskid check` and
failed `beskid build` with "executable front end rejected a program the semantic gate accepted".
`for` over an array had the opposite gap: the gate accepted it and lowering had no rule. The entry
function `Main` of an application was reported as an unused private item because the rule exempted
only a lowercase `main` that is not the Beskid entry point.

## What Changes

- The query layer is the only front end for executable builds. The prepare spine runs one typing
  and legality authority, the query gate, on the diagnostics path and the executable path alike,
  and assembles the executable front end (rewritten syntax assembly plus composition authority)
  from which codegen builds `TypedProgram` and `CodegenInput`. The legacy type checker, its
  lowering preparation, the `EntryOnly` / `FullClosure` dependency typing policy, and the
  `lower.type_check` family of pipeline phases are removed. A program the gate accepts lowers or
  fails as an internal compiler gap; it is never re-judged by a second type system.
- **BREAKING**: the HIR-era phase ids `lower.ast`, `lower.resolve_pass1`, `lower.normalize`,
  `lower.resolve`, `lower.type_check` and the structural stage `semantic.error_handling` are no
  longer emitted. `lower` remains, as the boundary at which the executable front end exists.
- A standalone `.bd` file that belongs to no project is judged by the same query gate over a
  synthetic single-file `App` plan, not by the structural rules alone.
- `for id in expr block` over an array value is supported: the array is evaluated once, iterated
  in index order, and `id` is bound per iteration to the element, typed and GC-classified by the
  array's element identity. `for id in expr block` over a nominal iterator (a type whose `Next()`
  returns `Option<T>`) is supported too: the iterator is evaluated once and rooted for the loop,
  `Next()` is called before each iteration until it returns `None`, and `id` is bound to each
  `Some` payload; generic iterators and loops inside generic or contract-parameterized items are
  resolved per specialization. Outside such items, `beskid check` reports **E1215** for any
  iterable it cannot prove, so it accepts exactly the loops `beskid build` lowers.
- The program entry function of an `App` or `Test` target (`Main`, the one entry point) is never
  an unused private item (**W1504**) in its entry unit; the lowercase `main` exemption is removed.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `compiler--semantic-pipeline--type-system-pass-contract`: the typing authority is the query
  layer; the legacy `TypeResult` contract and the dependency typing policy are retired.
- `compiler--build-pipeline--stage-ordering`: the lowering phase ids are reduced to `lower.ready`
  and `lower`; `semantic.error_handling` is removed.
- `language-meta--evaluation--control-flow`: array and nominal iterator iteration are defined
  `for` forms.
- `language-meta--program-structure--modules-and-visibility`: the entry function exemption of
  W1504.

## Impact

Compiler: `beskid_analysis` loses `types/`, the authority-less prepare entry points, the stage-7
try precheck, and the typed session fingerprints; `beskid_queries` owns `ForIteratorFact` with
`ForIterableSource`, `ForIteratorProtocol`, `for_iterator_protocol` and
`for_iterator_specialization`; `beskid_isle` gains `ForIterableKind::Array` and
`ForIterableKind::Iterator` with `emit_array_for` and `emit_iterator_for`; `beskid_codegen` adapts
`array_for_fact` and `iterator_for_fact`, collects `Next()` specializations, and drops the dead type-descriptor
artifact path; `beskid_pipeline` drops the retired phase ids; the language server keeps its two
scheduling passes under its own `EditorPreparePass`.

Migration: none for well-typed programs. Programs that compiled only because the legacy checker
was silent where the gate reports an error already failed `beskid check`.

Catalog: run `validate-standard` and regenerate `openspec/catalog.json` after this change is
applied.
