import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />



This article documents **verification and traceability** for **Syntax domain model generation**.

## Traceability matrix
- Anchor: `compiler/crates/beskid_analysis/src/syntax/` — syntax item builders and node shapes.
- Anchor: `compiler/crates/beskid_analysis/src/beskid.pest` — grammar surface feeding parse output.
- Anchor: `compiler/crates/beskid_analysis/src/syntax/items/` — item-level parsers and metadata.

## Verification expectations
- Contract tests in `compiler/crates/beskid_tests` assert ordering, diagnostic codes, and merge behavior once implemented.
- Golden incremental traces (optional) validate invalidation when syntax edits move spans tied to meta registrations.

## Review cadence
- Update this bundle whenever public `Beskid.Compiler.*` shapes or host policies change.
