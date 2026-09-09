import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />



This article documents **verification and traceability** for **Beskid.Compiler.SyntaxMirror facade**.

## Traceability matrix
- Anchor: `corelib` package module `Beskid.Compiler.SyntaxMirror` (generated + hand-authored surface).
- Anchor: `compiler/crates/beskid_analysis/src/syntax/` — authoritative internal model to mirror.

## Verification expectations
- Contract tests in `compiler/crates/beskid_tests` assert ordering, diagnostic codes, and merge behavior once implemented.
- Golden incremental traces (optional) validate invalidation when syntax edits move spans tied to meta registrations.

## Review cadence
- Update this bundle whenever public `Beskid.Compiler.*` shapes or host policies change.
