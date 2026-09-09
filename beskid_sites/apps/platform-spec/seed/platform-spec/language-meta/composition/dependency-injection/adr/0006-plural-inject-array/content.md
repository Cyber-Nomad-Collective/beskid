import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Apps register multiple implementations of one contract (for example two `Storage`).

## Decision

Multiple implementations **must** use **`inject Contract[]`** (or concrete **`T[]`**). Singular **`inject Contract`** **must** be unique at the resolution level (**E1705** when ambiguous).

## Consequences

Deterministic registration merge order defines array element order.

## Verification anchors

[Design model](/platform-spec/language-meta/composition/dependency-injection/design-model/); [FAQ](/platform-spec/language-meta/composition/dependency-injection/faq-and-troubleshooting/).
