import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />



Implementation anchors:

- `compiler/crates/beskid_analysis/src/projects/assembly/`
- `compiler/crates/beskid_analysis/src/services/front_end.rs`
- `compiler/crates/beskid_codegen/src/services.rs`
- `compiler/crates/beskid_analysis/src/services/`
- `compiler/crates/beskid_cli/src/commands/build.rs`
- `compiler/crates/beskid_engine/src/services.rs`
- `compiler/crates/beskid_tests/src/projects/assembly.rs`

Traceability should include tests that assert semantic failures stop before backend stages.

## Mod phase ordering tests

When the mod host ships, add integration tests under `compiler/crates/beskid_tests/` that:

1. Install a test `PipelineObserver` collecting `PhaseStart` / `PhaseEnd` ids.
2. Assert the substring `parse` → `mod.load` → `mod.collect` → `mod.generate` → `semantic` → `mod.analyze` → `lower.ready` → `lower` appears in order for a workspace fixture with a transitive `Mod` dependency (see **[Project manifest contract / verification](/platform-spec/tooling/manifests-and-lockfiles/project-manifest-contract/verification-and-traceability/)** for manifest fixture layout).

Any change to `FULL_BUILD_PHASE_ORDER` or mod insertion rules **must** update these expectations in the same commit.
