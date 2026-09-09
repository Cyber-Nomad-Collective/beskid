import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Monolithic `decisions-record` articles and hub prose duplicated the same choices without a stable identifier or reader **ADRs** tab.

## Decision

Each **Standard** feature **must** publish closed choices under **`adr/`** as one file per decision (`specLevel: adr`, stable `adrId`, `adrStatus`, `adrDate`). Body **must** include **`## Context`**, **`## Decision`**, **`## Consequences`**; add **`## Verification anchors`** when testable. Legacy `decisions-record.mdx` and hub **`## Decisions`** summaries remain valid during migration; new work **must** use `adr/`. Inception cross-cutting ADRs stay under [Project inception](/platform-spec/community/project-inception/).

## Consequences

Superseded ADRs set `supersedesAdr` or link replacements in **Consequences** with a Git revision note. Hub **`## Decisions`** summarizes by `adrId` only—no full ADR prose duplication.

## Verification anchors

`checkAdrSections` and `checkStandardFeatureDecisions` in `packages/trudoc/src/verify/platform-spec-content.ts`.
