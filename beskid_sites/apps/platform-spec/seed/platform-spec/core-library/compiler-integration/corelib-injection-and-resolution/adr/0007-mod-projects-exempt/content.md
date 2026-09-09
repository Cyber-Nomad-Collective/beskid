import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Mods are not end-user hosts; injecting corelib would distort mod graphs.

## Decision

| Rule | Detail |
| --- | --- |
| `Mod` | Does not receive implicit host injection |
| `Host` | Receives implicit corelib per D-CORE-COMP-0005 |

## Consequences

Mod SDK projects declare their own dependency closure.

## Verification anchors

Mod project tests in `beskid_tests`.
