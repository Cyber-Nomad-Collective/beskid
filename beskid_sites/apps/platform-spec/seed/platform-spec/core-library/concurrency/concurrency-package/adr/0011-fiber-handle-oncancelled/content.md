import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Authors should not declare cancellation events on arbitrary spawn closures.

## Decision

| Rule | Detail |
| --- | --- |
| Placement | **OnCancelled** on `` `Fiber<T>` `` handle from ``spawn`` only |
| Spawn entry | Ordinary `` `fn(...) -> T` ``; **does not** declare **OnCancelled** |
| Handle | `` `Fiber<T>` `` struct wrapping runtime builtins |

## Consequences

Lowering wires cancel slot from handle metadata.

## Verification anchors

Semantic + lowering tests for spawn.
