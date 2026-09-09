import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Registry, CLI, and analysis must agree on one package name.

## Decision

| Rule | Detail |
| --- | --- |
| Identity | Package name **`corelib`**; sources under `beskid_corelib` |
| Legacy | `standard_library` paths may alias; identity remains **`corelib`** |

## Consequences

pckg publish, resolver, and docs use the same identity string.

## Verification anchors

`resolver.rs`; `beskid_tests` corelib project fixtures.
