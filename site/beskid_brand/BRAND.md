# Beskid Brand Guidelines

> The Beskid brand uses flat geometric design — straight lines, sharp vertices, solid colors. No curves, no gradients, no transparency tricks. This reflects the language's philosophy: direct, honest, nothing hidden behind abstraction layers.

The single source of truth for all Beskid programming language branding. When in doubt, refer back here.

---

## Design Philosophy

### Flat Geometric Design

Every Beskid brand asset follows these hard constraints:

- **NO cubic beziers** — polylines and polygons only. Every curve is an illusion built from straight segments.
- **NO opacity** — fills are solid or absent. No `fill-opacity`, no `stroke-opacity`, no alpha channels.
- **NO gradients** — no `<linearGradient>`, no `<radialGradient>`. Flat color fields only.
- **NO arcs** — no `<path>` arc commands (`A` or `a`). Circles are approximated with octagons or higher-order polygons.
- **Stroke** — uniform `2px`, `stroke-linecap="round"`, `stroke-linejoin="round"`.

This isn't a stylistic whim. Beskid is a compiler — a tool that strips away abstraction and leaves only what's necessary. The brand should look like something a machine drew: deliberate, minimal, geometrically honest.

### The Geometric Mountain Motif

Every icon in the Beskid ecosystem carries the same mountain silhouette — a sharp, three-peak polyline that is the brand's signature. It is never altered, never scaled independently of its container, never softened.

```svg
<polyline points="15,72 40,30 60,56 82,24 106,72"
  fill="none" stroke="#3aac9e" stroke-width="2"
  stroke-linecap="round" stroke-linejoin="round"/>
```

- Three peaks — the central peak (`60,56`) is lower than the side peaks, giving it the asymmetrical character of a real ridgeline.
- The base line runs flat from `(15,72)` to `(106,72)` — a level horizon across all icons.
- No fill on the mountain itself — outline only. The mountain frames the service element below it.

---

## Brand Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Beskid Teal** | `#3aac9e` | Primary brand color. Logos, links, buttons, key UI elements on light backgrounds. |
| **Beskid Teal Light** | `#5eeadb` | Dark-background variant. Logos and accents on dark surfaces (`#0d1117`). |
| **Background Light** | `#ffffff` | Default document/website background. |
| **Background Dark** | `#0d1117` | Dark mode background. Matches GitHub dark — familiar to developers. |

### Rationale

Beskid Teal (`#3aac9e`) evokes the mineral greens of mountain lakes in the Beskid range — calm, focused, enduring. It sits between green and blue: green for growth (learning a language), blue for precision (systems programming). On dark backgrounds, the lighter `#5eeadb` preserves the same hue identity while maintaining WCAG AA contrast.

**Color constraints:** NO opacity modifiers, NO gradients, NO alpha channels. If an element needs to look lighter, use `#5eeadb`. If it needs to look darker, use a solid darker teal (TBD in final palette).

---

## Typography

| Role | Spec |
|------|------|
| **Primary font** | `system-ui, -apple-system, sans-serif` — native OS typeface, zero latency, no download. |
| **Logo wordmark** | Lowercase `"beskid"`, `font-weight: 400`, `letter-spacing: 4px`. Clean and understated. |
| **Code / monospace** | `SF Mono`, `Fira Code`, `Cascadia Code`, or any modern monospace with ligatures. |

No custom web fonts. The language should feel native to every platform it appears on.

---

## Logo Variants

All logos live in this directory as `beskid-{variant}.svg`.

| File | Description | Use case |
|------|-------------|----------|
| `beskid-icon.svg` | Icon-only mark — geometric mountain + diamond AST node. Square `120×120`. | Favicons, app icons, social avatars, any square-constrained context. |
| `beskid-logo-stacked.svg` | Icon above wordmark. `200×180`. Primary vertical lockup. | Default logo for README, docs, vertical layouts. |
| `beskid-logo-horizontal.svg` | Icon left of wordmark. `300×80`. | Website headers, navbars, horizontal banners. |
| `beskid-logo-dark.svg` | Stacked variant on `#0d1117` background, using `#5eeadb`. `200×180`. | Dark-mode headers, terminal splash screens, dark-themed pages. |

---

## Service Icons

Eight flat-design service icons live alongside the logos. Every icon shares the same mountain motif (above) plus one geometric service element (below). All icons are `120×120`, uniform `2px` strokes, no curves.

