import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

A single Console IO type obscures direction and syscall descriptors.

## Decision

| Rule | Detail |
| --- | --- |
| Modules | `Core.Input`, `Core.Output`, `Core.Error` |
| Forbidden | Monolithic console IO type for standard streams |

## Consequences

Each module binds one `StandardStream` descriptor; cross-stream APIs stay separate.

## Verification anchors

`packages/foundation/src/Core/Input/Input.bd`, `Output/Output.bd`, `Error/Error.bd`.
