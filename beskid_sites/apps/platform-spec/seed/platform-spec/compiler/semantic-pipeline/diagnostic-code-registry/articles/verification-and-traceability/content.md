import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />



Traceability anchors:

- Source of truth: `compiler/crates/beskid_analysis/src/analysis/diagnostic_kinds.rs`
- Rule emitters: `compiler/crates/beskid_analysis/src/analysis/rules`
- Verification script: `packages/trudoc/scripts/verify-diagnostics-spec-sync.mjs`

Suggested verification path:

1. Run semantic tests after registry changes.
2. Run diagnostic spec synchronization (`packages/trudoc/scripts/verify-diagnostics-spec-sync.mjs` via the website/trudoc verify scripts).
3. Validate at least one CLI and one LSP diagnostics scenario to confirm code identity parity.
