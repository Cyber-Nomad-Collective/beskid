# beskid brand guidelines

The new **Ridge** identity uses two solid, asymmetric mountain shoulders and a lowercase wordmark. The open diagonal between the forms is part of the mark. It gives the silhouette separation at small sizes and a clear rising rhythm.

Ridge is the user-selected replacement identity. This package is its source. Updating it does not deploy the identity to websites, editors, or distribution packages. Review the [visual board](brand-preview.html) before a coordinated rollout. The [research notes](RESEARCH.md) record the decision and supporting evidence.

## Identity and voice

Write the project name **beskid**, including at the start of a sentence. The identity connects mountain terrain with the clarity and structure of a programming language; it is an original geometric abstraction, not a map of a particular summit.

Use direct language, runnable examples, concrete benefits, and honest trade-offs. Welcome people into the language. Avoid elitist climbing metaphors, inflated performance claims, and unexplained compiler jargon. “A clearer way to the summit” is exploration copy, not a required tagline.

## The master mark

Canonical geometry lives in [`src/lib/brand.ts`](src/lib/brand.ts), in `MARK_POLYGONS`. Every production SVG, PDF, and Lottie mark is generated from these same coordinates.

- Canvas: `120 × 120` units.
- Visible bounds: x = 12–108, y = 24–96.
- Left summit: `(42, 38)`; right summit: `(86, 24)`.
- Two closed polygons, solid fill, no strokes, gradients, shadows, or translucent detail.
- Preserve both forms and the open space between them; do not connect, rotate, skew, or independently reposition them.
- Curves in outlined lettering are intentional. The old blanket prohibition on Bézier paths does not apply to typography.

A **mark** is the mountain symbol alone. A **wordmark** is the drawn name. A **lockup** is their fixed arrangement. These terms describe artwork, not new product constructs.

## Color

All hexadecimal values are sRGB. Color names describe this identity, not universal UI semantic tokens.

| Color | Hex | Role |
|---|---|---|
| Emerald | `#047857` | Primary mark on white or limestone |
| Light emerald | `#6EE7B7` | Reversed mark on deep forest |
| Deep forest | `#102D2A` | Primary wordmark, dark surface, body text on limestone |
| Limestone | `#F5F3EB` | Warm light surface; reversed lettering |
| Deep emerald | `#064E3B` | Supporting UI accent; not a separate master logo variant |
| Black / white | `#000000` / `#FFFFFF` | Single-ink reproduction and reversed artwork |

The horizontal dark asset is entirely light emerald on transparent background; the stacked dark asset includes a deep forest background and limestone lettering. Do not put either reversed asset on a light surface. Use the black or white master when the production process supports one ink only.

### Interactive palette preview

The Ridge preview offers four paired greens. Light/dark mode changes the whole page and its logo samples.

| Palette | Light-mode mark | Dark-mode mark |
|---|---|---|
| Forest | `#087F70` | `#64D8BC` |
| Pine | `#166534` | `#86EFAC` |
| Moss | `#4D6B32` | `#B6D785` |
| Emerald — selected, current exports | `#047857` | `#6EE7B7` |

Emerald is the approved production palette and the preview default. Forest, Pine and Moss remain exploratory comparisons. Switching the preview does not change the Emerald SVG, PDF or Lottie exports. The contrast figures below apply to Emerald with the preserved brand surfaces.

Keep the existing shared UI theme surfaces when applying the new accent colors. Brand ink (`#102D2A`) and paper (`#F5F3EB`) remain unchanged; this logo palette does not require a product-wide surface recolor.

### Contrast and accessibility

Calculated from the WCAG relative-luminance formula:

| Foreground / background | Contrast | Use |
|---|---:|---|
| Emerald / white | 5.48:1 | Logo and normal text |
| Emerald / limestone | 4.94:1 | Logo and normal text |
| Light emerald / deep forest | 9.63:1 | Reversed logo and text |
| Deep forest / limestone | 13.21:1 | Preferred body copy |
| Light emerald / white | 1.52:1 | Do not use |
| Deep emerald / limestone | 8.75:1 | Supporting accent and text |

W3C exempts logotypes from the text contrast requirement; that exception does not extend to general brand-colored UI text. Normal text requires 4.5:1; qualifying large text requires 3:1. These ratios describe solid colors, not a guarantee about every rendered pixel. [W3C: Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)

