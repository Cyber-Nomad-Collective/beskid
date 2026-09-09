import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Manifest key tables were duplicated between tooling and compiler specs.

## Decision

Author-facing `Project.proj` key tables live only under tooling; this compiler feature documents resolution graph behavior and defers schema prose via `relatedTopics`.

## Consequences

Compiler changes manifest parsing only when graph or diagnostic bands change; tooling spec leads schema edits.

## Verification anchors

- `compiler/crates/beskid_analysis/src/projects/manifest_resolve.rs`
- `tooling project-manifest-contract hub.`
