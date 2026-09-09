import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Constructor injection churns signatures across inheritance and complicates lowering.

## Decision

**`inject`** **must** apply to **fields** on ordinary types only. Constructor-parameter **`inject`** **must** be rejected (**E1712**).

## Consequences

Uniform type headers and a single slot-lowering story for injected fields.

## Verification anchors

[Design model](/platform-spec/language-meta/composition/dependency-injection/design-model/); [FAQ](/platform-spec/language-meta/composition/dependency-injection/faq-and-troubleshooting/).