For a home link whose sole content is the logo, use `alt="beskid home"`. Where visible adjacent text already names the link, use `alt=""` for the redundant image. Inline SVG exports include an accessible name; decorative inline usage should remove that name and use `aria-hidden="true"`. Provide a visible keyboard focus indicator on the link. [W3C: Functional Images](https://www.w3.org/WAI/tutorials/images/functional/)

```html
<a href="/">
  <img src="/beskid-logo-horizontal.svg" alt="beskid home" width="180" height="60">
</a>
```

## Typography

- Wordmark: Inter Bold (700), lowercase, tracking `−0.03125em` (−2 units at 64-unit font size).
- Service descriptor: Inter Medium (500), lowercase, normal tracking.
- UI/body text: Inter Regular (400), with system sans-serif fallback.
- Code: the product's existing monospace stack; do not make code part of the logo.

All exported SVG lettering is outlined at generation time. It renders without installed fonts, external resources, or browser-specific text measurement. Do not retype the wordmark for a production logo. The preview uses locally installed Inter for editorial text; its logo assets remain font-independent. Inter is distributed under the SIL Open Font License; retain the font's supplied license when redistributing font files. [Inter project](https://rsms.me/inter/)

## Clear space and minimum size

Define **u** as 12 units on the 120-unit master. Keep at least **u** of clear space around the visible artwork. At 24px canvas size, u = 2.4px. Embedded SVG padding counts toward this distance; surrounding layout must provide any remainder. Use 2u when space permits. Do not crop SVG viewBoxes to make the symbol appear larger in a lockup.

| Asset | Minimum rendered size | Guidance |
|---|---|---|
| Parent mark | 16 × 16px | Favicon only at 16px; prefer 24px or larger |
| Horizontal logo | 144px wide | Prefer 180px in navigation |
| Stacked logo | 96px wide | Prefer 120px or larger |
| Service icon | 48 × 48px | Use the parent mark plus an adjacent service label below this size |
| Service horizontal lockup | 230px wide | Keeps the service descriptor near 10px |
| Service stacked lockup | 144px wide | Prefer 180px or larger |

These are design starting points checked in the local specimen, not universal printing guarantees. Proof small physical applications in the target process. For embroidery or stamping, use single-ink artwork and preserve the diagonal opening.

## Asset map

| Files | Content |
|---|---|
| `beskid-icon.svg` | Emerald parent mark, transparent, 120 × 120 |
| `beskid-icon-{dark,black,white}.svg` | Light emerald, black, or white parent mark, transparent |
| `beskid-logo-horizontal.svg` | Emerald mark + deep forest wordmark, 360 × 120 |
| `beskid-logo-horizontal-{dark,black,white}.svg` | Light emerald, black, or white horizontal lockup, transparent |
| `beskid-logo-stacked.svg` | Light stacked lockup, 240 × 240 |
| `beskid-logo-dark.svg` | Stacked lockup on deep forest, 240 × 240 |
| `beskid-logo-wordmark.svg` | Deep forest wordmark alone, 240 × 90 |
| `icon-{service}.svg` | Service signature, 120 × 120 |
| `service-{service}-{horizontal,stacked,dark}.svg` | Service lockups, 460 × 120 or 240 × 260 |
| `beskid-brand-kit.pdf` | Two-page vector specimen, light and dark |
| `beskid-logo-static.json` | Static emerald Lottie mark |
| `beskid-logo-draw.json` | Emerald Lottie opacity reveal; retained filename does not imply stroke drawing |
| `brand-preview.html` | Ridge-only palette/mode preview, production family, actual-size samples |

### Service family

The parent Ridge mark stays unchanged. Each service mark composes its meaning across the full silhouette, with both peaks participating. Bold polygon bodies and structural channels express compilation, access, reference, reading, execution, navigation, delivery, publication and code relationships. The forms are authored directly on the 120-unit canvas. Service lettering remains in the lockup.

Service SVGs use luminance masks: white body regions remain visible and black cuts remove artwork. The channels are transparent, so the surrounding surface shows through. When embedding multiple SVGs inline, give every mask a unique ID and update its `url(#...)` reference; repeated copies of the same service must not share document IDs. External `<img>` assets keep separate SVG documents.

The preview includes an enlarged gallery of all nine integrated service icons alongside their lockups. These are the existing core, auth, standard, book, learn, website, tracker, pckg and nexus services.

| File identifier | Public descriptor | Service symbol |
|---|---|---|
| `beskid-core` | core | Source branches converging into an output route |
| `auth` | auth | Ridgeline shield surrounding a protected passage |
| `platform-spec` | standard | Reference spine with aligned rules |
| `book` | book | Two peaked pages joined by a shared binding |
| `learn` | learn | Execution chevron folding through both peaks toward a result |
| `website` | website | Open entry passage beneath a rising roof |
| `tracker` | tracker | Continuous stepped delivery route reaching the summit |
| `pckg` | pckg | Mountain-crowned publication layers |
| `nexus` | nexus | Repository branches meeting at a shared graph junction |

The `platform-spec` filename identifier remains stable; its visible descriptor is **standard**, matching the public standard under `/docs/standard/`. Do not write redundant labels such as “beskid Beskid Auth.” Service cue geometry has one implementation in `src/components/icons.ts`.

## Motion

Use the static mark by default. The supplied reveal changes opacity only; its settled geometry matches the static asset. Play once and leave the final frame visible. Never use a looping logo to imply compiler progress. Respect `prefers-reduced-motion` by selecting the static SVG or static Lottie; the JSON animation cannot enforce the host application's preference itself.

## Production and maintenance

```sh
cd site/beskid_brand
pnpm install --ignore-workspace --frozen-lockfile
pnpm build
pnpm check
pnpm all
```

This standalone package has its own `pnpm-lock.yaml`. `pnpm all` cleans only an explicit list of generated files and regenerates SVG, HTML, PDF, and Lottie. Never use a wildcard that removes source JSON or configuration. The renderer overwrites only its owned output names.

Review `brand-preview.html` after geometry, typography, or color changes. Check the smallest examples, dark surfaces, monochrome variants, and all service names. Commit source and regenerated deliverables together. Old mesh/contour sources have been removed from this package; do not restore them as a second drawing path.

Brand asset and trademark treatment is described in the repository's [LICENSING.md](../../LICENSING.md). These guidelines do not grant additional rights or imply trademark clearance.
