import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Article filenames implied depth (for example `verification-and-traceability`) while content remained TBD stubs.

## Decision

Each bundle article **must** meet role minimums: **design-model** (model, invariants, diagram/table); **contracts** (testable MUST/SHOULD rules); **verification** (concrete test paths, not TBD); **operations**/**migration** (procedures); **decisions-record** (legacy—migrate to **`adr/`**); **adr** (one decision per file with `SpecAdrChrome`). Every article **must** include purpose, canonical references, detailed behavior, verification notes, and related topics. Feature hubs **must** publish a stable newcomer reading order (area → hub → conceptual articles → verification).

## Consequences

`ARTICLE_ROLE_THRESHOLDS` in `platform-spec-content.ts` enforce section and line counts.

## Verification anchors

`packages/trudoc/src/verify/platform-spec-content.ts` role thresholds.
