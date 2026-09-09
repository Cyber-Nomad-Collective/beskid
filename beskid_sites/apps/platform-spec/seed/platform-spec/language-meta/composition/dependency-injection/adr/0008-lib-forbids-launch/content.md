import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Test and library packages attempted to embed process entry via launch.

## Decision

**`Lib`** project targets **may** declare **`host`** types for reuse but **`launch`** is **forbidden** (**E1711**). Only app/test host targets **may** **`launch`**.

## Consequences

Consumers reference library hosts from their own app targets or approved harness entries.

## Verification anchors

[FAQ](/platform-spec/language-meta/composition/dependency-injection/faq-and-troubleshooting/).
