---
title: Interop.Contracts
description: Language-agnostic primitives for foreign boundaries—symbols, call
  shapes, ownership, and conformance—shared by C and Rust ABI profiles.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-20
---

<SpecSection title="What this feature specifies" id="what-this-feature-specifies">
**Interop.Contracts** is the normative, language-agnostic vocabulary for describing how Beskid values and control flow cross a **foreign boundary**. It does **not** prescribe a single calling convention; **[C ABI profile](/platform-spec/language-meta/interop/c-abi-profile/)** and **[Rust ABI profile](/platform-spec/language-meta/interop/rust-abi-profile/)** bind these primitives to concrete ABIs and linking models.

This feature specifies: **symbol identity**, **type-shape classes**, **call-shape classes**, **ownership and lifetime obligations** at the boundary, **error and unwind semantics**, and a **conformance envelope** (versioning and forward compatibility) that host runtimes and compilers must honor when claiming compatibility.
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- Runtime export names and builtin dispatch tables: `compiler/crates/beskid_abi/src/symbols.rs`, `compiler/crates/beskid_abi/src/builtins.rs`
- Stable FFI layouts for standard runtime types: `compiler/crates/beskid_abi/src/types.rs`
- Runtime ABI version constant: `compiler/crates/beskid_abi/src/version.rs`
- JIT symbol registration and extern import validation: `compiler/crates/beskid_engine/src/jit_module.rs`, `compiler/crates/beskid_engine/src/engine.rs`
- Extern import collection and Cranelift calls: `compiler/crates/beskid_codegen/src/lowering/lowerable.rs`, `compiler/crates/beskid_codegen/src/lowering/expressions/call_expression.rs`
- ABI contract tests: `compiler/crates/beskid_tests/src/abi/contracts.rs`
</SpecSection>

<SpecSection title="Relationship to language syntax" id="relationship-to-language-syntax">
User-visible **`[Extern(...)] contract`** declarations are specified under **[FFI and extern](/platform-spec/language-meta/interop/ffi-and-extern/)**. That chapter must remain consistent with the abstract contracts here; profile pages add ABI-specific rules.
</SpecSection>

## Decisions

No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-LMETA-IC-0001` … `D-LMETA-IC-0003`); use the reader **ADRs** tab for detail.
