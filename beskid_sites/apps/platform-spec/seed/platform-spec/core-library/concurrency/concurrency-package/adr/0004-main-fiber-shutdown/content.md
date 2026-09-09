import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Process lifetime must be defined when main returns while child fibers still run.

## Decision

| Rule | Detail |
| --- | --- |
| Main | `main()` runs on fiber **0** |
| Shutdown | When `main` returns, runtime **Join**s spawned fibers that were **not** **Detach**ed |
| Detach | **Detach** waives parent **Join**; child panic still **aborts process** |
| Leak | Spawn without **Join** or **Detach** before `main` ends → conformance **warning** in v0.2 tests |

## Consequences

Future recovery policies require a new ADR; v1 aborts on undetached child panic.

## Verification anchors

Runtime shutdown tests; conformance warnings catalog.
