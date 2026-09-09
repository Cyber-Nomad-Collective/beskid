import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Callers should not manually pick CSI color modes per terminal.

## Decision

| Rule | Detail |
| --- | --- |
| Downgrade | RGB → indexed → basic is **lossy** |
| API | No per-sequence model selector on public helpers |

## Consequences

Styled output remains readable on Basic16 hosts without author branches.

## Verification anchors

`AnsiSgrGoldenTests.bd`; capability + SGR integration.
