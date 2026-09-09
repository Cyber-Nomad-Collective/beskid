import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Version-segmented doc sites diverged from the implementation on `main`. Inception record **D-INC-0007** states the platform-wide choice.

## Decision

The platform specification under [/platform-spec/](/platform-spec/) is versioned by **Git** (typically `main`). Readers and tooling **must** treat the spec at a given commit as the contract for that commit; there is **no** parallel normative URL hierarchy such as `/platform-spec/v0.2/...`.

## Consequences

Site deploy and release policy track `main`; `lastReviewed` records alignment dates.

## Verification anchors

[D-INC-0007](/platform-spec/community/project-inception/adr/0007-git-main-version-axis/).
