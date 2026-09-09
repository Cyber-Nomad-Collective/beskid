import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

OSC framing varies across terminals; v1 picks one terminator for golden tests.

## Decision

| Rule | Detail |
| --- | --- |
| Terminator | **BEL** (`0x07`) in v1 |
| ST | `ESC ` termination is **not** required |

## Consequences

OSC helpers emit BEL-terminated sequences only until a future ADR extends ST.

## Verification anchors

`AnsiEscapeTests.bd`; `Ansi.Osc` sources.
