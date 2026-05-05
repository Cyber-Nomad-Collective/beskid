---
title: Language Spec Cutover Program
description: Phased program to replace legacy /spec pages with platform-spec language-meta as the single language spec surface.
---

This guide defines the execution program for replacing the legacy `/spec/` tree with the platform-spec language surface.

## Phase A - Inventory

### Already mirrored in platform-spec language-meta (implemented)

- `glossary-and-conformance` -> `/platform-spec/language-meta/conformance/glossary-and-conformance/`
- `lexical-and-syntax` -> `/platform-spec/language-meta/surface-syntax/lexical-and-syntax/`
- `documentation-comments` -> `/platform-spec/language-meta/surface-syntax/documentation-comments/`
- `types` -> `/platform-spec/language-meta/type-system/types/`
- `enums-and-match` -> `/platform-spec/language-meta/type-system/enums-and-match/`
- `type-inference` -> `/platform-spec/language-meta/type-system/type-inference/`
- `method-dispatch` -> `/platform-spec/language-meta/type-system/method-dispatch/`
- `memory-and-references` -> `/platform-spec/language-meta/memory-model/memory-and-references/`
- `modules-and-visibility` -> `/platform-spec/language-meta/program-structure/modules-and-visibility/`
- `name-resolution` -> `/platform-spec/language-meta/program-structure/name-resolution/`
- `error-handling` -> `/platform-spec/language-meta/contracts-and-effects/error-handling/`
- `contracts` -> `/platform-spec/language-meta/contracts-and-effects/contracts/`
- `testing` -> `/platform-spec/language-meta/contracts-and-effects/testing/`
- `control-flow` -> `/platform-spec/language-meta/evaluation/control-flow/`
- `lambdas-and-closures` -> `/platform-spec/language-meta/evaluation/lambdas-and-closures/`
- `events` -> `/platform-spec/language-meta/evaluation/events/`
- `metaprogramming` -> `/platform-spec/language-meta/metaprogramming/metaprogramming/` (overview) and `/platform-spec/language-meta/metaprogramming/meta-block/` (`meta` language contract)
- Metaprogramming Mod SDK (compiler contracts) -> `/platform-spec/compiler/metaprogramming-mod-sdk/`
- `Project.type = Meta` / meta orchestration wiring -> `/platform-spec/tooling/manifests-and-lockfiles/project-manifest-contract/`
- `ffi-and-extern` -> `/platform-spec/language-meta/interop/ffi-and-extern/` (language surface; paired hubs: [Interop.Contracts](/platform-spec/language-meta/interop/interop-contracts/), [C ABI profile](/platform-spec/language-meta/interop/c-abi-profile/), [Rust ABI profile](/platform-spec/language-meta/interop/rust-abi-profile/))
- `dependency-injection/*` -> `/platform-spec/language-meta/composition/dependency-injection/`

### Not yet mirrored (planned)

- `code-style-and-naming` (target: community/tooling placement decision)
- `corelib-api-shape` (target: core-library domain placement)
- `package-json-v1` (target: tooling domain)
- `project-lock-v1` (target: tooling domain)
- `workspace-proj-v1` (target: tooling domain)

## Phase B - Normative Home Decision

Decision: make platform docs under `/platform-spec/language-meta/` the normative home for language behavior. Keep `/spec/` only as compatibility redirects after cutover.

- Versioning model: rolling release on `main`.
- URL model: `domain -> area -> feature` (no track/version segment).
- Optional future `component` hubs remain functional groupings, not versions.

## Phase C - Authoring Plan

1. Move normative prose for each mirrored chapter into the matching language-meta feature page.
2. Add missing feature pages for the planned set above.
3. Ensure each feature page has:
   - normative statement
   - ownership + status metadata
   - cross-links to runtime/compiler/tooling where relevant

## Phase D - Cutover

1. Add redirects from `/spec/*` to final `/platform-spec/...` pages.
2. Remove Language Spec section from sidebar.
3. Remove legacy `/spec/` content files once redirects are verified.
4. Update links in guides/book/corelib docs that still point to `/spec/`.

## Phase E - CI Guardrails

- Add a check that every language-meta `specLevel: feature` page includes a normative section and at least one canonical cross-link.
- Keep frontmatter validation in `scripts/verify-platform-spec-frontmatter.mjs`.
