## Why

v0.6 requires reusable generic serialization and native Beskid BSOL. Current dynamic routines write shape zero and return the source payload on mapping; native Generator dispatch uses a stub; standalone BSOL grammar and migration have documented/source discrepancies. These are required implementation prerequisites, not grounds to reduce release scope.

## What Changes

- Require real fail-closed native structural Mod contributions against canonical generation-bound semantic authority.
- Specify complete generic shape eligibility, stable registered metadata, format contracts, limits and atomic error policies.
- Supersede historical HIR/struct-only/dynamic mapping contract with traced registered checked cells and fresh mapping.
- Specify shared native/Rust syntax, v1/v2 profile composition/imports/references/constraints, structural migration and exact typed representation.
- Correct grammar explicitly: @ attributes, strict escaped strings, empty maps, signed decimal/finite float values and numeric list items.
- Require shared corpus and installed all-target proofs; full scope remains mandatory after feasibility milestones.

## Capabilities

### New Capabilities

None. All obligations extend existing normative leaves.

### Modified Capabilities

- `language-meta--metaprogramming--serialization`: generic metadata/adapters/eligibility/policies.
- `compiler--compiler-mods--mod-host-bridge`: production native fail-closed invocation.
- `compiler--compiler-mods--typed-emitter-and-transforms`: structural generation and current semantic authority.
- `compiler--codegen-and-ir--dynamic-types-and-mapping`: safe registered dynamic representation/mapping.
- `tooling--manifests-and-lockfiles--bsol`: complete shared native syntax/schema/typed implementation.

## Impact

Corelib serialization Mod/library/BSOL package, compiler query/emitter/ISLE and runtime descriptors, standalone BSOL/tree-sitter/editor fixtures and installed release consumers. Primitive availability depends on the v0.6 change to `language-meta--type-system--types`, owned by the Glue/primitive slice.

## Compatibility and Migration

Existing valid v1/v2 documents retain meaning, except ambiguous unsafe lexical handling and text-replacement migration are corrected by explicit corpus cases. Backslashes now denote defined escapes; producers of literal backslashes must escape them. Attribute canonical syntax is @Name, correcting bracket examples. Generic serialization APIs are newly specified; retired HIR/fallback mapping references are superseded. Reference AST existing fields remain stable and additions are additive. Public docs remain `/docs/standard/`; no new legacy URL family.

## Reversion

Revert implementation and this normative change as one source-bound candidate before publication. Do not downgrade published shape/schema data silently; version identity and migrations must remain explicit. Existing user files and locks are preserved.
