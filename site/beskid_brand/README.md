# beskid brand

The Ridge identity: two solid mountain shoulders, lowercase Inter lettering, and the approved Emerald/light-emerald colors.

Start with the [interactive Ridge preview](brand-preview.html), [brand guidelines](BRAND.md), or [research and decisions](RESEARCH.md). The preview shows the selected Ridge family, four green comparisons, light/dark modes, an enlarged gallery of all nine service icons with full silhouettes grounded in each service’s purpose, and their lockups.

## Generate

This is a standalone pnpm package outside the root workspace membership.

```sh
cd site/beskid_brand
pnpm install --ignore-workspace --frozen-lockfile
pnpm build
pnpm check
pnpm all
pnpm sync:assets
```

Open `brand-preview.html` locally. It needs no server; the editable SVGs are self-contained and the page loads editorial Inter text from the installed package. Palette and mode controls update the page and logo samples. Emerald is the default and production palette. Other palettes are exploratory previews; switching them does not change the Emerald SVG, PDF or Lottie exports. Production black and white exports are provided separately.

## Deliverables

- 47 production SVGs: parent mark, horizontal/stacked/wordmark lockups, reversed and single-ink variants, nine service families.
- `beskid-brand-kit.pdf`: two-page vector specimen.
- `beskid-logo-static.json` and `beskid-logo-draw.json`: shared-geometry Lottie static/reveal.
- `brand-preview.html`: interactive Ridge preview with actual-size samples.

`src/lib/brand.ts` owns master geometry and identity colors. Components own arrangements; output adapters produce SVG, PDF and animation. SVG lettering is outlined, so the logos need no installed fonts. Service marks integrate both peaks using luminance masks with transparent channels; use unique mask IDs when repeating SVGs inline. The parent Ridge stays unchanged.

Cleanup deletes only named generated artifacts. It preserves source/configuration and unrelated files. Run regeneration after changing sources; do not hand-edit the generated logo family.

Preserve existing shared UI theme surfaces when applying Emerald accents. Brand ink and paper remain unchanged.

Emerald accent roles are also applied in the shared UI theme, preserving its existing surfaces. `pnpm sync:assets` regenerates the website and app favicons, Tracker PNG/ICO assets, editor and installer artwork, and shared Astro/React hub icon data. The command regenerates canonical SVGs before synchronizing consumers. Consumer assets are checked in so submodules can build independently. No deployment is performed. See repository [LICENSING.md](../../LICENSING.md) for brand rights.
