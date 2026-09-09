import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Crate references were scattered across hubs without a single ownership surface.

## Decision

This feature hub is the canonical map from `compiler/crates/*` to platform-spec features; other pages link here instead of duplicating tables.

## Consequences

New crates require anchor rows before Standard promotion of dependent features.

## Verification anchors

- Implementation-map articles and `compiler/Cargo.toml` workspace layout.
