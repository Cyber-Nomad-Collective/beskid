import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Every host compilation must see the standard library graph.

## Decision

| Rule | Detail |
| --- | --- |
| Forbidden keys | `noCorelib`, `useCorelib: false` rejected at parse |
| Templates | Scaffolds **must not** emit opt-out keys |

## Consequences

Implicit injection in `resolve_dependencies` always attaches corelib.

## Verification anchors

`projects/parser.rs`; template manifest tests.
