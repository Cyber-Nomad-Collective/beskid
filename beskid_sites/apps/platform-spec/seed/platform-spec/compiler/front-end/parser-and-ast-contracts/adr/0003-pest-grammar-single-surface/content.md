import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Multiple parser entrypoints caused span drift.

## Decision

`beskid.pest` and `beskid_analysis::parsing` are the authoritative parse surface; AST contracts derive spans from this pipeline only.

## Consequences

Alternate parsers must not ship without an ADR and conformance fixtures.

## Verification anchors

- `compiler/crates/beskid_analysis/src/beskid.pest`
- `compiler/crates/beskid_analysis/src/parsing`.
