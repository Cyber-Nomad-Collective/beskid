import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Lowering was split across experimental paths.

## Decision

`beskid_codegen::lower_source` is the single lowering entry producing `CodegenArtifact` consumed by `JitModule`.

## Consequences

Experimental IR dumps must not bypass this entry in release builds.

## Verification anchors

- `compiler/crates/beskid_codegen`
- `compiler/crates/beskid_engine/src/jit_module.rs`.
