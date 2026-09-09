import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />



## Why did a change pass locally but fail in CI?

Most often, one crate boundary changed but the corresponding fixture or downstream consumer was not updated. Re-run the nearest conformance suite and inspect cross-crate handoff points.

## Where should I start debugging?

1. Confirm the target requirement in this feature hub.
2. Step through ``beskid_analysis` -> parser/resolution/semantic leaves` and ``beskid_codegen` -> lowering contract leaves`.
3. Validate consumer behavior at ``beskid_abi` and `beskid_runtime` -> execution ABI/runtime leaves`.
4. Reproduce with ``beskid_tests` and `beskid_e2e_tests` -> conformance leaves`.

## How do I add a new rule safely?

Document the new contract in the relevant article, update implementation in the owning crate, and add a fixture proving both happy-path and failure-path behavior.
