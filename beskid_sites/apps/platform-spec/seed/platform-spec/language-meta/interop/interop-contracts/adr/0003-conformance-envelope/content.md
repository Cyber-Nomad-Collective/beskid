import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Hosts and compilers need a shared compatibility story at boundaries.

## Decision

This feature **must** specify symbol identity, type-shape classes, call-shape classes, ownership obligations, error/unwind semantics, and a **conformance envelope** (versioning and forward compatibility) for compatibility claims.

## Consequences

ABI contract tests and `BESKID_RUNTIME_ABI_VERSION` align to the envelope.

## Verification anchors

`compiler/crates/beskid_tests/src/abi/contracts.rs`; [conformance and versioning](/platform-spec/language-meta/interop/interop-contracts/conformance-and-versioning/).
