import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />



## Why did a change pass locally but fail in CI?

Most often, one crate boundary changed but the corresponding fixture or downstream consumer was not updated. Re-run the nearest conformance suite and inspect cross-crate handoff points.

## Where should I start debugging?

1. Confirm the target requirement in this feature hub.
2. Step through `Canonical package root `compiler/corelib/beskid_corelib`` and `Corelib path discovery in `compiler/crates/beskid_analysis/src/projects/graph/resolver.rs``.
3. Validate consumer behavior at `CLI embedding/install support in `compiler/crates/beskid_cli/build.rs` and `compiler/crates/beskid_cli/src/corelib_runtime.rs``.
4. Reproduce with `Integration checks in `compiler/crates/beskid_tests/src/projects/corelib``.

## How do I add a new rule safely?

Document the new contract in the relevant article, update implementation in the owning crate, and add a fixture proving both happy-path and failure-path behavior.
