## Why

Sixteen language-meta feature capabilities remain provisional stubs after earlier
promotion waves. Each already carries rich Migrated source with BCP-14
obligations. Leaving them provisional blocks Book and Tracker from citing
implemented language guarantees (Linear CYB-54 Cursor wave D).

## What Changes

- Promote sixteen language-meta feature-level provisional capabilities to
  explicit SHALL/MUST requirements extracted from each capability's Migrated
  source text.
- Remove each capability's single "SHALL remain non-conformant" requirement.
- Keep Informative Source Provenance blocks as historical provenance.
- Do not regenerate `openspec/catalog.json` in this change (catalog refresh is
  deferred).

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `language-meta--contracts-and-effects--contracts`: replace provisional stub with contract syntax and satisfaction requirements
- `language-meta--contracts-and-effects--error-handling`: replace provisional stub with Result/`?` propagation requirements
- `language-meta--contracts-and-effects--testing`: replace provisional stub with `test` item and discovery requirements
- `language-meta--evaluation--control-flow`: replace provisional stub with statement control-flow requirements
- `language-meta--evaluation--events`: replace provisional stub with event field raise/subscribe requirements
- `language-meta--evaluation--lambdas-and-closures`: replace provisional stub with lambda/closure requirements
- `language-meta--memory-model--memory-and-references`: replace provisional stub with mut/locals/heap requirements
- `language-meta--metaprogramming--compiler-mod-sdk`: replace provisional stub with Mod SDK discovery and contract requirements
- `language-meta--metaprogramming--macros`: replace provisional stub with language macro expansion requirements
- `language-meta--metaprogramming--metaprogramming`: replace provisional stub with metaprogramming plane scheduling requirements
- `language-meta--metaprogramming--serialization`: replace provisional stub with serialization package-role requirements
- `language-meta--program-structure--code-style-and-naming`: replace provisional stub with identifier case-profile requirements
- `language-meta--program-structure--extend-type`: replace provisional stub with `extend type` access requirements
- `language-meta--type-system--method-dispatch`: replace provisional stub with receiver/overload dispatch requirements
- `language-meta--type-system--type-inference`: replace provisional stub with inference-site requirements
- `language-meta--type-system--types`: replace provisional stub with type grammar and declaration requirements

## Impact

- Catalog `provisionalCapabilities` will drop by sixteen once catalog is
  regenerated in a follow-up (not part of this change).
- Book and Tracker may cite the promoted requirements once archived.
- No tooling, core-library, taxonomy, or compiler code changes in this wave.
