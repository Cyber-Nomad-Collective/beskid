import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Console.Format targets terminal styling, not a document renderer.

## Decision

| Rule | Detail |
| --- | --- |
| Scope | Tested sigils and markdown subset only |
| Non-goal | Full CommonMark compliance |

## Consequences

New syntax requires tests before Standard promotion.

## Verification anchors

`FormatMarkdownTests.bd`; `Format/Scan.bd`.
