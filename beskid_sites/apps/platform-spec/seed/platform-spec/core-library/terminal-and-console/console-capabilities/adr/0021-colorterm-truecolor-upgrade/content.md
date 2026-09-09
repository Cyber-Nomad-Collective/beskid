import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Modern terminals advertise truecolor via COLORTERM without breaking NO_COLOR.

## Decision

| Rule | Detail |
| --- | --- |
| Probe | `COLORTERM` set → `TrueColor` when color not stripped |
| `FORCE_COLOR` | May enable emission on non-TTY stdout |

## Consequences

EffectiveColorModel reflects env probes before SGR downgrade (see D-CORE-TERM-0003).

## Verification anchors

`CapabilitiesTests.bd`.
