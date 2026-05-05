# Platform-spec area layout recommendations

This note complements `layout.json` presets. Use it when tightening **`documentStructure`**, **`childArticles`**, or hub **MDX component** contracts per subtree.

Convention recap:

- **Domain** (`…/<domain>/index.mdx`): `extends: domain-default` — `rationale` + optional `background`, `DomainTiles` for areas.
- **Dense area** (language-meta style: `SpecSection` index + tiles): `extends: area-default` — `scope` + optional `features` / `feature-index` alias.
- **Sparse area** (tiles only, no sections): `extends: area-sparse` — rely on `DomainTiles` + optional `documentStructure.orderedSequence` if you add prose later.
- **Feature contract hub** (normative bundle + articles): `extends: feature-contract-default` — `what-this-feature-specifies`, `implementation-anchors`; add **`childArticles.requireYamlTitle: true`** when you want PRs to block untitled articles.
- **Feature narrative hub** (many `SpecSection`s): `extends: feature-hub-default` — raise **`minSpecSections`** in `layout.json` if you want a floor count.

---

## Compiler (`platform-spec/compiler/`)

| Area | Pattern today | Suggested `extends` / notes |
|------|----------------|----------------------------|
| **build-pipeline** | Scope + overview + feature index + tiles | `area-default`. Optional `documentStructure.orderedSequence`: `scope` → `overview` → `feature-index` → `DomainTiles` once you stabilise copy. |
| **codegen-and-ir** | Tiles-only hub | `area-sparse`. Add `orderedSequence` if you introduce a written scope section. |
| **conformance** | Tiles-only | `area-sparse`. |
| **front-end** | Tiles-only | `area-sparse`. |
| **implementation-map** | Scope + tiles | `area-default` (single `scope` satisfies min). |
| **metaprogramming-mod-sdk** | Large multi-section + graph | `feature-area-hub-default` or `feature-hub-default`; use **`orderedSpecSectionIds`** if section order becomes normative. |
| **resolution-and-projects** | Tiles-only | `area-sparse`. |
| **semantic-pipeline** | Tiles-only | `area-sparse`. |

**Feature leaves** under these areas: prefer **`feature-contract-default`** + sibling articles; enable **`childArticles: { requireYamlTitle: true, minDirectArticles: N }`** on features that must ship a full article bundle (template: design-model, flow, contracts, verification, examples).

---

## Community (`platform-spec/community/`)

| Area | Pattern | Suggestion |
|------|---------|------------|
| **spec-maintenance** | Prose `##` + tiles, no `SpecSection` | `area-sparse`. Optional `documentStructure.orderedSequence`: markdown heading slug for your first `##`, then `DomainTiles`. |

---

## Core library (`platform-spec/core-library/`)

| Area | Pattern | Suggestion |
|------|---------|------------|
| **compiler-integration** | Scope + tiles | `area-default`. |
| **stability-and-api-shape** | Scope + tiles | `area-default`. |

Domain hub already matches **`domain-default`** with optional background.

---

## Execution (`platform-spec/execution/`)

| Area | Pattern | Suggestion |
|------|---------|------------|
| **abi-and-host** | Tiles-only | `area-sparse`. |
| **runtime** | Tiles-only | `area-sparse`. |

Use **`feature-contract-default`** on runtime contract features (panic/IO, memory, flags) with **`childArticles.requireYamlTitle: true`** for article hygiene.

---

## Language meta (`platform-spec/language-meta/`)

| Area | Pattern | Suggestion |
|------|---------|------------|
| **composition** | Scope + tiles | `area-default`. |
| **conformance** | Scope + tiles | `area-default`. |
| **contracts-and-effects** | Scope + tiles | `area-default`. |
| **evaluation** | Scope + tiles | `area-default`. |
| **interop** | Scope + tiles | `area-default`. |
| **memory-model** | Scope + tiles | `area-default`. |
| **metaprogramming** | Scope + feature list + tiles | `area-default`; strong candidate for **`orderedSequence`** (`scope` → `features` → `DomainTiles`). |
| **program-structure** | Scope-only + tiles | `area-sparse` (already) or keep `area-default` with relaxed `features` (preset handles alias). |
| **surface-syntax** | Scope + tiles | `area-default`. |
| **type-system** | Scope + tiles | `area-default`. |

**Metaprogramming / meta-block** feature: enable **`childArticles.requireYamlTitle: true`** — articles are the normative bundle.

---

## Tooling (`platform-spec/tooling/`)

| Area | Pattern | Suggestion |
|------|---------|------------|
| **cli** | Tiles-only | `area-sparse`. |
| **lsp** | Tiles-only | `area-sparse`. |
| **manifests-and-lockfiles** | Mixed (some hubs dense) | Per-feature: contract hubs → **`feature-contract-default`** + optional **`orderedSpecSectionIds`** matching your `SpecSection` ids. |
| **registry-client** | Tiles-only | `area-sparse`. |
| **vscode-extension** | Tiles-only | `area-sparse`. |

---

## CI

- Run **`bun run verify:platform-spec-ci`** (or `npm run verify:platform-spec-ci`) on PRs touching `platform-spec` — see root workflow **`.github/workflows/platform-spec-contracts.yml`**.
- Extend validation by adding Zod schemas in **`mdxHubComponents.ts`** (`HUB_COMPONENT_PROP_SCHEMAS`) and optional **`documentStructure`** / **`childArticles`** on the relevant `layout.json`.
