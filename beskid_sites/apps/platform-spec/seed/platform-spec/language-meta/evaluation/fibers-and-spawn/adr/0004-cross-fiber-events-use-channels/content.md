import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

`event` multicast is defined for ownership within one fiber; UI/IO delivery across fibers needs a defined transport.

## Decision

Delivering notifications to **another** fiber **must** use `Channel<T>` (or coordination primitives), not language `event` delivery across fiber boundaries.

## Consequences

[Events](/platform-spec/language-meta/evaluation/events/) stays single-fiber; console and host specs reference channels for cross-fiber IO.

## Verification anchors

[Fibers and spawn](/platform-spec/language-meta/evaluation/fibers-and-spawn/); [Events](/platform-spec/language-meta/evaluation/events/).
