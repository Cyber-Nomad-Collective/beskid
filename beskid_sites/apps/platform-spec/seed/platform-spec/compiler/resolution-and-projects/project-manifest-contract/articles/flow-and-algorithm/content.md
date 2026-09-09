import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />

## Resolution flow

1. **Discover** `Project.proj` paths from workspace roots (`manifest_resolve`).
2. **Parse** into `ProjectManifest` (structural errors surface before graph insertion).
3. **Insert** node; run **graph validation** (cycles, Mod-only contract carriers, incompatible edges).
4. For host targets, **materialize transitive `Mod` dependencies** and ensure AOT artifacts exist (cache hit or build).
5. Hand off to **`CompilePlan`** and [stage ordering](/platform-spec/compiler/build-pipeline/stage-ordering/) for semantic and mod pipelines.

Author-oriented step-by-step validation (including optional `project.mod` keys) is specified in **[tooling / flow and algorithm](/platform-spec/tooling/manifests-and-lockfiles/project-manifest-contract/flow-and-algorithm/)** without repeating that prose here.

## Code anchors

- `compiler/crates/beskid_analysis/src/projects/manifest_resolve.rs`
- `compiler/crates/beskid_analysis/src/projects/compile_plan.rs`
- `compiler/crates/beskid_cli/src/commands/`
