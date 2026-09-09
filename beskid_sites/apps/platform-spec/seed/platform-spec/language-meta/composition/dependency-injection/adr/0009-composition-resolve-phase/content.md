import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Compiler mods need a frozen composition snapshot but must not mutate app graphs.

## Decision

Pipeline phase **`composition.resolve`** **must** run after **`semantic.snapshot`** and before **`mod.analyze`** (see [Stage ordering](/platform-spec/compiler/build-pipeline/stage-ordering/)).

## Consequences

Mods query read-only snapshots; app graph build stays in analysis.

## Verification anchors

`compiler/crates/beskid_pipeline`; [Flow and algorithm](/platform-spec/language-meta/composition/dependency-injection/flow-and-algorithm/).
