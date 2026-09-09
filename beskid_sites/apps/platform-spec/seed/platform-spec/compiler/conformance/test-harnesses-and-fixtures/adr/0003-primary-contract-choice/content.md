import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

This feature explains how the project proves that implemented behavior remains stable release over release. It is organized into newcomer-friendly articles that move from model, to flow, to contracts, then practical verification and debugging guidance.

## Decision

The reference compiler **must** implement Test harnesses and fixtures as documented in this feature hub and its article bundle.

## Consequences

Changes require hub/ADR updates and verification anchor extensions.

## Verification anchors

- `compiler/crates/beskid_tests/src/analysis`
- `compiler/crates/beskid_tests/src/runtime`
- `compiler/crates/beskid_e2e_tests/src/tests/runtime_cases.rs`
