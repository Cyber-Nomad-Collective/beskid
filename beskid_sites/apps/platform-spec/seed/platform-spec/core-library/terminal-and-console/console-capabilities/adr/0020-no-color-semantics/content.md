import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Users and CI expect no-color.org semantics for accessibility and logs.

## Decision

| Rule | Detail |
| --- | --- |
| `NO_COLOR` | Non-empty value **must** force `ShouldEmitAnsi()` false |
| Reference | [no-color.org](https://no-color.org/) |

## Consequences

Capability probes and markup render paths consult the same gate.

## Verification anchors

`CapabilitiesTests.bd`; `Console/Capabilities.bd`.
