import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

FFI symbols were discovered late in the engine.

## Decision

Extern imports are collected during lowering (`ExternImport` in codegen context) with ABI names from `beskid_abi`—not ad hoc engine scans.

## Consequences

Link-time binding stays aligned with language-meta C ABI profile.

## Verification anchors

- `compiler/crates/beskid_codegen/src/lowering/`
- `compiler/crates/beskid_abi/src/symbols.rs`.
