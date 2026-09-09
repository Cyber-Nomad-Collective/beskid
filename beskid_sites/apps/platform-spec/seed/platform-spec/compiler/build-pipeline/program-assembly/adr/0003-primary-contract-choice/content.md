import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

This feature hub defines how the reference compiler turns a resolved **`CompilePlan`** plus **effective (materialized-first) source roots** into a **`ProgramAssembly`**: discovered `.bd` units, a shared **`ModuleIndex`** for cross-module resolution, and a single front-end spine consumed by CLI, LSP, analyze, and codegen. JIT and AOT backends consume **`CodegenArtifact`** only and do not re-run assembly.

## Decision

The reference compiler **must** implement Program assembly as documented in this feature hub and its article bundle.

## Consequences

Changes require hub/ADR updates and verification anchor extensions.

## Verification anchors

- `compiler/crates/beskid_analysis/`
