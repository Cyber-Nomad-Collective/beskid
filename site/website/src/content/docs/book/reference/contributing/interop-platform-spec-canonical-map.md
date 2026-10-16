---
title: Interop Standard map
description: Maintainer table of the Standard capabilities that own FFI, Interop.Contracts, ABI profiles, foreign library tooling, and Rust Glue.
---

# Interop Standard map

Maintainer reference: the Standard capabilities that own interop. Use it when you update links, redirects, or CI fixtures. Old `/platform-spec/language-meta/interop/...` addresses redirect to these capability pages; write new links to `/docs/standard/capabilities/...` directly.

## Language meta: Interop

| Topic | Capability |
| --- | --- |
| Interop area hub | [taxonomy--language-meta--interop](/docs/standard/capabilities/taxonomy--language-meta--interop/) |
| **Interop.Contracts** | [language-meta--interop--interop-contracts](/docs/standard/capabilities/language-meta--interop--interop-contracts/) |
| **FFI and extern** | [language-meta--interop--ffi-and-extern](/docs/standard/capabilities/language-meta--interop--ffi-and-extern/) |
| **Export and callbacks** | [language-meta--interop--export-and-callbacks](/docs/standard/capabilities/language-meta--interop--export-and-callbacks/) |
| **C ABI profile**, including dynamic resolution | [language-meta--interop--c-abi-profile](/docs/standard/capabilities/language-meta--interop--c-abi-profile/) |
| **Rust ABI profile** (runtime only) | [language-meta--interop--rust-abi-profile](/docs/standard/capabilities/language-meta--interop--rust-abi-profile/) |

## Tooling

| Topic | Capability |
| --- | --- |
| **Foreign library import** | [taxonomy--tooling--foreign-library-import](/docs/standard/capabilities/taxonomy--tooling--foreign-library-import/) |
| **Project link libraries**; the change `v06-rust-glue-integration` adds the `glue` owner block | [tooling--manifests-and-lockfiles--project-manifest-contract](/docs/standard/capabilities/tooling--manifests-and-lockfiles--project-manifest-contract/) |

## Execution

| Topic | Capability |
| --- | --- |
| Extern dispatch after a boundary is chosen | [execution--abi-and-host--extern-dispatch-and-policy](/docs/standard/capabilities/execution--abi-and-host--extern-dispatch-and-policy/) |
| ABI versions | [execution--abi-and-host--abi-versioning-and-compatibility](/docs/standard/capabilities/execution--abi-and-host--abi-versioning-and-compatibility/) |

## Rust Glue in 0.6

The 0.6 Rust Glue requirements are proposed in the OpenSpec change `v06-rust-glue-integration`, which adds the capability `language-meta--interop--beskid-glue`. Until that change is applied to `openspec/specs`, the capability has no catalog page; link the change, not a guessed capability URL. The provisional stdio bridge is a separate change, `v06-glue-stdio-bridge-provisional`, with no 0.6 delivery obligation. The Book page is [Rust Glue](/book/21-ffi-and-forbidden-friendships/rust-glue/).

## Stdlib policy

**WinAPI** / stdcall is **out of scope** for the Corelib Standard. See the [C ABI profile](/docs/standard/capabilities/language-meta--interop--c-abi-profile/).

User FFI layout bands are versioned separately from the runtime ABI; see [Interop contracts](/docs/standard/capabilities/language-meta--interop--interop-contracts/).
