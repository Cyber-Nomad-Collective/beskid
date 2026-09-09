import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Hand-maintained parallel syntax trees diverged from the host parser.

## Decision

Canonical syntax model is generated via `beskid_ast_reflect_gen` into `Beskid.Compiler.*` SDK sources from the Rust AST—aligned with D-INC-0006.

## Consequences

Mods consume generated facades; internal `beskid_analysis::syntax` remains host-only.

## Verification anchors

- `beskid_ast_reflect_gen`
- `compiler/crates/beskid_analysis/src/syntax/`.
