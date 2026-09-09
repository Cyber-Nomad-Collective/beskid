import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

**Standard** feature pages listed crate paths that had drifted without any metadata signal for readers or release triage.

## Decision

High-churn feature pages **should** set `lastReviewed` in ISO date format. When implementation anchors change materially, `lastReviewed` **should** be updated in the same change set. Optional verification scripts **may** warn when pages with implementation anchors omit `lastReviewed`.

## Consequences

Release and versioning policy uses `lastReviewed` alongside Git revision as the alignment axis (see **D-COMM-VERS-0001**).

## Verification anchors

`generate-platform-spec-git-meta.mjs`; optional strict content warnings.
