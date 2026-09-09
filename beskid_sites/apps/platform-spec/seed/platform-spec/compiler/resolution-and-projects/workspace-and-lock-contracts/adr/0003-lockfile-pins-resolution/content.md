import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Floating registry versions broke reproducible compiles.

## Decision

Workspace resolution **must** honor lockfile pins from `beskid_analysis::resolve` before applying CLI overrides.

## Consequences

Lock update commands are explicit; silent refresh is forbidden in CI modes.

## Verification anchors

- `compiler/crates/beskid_analysis/src/resolve/mod.rs`
- `compiler/crates/beskid_cli/src/commands/`.
