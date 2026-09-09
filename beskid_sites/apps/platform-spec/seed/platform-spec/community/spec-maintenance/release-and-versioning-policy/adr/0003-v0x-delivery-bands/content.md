import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Readers interpreted **v0.2** labels as alternate authoritative spec trees at the same URL.

## Decision

Labels such as **v0.1**, **v0.2**, or roadmap bands describe **what the reference platform targets shipping**, not separate specification editions. A page may mention a band when scoping work; it **must not** imply an older band remains authoritative at the same URL without explicit **Superseded** decision notes.

## Consequences

`status: Proposed` plus band mentions are expectations; `status: Standard` plus bands scope verification targets.

## Verification anchors

Feature hub maturity tables; embedded **Superseded** ADR links.
