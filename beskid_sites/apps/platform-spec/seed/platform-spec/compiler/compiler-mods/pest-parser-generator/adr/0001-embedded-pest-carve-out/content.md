import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

D-COMP-FRONT-0012 requires a single host `beskid.pest` surface. Corelib needs embedded DSL parsers (markup, regex).

## Decision

Project-local `.pest` files compiled by **GrammarGenerator** parse **text DSLs only**. They **must not** replace or extend `beskid.pest`. Conformance fixtures **must** prove host surface unchanged.

## Consequences

- Clear boundary: host parser vs embedded grammars.
- `beskid_pest_gen` is not an alternate Beskid front-end.

## Verification anchors

- `compiler/crates/beskid_analysis/src/beskid.pest` unchanged by mod rebuild
- `compiler/crates/beskid_tests/fixtures/mods/pest_gen_mod/`
