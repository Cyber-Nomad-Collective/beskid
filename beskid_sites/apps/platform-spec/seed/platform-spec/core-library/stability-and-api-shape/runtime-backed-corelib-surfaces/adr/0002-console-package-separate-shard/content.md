import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Higher console work must not bloat runtime syscall modules.

## Decision

| Rule | Detail |
| --- | --- |
| Package | `compiler/corelib/packages/console` (`corelib_console`) |
| Runtime | Streams stay in runtime package |

## Consequences

Terminal features document against console package anchors.

## Verification anchors

`packages/console`; pckg workspace publish.
