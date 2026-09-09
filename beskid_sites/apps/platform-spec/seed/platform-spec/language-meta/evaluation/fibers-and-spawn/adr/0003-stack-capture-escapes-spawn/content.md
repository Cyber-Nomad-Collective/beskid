import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Moving stack references into another fiber breaks the memory model and GC rooting assumptions.

## Decision

Closure captures that would leak stack references across fibers **must** be rejected with diagnostic **`StackReferenceEscapesSpawn`** (compile error).

## Consequences

Authors pass data through `Channel<T>` or other approved sharing; runtime does not repair invalid captures.

## Verification anchors

`compiler/crates/beskid_analysis/` capture analysis; [Memory and references](/platform-spec/language-meta/memory-model/memory-and-references/).
