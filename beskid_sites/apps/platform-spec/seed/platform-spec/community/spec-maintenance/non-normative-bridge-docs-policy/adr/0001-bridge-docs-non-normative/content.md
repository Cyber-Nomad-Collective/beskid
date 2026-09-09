import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Legacy Starlight paths and informal mapping tables were cited in reviews as if they were language law.

## Decision

Bridge documents (migration guides, mapping tables, terminology crosswalks) are **non-normative** by default unless a **Standard** platform-spec feature page explicitly declares normative status. Migration mapping pages **must not** be the final authority for platform behavior.

## Consequences

[Legacy spec mapping](/platform-spec/legacy-spec-mapping/) stays informative; normative fixes land under `platform-spec/`.

## Verification anchors

`PSC005` legacy bridge checks on **Standard** pages linking `/execution/` or `/corelib/`.
