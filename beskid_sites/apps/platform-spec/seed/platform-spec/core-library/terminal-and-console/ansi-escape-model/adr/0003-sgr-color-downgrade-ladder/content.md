import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Terminals differ in color depth; emitting unsupported `38;2` breaks dumb hosts.

## Decision

| Rule | Detail |
| --- | --- |
| Ladder | truecolor → 256 → basic per `EffectiveColorModel` |
| Policy | Callers do not pick per-sequence models manually |

## Consequences

SGR builders consult capability probes before emitting RGB CSI.

## Verification anchors

`AnsiSgrGoldenTests.bd`; `CapabilitiesTests.bd`.
