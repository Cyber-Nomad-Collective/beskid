import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Readers stopped at bridge pages without reaching the owning **Standard** feature contract.

## Decision

Every non-normative bridge page **must** link to one or more canonical normative destinations and label those links as canonical. Near the top each bridge **must** state: non-normative status, why the page exists, and which normative page(s) own the behavior. Canonical links **must** be direct platform-spec URLs with human-readable relation labels; bi-directional discoverability is required during active migration windows when practical.

## Consequences

**Standard** pages that link legacy prefixes **must** mark those links non-normative in prose or `relatedTopics`.

## Verification anchors

`checkStaleLegacyBridge` in `platform-spec-content.ts`.
