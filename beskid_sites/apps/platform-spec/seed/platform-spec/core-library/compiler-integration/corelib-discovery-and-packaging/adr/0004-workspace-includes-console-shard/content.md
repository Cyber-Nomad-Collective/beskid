import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Console/ANSI must ship with the aggregate package, not as an orphan.

## Decision

| Rule | Detail |
| --- | --- |
| Workspace | `compiler/corelib/Workspace.proj` lists `packages/console` |
| Aggregate | `beskid_corelib` depends on `corelib_console` |

## Consequences

Publish CI packs the full workspace graph for registry corelib.

## Verification anchors

`Workspace.proj`; corelib CI publish job.
