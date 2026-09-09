import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Not every corelib module is runtime-backed.

## Decision

| Rule | Detail |
| --- | --- |
| In scope | Builtin/syscall facades documented here |
| Out of scope | Pure Beskid `foundation` modules |

## Consequences

This feature does not duplicate language-meta semantics for pure libraries.

## Verification anchors

foundation package compile tests.
