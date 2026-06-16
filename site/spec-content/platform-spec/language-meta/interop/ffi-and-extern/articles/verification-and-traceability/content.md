---
title: FFI and extern — Verification and traceability
description: Conformance strategy for v0.3 FFI spec (fixtures, diagnostics,
  ignored runtime tests).
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-20
---

## Spec-first conformance

v0.3 FFI is **normative in platform-spec** before the reference compiler fully implements link-time binding, interop views, and export/callback registration.

Toolchains **conform** to this feature when:

1. **Parse and analysis fixtures** accept valid v0.3 extern/export syntax and emit expected diagnostics for invalid forms.
2. **Codegen extraction tests** record stable **`ExternImport`** / export metadata from fixtures (where implemented).
3. **Runtime e2e tests** for link-time foreign calls may be marked **`#[ignore]`** with reason **`v0.3 FFI impl`** until the engine/CLI path lands.

## Traceability matrix

| Contract clause | Verification anchor |
| --- | --- |
| `Extern` on contract only | `beskid_tests` analysis **E1510** |
| `Abi:"C"` + `Library` | `beskid_tests` extern validation pipeline |
| Interop view types | Type fixtures + lowering signature scan (`validate_ffi_signature`) |
| Link-time libraries | Manifest contract tests + future CLI import tests |
| Export / callbacks | Dedicated fixtures under `export-and-callbacks` hub |

## Runtime ABI separation

Tests for **`RUNTIME_EXPORT_SYMBOLS`** and **`BESKID_RUNTIME_ABI_VERSION`** remain under **`beskid_tests/src/abi/contracts.rs`**. User FFI layout versioning **must not** bump the runtime ABI version unless a runtime export symbol changes.

## Maintainer rule

Any behavior change in this area **must** update platform-spec text and add or adjust tests in the same change so the specification stays executable.
