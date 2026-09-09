import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

`beskid test` previously discovered `test` items from pre-rewrite AST and invoked JIT entrypoints by short names, diverging from `beskid run` assembly, linking, and pipeline phases.

## Decision

| Rule | Detail |
| --- | --- |
| Discovery | Enumerate `test` definitions from the **post-rewrite** entry program produced by `prepare_compilation` |
| Entrypoints | Resolve and execute tests by **`qualified_name`** (nested inline modules included), matching resolution item names |
| One prepare per target | Each selected test target **must** run through one `PreparedCompilation` (or shared prepare + per-test `LinkPlan` entry) before JIT; ad-hoc `lower_source` on raw buffer text is forbidden for project-backed tests |
| Pipeline | `beskid test` **must** emit the same `beskid_pipeline` phases as `beskid run` through the shared observer |

## Consequences

Corelib and workspace test matrices exercise the same spine as production run/build. Test filtering (`--include-tag`, `--group`) applies after post-rewrite discovery.

## Verification anchors

- `compiler/crates/beskid_cli/src/commands/test.rs`
- `compiler/crates/beskid_codegen/src/linking/plan.rs`
- `compiler/corelib/ci/run_corelib_tests.py`
