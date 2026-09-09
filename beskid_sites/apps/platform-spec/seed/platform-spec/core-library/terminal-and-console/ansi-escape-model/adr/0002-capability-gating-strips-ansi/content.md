import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Programs must not leak escapes to pipes, log files, or NO_COLOR environments.

## Decision

| Rule | Detail |
| --- | --- |
| Gating | User-visible styled output **must** pass `Ansi.Escape.WhenEnabled` |
| Tests | Ungated `Csi` remains for golden tests |

## Consequences

When `ShouldEmitAnsi()` is false, gated builders return empty strings.

## Verification anchors

`AnsiEscapeTests.bd`; console capability integration.