| File | Service | Element below mountain | Use case |
|------|---------|----------------------|----------|
| `icon-beskid-core.svg` | Beskid Core | Diamond polygon (AST node) | Compiler identity, language homepage, core tooling |
| `icon-auth.svg` | Beskid Auth | Flat-topped pentagon (shield) | Authentication service, login pages, OAuth flows |
| `icon-platform-spec.svg` | Platform Spec | Rectangle with horizontal rule lines (document) | Language specification, RFCs, standards documentation |
| `icon-learn.svg` | Beskid Learn | Open book — two angled rectangles | Tutorials, documentation, learning resources |
| `icon-website.svg` | Beskid Website | Octagon (globe approximation) with equator line | Public website, landing pages, marketing |
| `icon-tracker.svg` | Beskid Tracker | Three solid squares in a row (kanban/tasks) | Issue tracker, roadmap, task boards |
| `icon-pckg.svg` | Beskid Package Registry | Isometric box — front face + top face polygon | Package index, registry, dependency browser |
| `icon-nexus.svg` | Beskid Nexus | Three diamonds connected by lines (graph nodes) | Graph explorer, module dependency visualizer |

---

## Logo Usage

### Clear Space

Minimum padding around any logo lockup equals the **height of the lowercase `b`** in the wordmark (approximately the cap-height of the typeface at that size). No text, graphics, or UI chrome may enter this zone.

### Minimum Sizes

| Variant | Minimum |
|---------|---------|
| Icon (`beskid-icon.svg`) | `16×16 px` |
| Service icons (`icon-*.svg`) | `24×24 px` |
| Horizontal lockup (`beskid-logo-horizontal.svg`) | `120 px` wide |
| Stacked lockup (`beskid-logo-stacked.svg`) | `80 px` wide |

### Don'ts

- ❌ **Don't stretch** — always scale proportionally.
- ❌ **Don't recolor** — use the provided dark variant instead.
- ❌ **Don't add effects** — no drop shadows, glows, gradients, or outlines.
- ❌ **Don't add curves** — no cubic beziers, no arc commands, no rounded corners on any shape.
- ❌ **Don't use opacity** — solid fills only. No `fill-opacity`, no `opacity` attributes.
- ❌ **Don't rotate** — the mountain points up.
- ❌ **Don't use the wordmark alone as text** — always use the SVG.
- ❌ **Don't soften** — no rounded corners, no bezier curves, no `border-radius` tricks on brand elements.
- ❌ **Don't add transparency** — the mountain is never a watermark with an alpha channel. Solid colors only.

---

## File Naming Convention

```
beskid-{variant}.svg    # Logo lockups
icon-{service}.svg      # Service icons
```

Logo variants: `icon`, `logo-stacked`, `logo-horizontal`, `logo-dark`. Service icons: `beskid-core`, `auth`, `platform-spec`, `learn`, `website`, `tracker`, `pckg`, `nexus`. All lowercase, hyphen-separated. No version suffixes — the repo is the source of truth.

---

## Application Examples

### Website Header
`beskid-logo-horizontal.svg`, left-aligned, linked to `/`. Clear space enforced with CSS padding.

### Favicon
`beskid-icon.svg`, served as `favicon.svg` at `32×32` (browsers will scale down). Include a fallback `favicon.ico` if legacy support is needed.

### Social Media
`beskid-icon.svg` centered on a `#3aac9e` solid background, exported as PNG at the platform's recommended dimensions. No gradient backgrounds — flat teal only.

### Documentation
`beskid-icon.svg` as a watermark — placed `position: fixed`, bottom-right, `opacity: 0.04`, `z-index: -1`. This is the one exception to the no-opacity rule, and only because CSS opacity on a positioned element doesn't alter the source asset.

### Terminal / CLI
`beskid-logo-dark.svg` works well in terminal splash screens since it ships with its own dark background.

### Service Pages
Each service page uses its corresponding `icon-{service}.svg` in the page header, at `48×48`, paired with the service name in `system-ui`.

---

## Brand Voice

Beskid speaks like a seasoned climbing partner — competent, warm, never condescending.

| Do | Don't |
|----|-------|
| Clear, direct sentences | Corporate jargon ("leverage," "ecosystem," "seamless") |
| Technical precision, plain English | Hype, hyperbole, "revolutionary" |
| Acknowledge trade-offs honestly | Pretend the language does everything |
| Mountain metaphors — sparingly | Overwork the nature theme |

> **Short version:** *"A language you climb, not one handed to you."*

This is the tagline. Use it in READMEs, social bios, and conference talk abstracts. It captures the ethos: Beskid rewards effort, but the ascent is part of the experience.
