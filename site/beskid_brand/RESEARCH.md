# beskid identity research and decisions

Research date: 2026-09-15. This is design research and local asset inspection, not a trademark availability search or a user recognition study.

## What the existing package showed

| Evidence | Finding | Response |
|---|---|---|
| Previous BRAND.md / README.md / brand.ts | Mesh, flat mountain, and contour-map descriptions disagreed | Replace with one documented Ridge system |
| Three component modules | Repeated contour renderers and two accent implementations | One mark renderer and one service-accent renderer |
| Contour coordinates | Outer x reached −2.9 outside the 120-unit canvas | Explicit positive bounds with clear space |
| SVG text nodes | Appearance depended on installed fonts | Outline Inter at export time |
| render.ts | Light mint was emitted for every background | Separate primary/reversed/single-ink assets |
| lottie-gen.ts | Referenced deleted mesh exports | Derive static and reveal shapes from master polygons |
| package.json | Clean removed all root JSON, including its own configuration | Explicit output list and a preservation check |
| pdf-kit.ts | Independently hardcoded obsolete rules | Specimen only; BRAND.md owns usage guidance |

No direct imports of the brand package were found outside this folder during the scoped audit. Several products hold separate logo copies. A coordinated deployment should inventory and replace those copies; this change does not imply they have already switched.

## Selected direction and color review

The user selected Ridge: two unequal mountain shoulders, broad solid forms, and a clear diagonal opening. The other exploration directions have been removed from the deliverables and preview. Ridge retains the name's mountain association; its simplicity alone does not establish exclusive distinctiveness within the crowded mountain-logo category.

The interactive preview now focuses on Forest, Pine, Moss and Emerald green pairs, each shown in light or dark mode. These controls update the page and logo samples for comparison. The user approved Emerald (`#047857` / `#6EE7B7`, supporting dark `#064E3B`), now the production palette and preview default. Other greens remain exploratory comparisons; preview interactions do not change production files. Brand ink and paper are preserved, and the recommended UI application keeps existing shared theme surfaces.

Each service mark composes its meaning across the full silhouette, allowing both peaks to participate. Polygon bodies and luminance masks create transparent structural channels. The parent Ridge stays unchanged. This replaces the cramped arrangement of a small service symbol beside a fixed right peak. The preview includes enlarged icons and lockups for all nine services. These are design interpretations, not evidence of proven recognition.

## Service meanings

Service forms are authored directly in final coordinates. Their meaning follows the service's purpose, supported by these local sources.

| Service | Purpose and visual interpretation | Evidence |
|---|---|---|
| core | Compilation: source branches converge into an output route | [Compiler](../../compiler/README.md) |
| auth | Shared identity and access: a ridgeline shield surrounds a protected passage | [Auth hub](../auth/README.md) |
| standard | Canonical requirements: a reference spine holds aligned rules | [Standard authority](../../openspec/specs/standard-content-authority/spec.md) |
| book | Guided explanation and workflows: two peaked pages share a binding | [Informative documentation](../website/src/content/docs/book/12-the-normative-bible/informative-vs-normative.md) |
| learn | Edit and check real exercises: an execution chevron folds through both peaks toward a result | [Learn runtime and exercises](../learn/README.md) |
| website | Entry into the language and documentation: an open passage beneath a rising roof | [Website](../website/README.md) |
| tracker | Plan delivery versions and roadmap work: a stepped delivery route reaches a summit | [Tracker](../../beskid_tracker/README.md) |
| pckg | Publish and retrieve versioned artifacts: mountain-crowned publication layers | [Registry](../../pckg/README.md), [Publication workflow](../website/src/content/docs/book/reference/cli/commands/pckg.md) |
| nexus | Explore repository knowledge graphs: repository branches meet at a shared graph junction | [Nexus](../../beskid_nexus/README.md) |

Some older READMEs disagree on provider details, deployment tooling, or legacy URLs. These visual interpretations rely on service purpose rather than those operational details. OpenSpec remains the normative authority, with the public standard at `/docs/standard/`.

## Sources and how they informed the work

- [W3C, Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html): distinguishes the logotype exception from ordinary text. The guide therefore includes actual color-pair calculations and does not claim light emerald is suitable on white. Emerald/limestone is 4.94:1 and light emerald/deep forest is 9.63:1; deep forest remains the preferred body-text color.
- [W3C, Functional Images](https://www.w3.org/WAI/tutorials/images/functional/): image alternatives should describe a link's purpose. The guide covers a standalone home link and redundant imagery beside visible text.
- [Inter official project](https://rsms.me/inter/): establishes the typeface and its open license. Existing local Inter assets are reused; export-time glyph outlines remove runtime font dependency.

Clear-space dimensions, letter spacing, geometry, color selection, and palette choices are design judgments made for this identity. They are not presented as W3C requirements. No competitor artwork was traced or reused.

## Verification criteria

- Parent mark reviewed at 16, 24, 32, 48, 64 and 96 CSS pixels.
- Light, dark, black and reversed SVG lockups; all nine service labels.
- SVG must have an accessible name, valid XML, and no text/font/network dependency.
- Service mask channels remain transparent on varied surfaces; inline instances have unique mask IDs and matching references.
- Master polygon geometry stays inside its declared canvas.
- Static and settled animation geometry agree; no alternate mountain implementation.
- TypeScript build, repeat generation, and source-preserving cleanup.
- PDF rendered for inspection, with no clipped labels or font errors.

## Next decision

Ridge and Emerald are selected. Inventory the independent logo copies in site apps, editor extensions, distribution artwork and release templates, then replace them together. That rollout is separate from this asset-package redesign.
