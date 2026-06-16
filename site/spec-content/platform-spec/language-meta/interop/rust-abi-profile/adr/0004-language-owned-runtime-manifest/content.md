---
title: Language-owned runtime manifest
description: Single manifest is normative authority; Rust registries are
  generated artifacts.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-LMETA-RUSTABI-0004
adrStatus: Accepted
adrDate: 2026-06-06
lastReviewed: 2026-06-06
---

## Context

Runtime ABI tables were maintained in four parallel Rust registries (`beskid_abi`, analysis builtins, JIT registration, runtime bridge). Manual sync drifted from corelib ownership and made v3 kernel shrink impossible to audit.

## Decision

| Rule | Detail |
| --- | --- |
| Authority | `compiler/runtime_manifest.toml` is the **sole normative authority** for runtime builtin classification |
| Generated outputs | `BUILTIN_SPECS`, `RUNTIME_EXPORT_SYMBOLS`, analysis `define_builtins!`, JIT registration, and bridge link anchors **must** be **generated** from the manifest at build time |
| Hand edits | Hand-maintained symbol lists outside the manifest and generator **must not** ship |
| Entry shape | Each manifest row carries `symbol`, Cranelift kinds, `beskid_path`, `injected`, `dispatch_tag`, `return_group`, and optional `corelib_owner` |

## Consequences

[D-LMETA-RUSTABI-0002](/platform-spec/language-meta/interop/rust-abi-profile/adr/0002-runtime-c-exports-rust-internal/) remains valid but applies to **kernel** exports only. See [runtime manifest](/platform-spec/language-meta/interop/rust-abi-profile/runtime-manifest/) for schema and generation pipeline.

## Verification anchors

`compiler/runtime_manifest.toml`; `compiler/crates/beskid_manifest/`; generated stubs under `compiler/crates/beskid_abi/src/`.
