import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

`Mod` packages **must** export public Beskid types implementing SDK contracts; host loads AOT artifacts and `mod.descriptor.json` registrations—not manifest attach metadata.

## Decision

Contract discovery uses `(contractId, typeId, entrySymbol)` tuples; failures emit E1821–E1870 before `mod.collect`.

## Consequences

JIT mod execution is not normative; rebuild uses `beskid mod rebuild`.

## Verification anchors

- `compiler/crates/beskid_analysis/`
- `mod artifact store paths in analysis services.`
