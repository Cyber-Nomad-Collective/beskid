import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

This feature hub specifies how manifests become prepared dependency workspaces and how `Project.lock` is synchronized under `--locked` and `--frozen`.

## Decision

The reference compiler **must** implement Dependency workspace and lockfile as documented in this feature hub and its article bundle.

## Consequences

Changes require hub/ADR updates and verification anchor extensions.

## Verification anchors

- `compiler/crates/beskid_analysis/`
