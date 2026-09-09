import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />



Implementation anchors:

- `compiler/crates/beskid_analysis/src/projects/compile_plan.rs`
- `compiler/crates/beskid_analysis/src/projects/workflow.rs`
- `compiler/crates/beskid_cli/src/commands/fetch.rs`
- `compiler/crates/beskid_cli/src/commands/lock.rs`

Traceability expectation: each lock policy branch is covered by fixture-based tests.
