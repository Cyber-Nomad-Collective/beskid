import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Lowering produces one `CodegenArtifact`; backend selection happens after semantic gates complete.

## Decision

Both JIT (`beskid_engine::JitModule`) and AOT link flows **must** accept the same schema fields from `beskid_codegen` without forking lowering.

## Consequences

Backend-specific options attach at execution time; lowering stays single-path.

## Verification anchors

- `compiler/crates/beskid_engine/src/jit_module.rs`
- `compiler/crates/beskid_codegen`
- `compiler/crates/beskid_tests/src/runtime/jit.rs`.
