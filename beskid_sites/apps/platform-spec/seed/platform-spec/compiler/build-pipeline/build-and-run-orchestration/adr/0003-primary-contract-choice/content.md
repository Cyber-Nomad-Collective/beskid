import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

This feature hub defines the normative contract for **build and run orchestration** and links newcomer-oriented reference articles.

## Decision

The reference compiler **must** implement Build and run orchestration as documented in this feature hub and its article bundle.

## Consequences

Changes require hub/ADR updates and verification anchor extensions.

## Verification anchors

- `compiler/crates/beskid_cli/src/commands/`
- `compiler/crates/beskid_engine/src/jit_module.rs`
- `compiler/crates/beskid_tests/src/runtime/jit.rs`
