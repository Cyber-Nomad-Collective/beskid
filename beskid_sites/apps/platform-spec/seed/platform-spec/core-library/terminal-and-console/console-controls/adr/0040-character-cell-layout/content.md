import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Terminal UI in corelib targets TTY character grids.

## Decision

| Rule | Detail |
| --- | --- |
| Coordinates | Rows/columns in character cells |
| Graphics | Pixel graphics are out of scope |

## Consequences

Layout helpers align with `Console.ConsoleSize` and resize events.

## Verification anchors

Console control tests under `packages/console`.
