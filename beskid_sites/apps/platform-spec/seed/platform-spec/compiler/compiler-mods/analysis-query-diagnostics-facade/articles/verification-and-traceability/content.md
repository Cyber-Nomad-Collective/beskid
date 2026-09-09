import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />



This article documents **verification and traceability** for **Analysis, query, and diagnostics facades**.

## Traceability matrix
- Anchor: `compiler/crates/beskid_analysis/src/analysis/` — staged rules and semantic state.
- Anchor: `compiler/crates/beskid_analysis/src/resolve/` — resolution products queryable from facades.
- Anchor: `compiler/crates/beskid_lsp/src/diagnostics.rs` — diagnostic shaping for editor parity.

## Verification expectations
- Contract tests in `compiler/crates/beskid_tests` assert ordering, diagnostic codes, and merge behavior once implemented.
- Golden incremental traces (optional) validate invalidation when syntax edits move spans tied to meta registrations.

## Review cadence
- Update this bundle whenever public `Beskid.Compiler.*` shapes or host policies change.
