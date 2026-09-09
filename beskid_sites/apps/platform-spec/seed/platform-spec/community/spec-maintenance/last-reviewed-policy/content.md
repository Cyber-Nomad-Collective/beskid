import SpecPageHeader from '@beskid/beskid-ui/platform-spec/SpecPageHeader.astro';

<SpecPageHeader status="Standard" ownerName="Piotr Mikstacki" ownerEmail="pmikstacki@cybernomad.it" submitterName="Piotr Mikstacki" submitterEmail="pmikstacki@cybernomad.it" />

## Normative platform contract

1. High-churn feature pages should set `lastReviewed` in ISO date format.
2. If implementation anchors change materially, `lastReviewed` should be updated in the same change set.
3. Optional verification scripts may warn when pages with implementation anchors omit `lastReviewed`.

## Decisions

No open decisions. Closed maintenance ADR under **`adr/`** — `D-COMM-REV-0001` (reader **ADRs** tab).
