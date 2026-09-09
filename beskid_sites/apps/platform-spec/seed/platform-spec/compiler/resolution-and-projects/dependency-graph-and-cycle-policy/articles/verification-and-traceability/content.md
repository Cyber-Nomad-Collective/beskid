import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />



This article documents **verification and traceability** for **dependency graph and cycle policy** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_tests/src/projects/corelib/layout.rs` models multi-project dependency layouts.
- `compiler/crates/beskid_tests/src/projects/corelib/mod.rs` checks graph expectations.
- `compiler/crates/beskid_cli/src/commands/doc.rs` consumes resolved dependency context for docs.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
