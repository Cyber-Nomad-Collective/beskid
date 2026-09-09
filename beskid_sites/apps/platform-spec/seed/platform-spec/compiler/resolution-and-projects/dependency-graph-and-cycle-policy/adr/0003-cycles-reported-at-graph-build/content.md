import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Silent cycle handling broke workspace diagnostics parity.

## Decision

Directed cycles **must** be reported during graph build; `Mod` cycles **must** include mod id in the diagnostic path.

## Consequences

Policy knobs (`error`, `warn`, permissive) select abort vs continue; default remains fail-closed for release builds.

## Verification anchors

- `beskid_analysis::projects::graph`
- `compiler/crates/beskid_tests/src/projects/corelib/layout.rs`.
