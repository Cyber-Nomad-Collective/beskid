import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Monolithic IO.bd hid syscall direction and descriptor typing.

## Decision

| Rule | Detail |
| --- | --- |
| Surface | `Core.Input`, `Core.Output`, `Core.Error` under `packages/foundation/src/Core/` |
| Non-goal | Monolithic `IO.bd` for standard streams |

## Consequences

Syscall descriptors stay typed per stream.

## Verification anchors

`packages/foundation/src/Core/Input/`, `Output/`, `Error/`; stream contract tests.
