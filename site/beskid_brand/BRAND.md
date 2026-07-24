# Beskid Brand Guidelines

> The Beskid brand uses a **3D low-poly mesh** — an isometric wireframe mountain built from triangular facets, ridgelines, and connecting struts. No curves, no gradients. The mesh is the signature.

## Design Philosophy

### 3D Low-Poly Mesh

Every Beskid icon carries the same 3D mountain structure:

- **8 triangular facets** connecting a front ridgeline to a back ridgeline — filled at 10% opacity, creating a translucent faceted surface
- **Front ridgeline** (2.5px stroke, `#3aac9e`) — the emphasized silhouette, 3 asymmetric peaks
- **Back ridgeline** (1px stroke, `#1a6b62`) — offset (+10x, −8y) for isometric depth
- **5 vertical struts** (1.5px at 35% opacity) — connecting front→back vertices
- **Diamond AST node** below the mesh — the compiler identity mark

Hard constraints:
- **NO cubic beziers** — every line is a straight segment (polyline, polygon, line)
- **NO hex-alpha** (`#RRGGBBAA`) — use `fill-opacity` attribute for compatibility
- **NO gradients** — flat colors only
- **NO arcs** — no `<path>` arc commands

### The Mesh Coordinates

```typescript
// Front ridgeline — the visible silhouette
RIDGE_FRONT: [18,70] → [34,28] → [60,54] → [86,16] → [106,70]

// Back ridgeline — isometric offset
RIDGE_BACK:  [28,62] → [44,22] → [68,48] → [94,12] → [114,62]

// 8 triangular facets connecting the two ridges
MESH_FACETS: alternating triangles across 4 ridge segments
```

Three peaks — asymmetrical: left peak at y=28, center dip at y=54, right peak at y=16 (tallest). This asymmetry gives the silhouette the character of a real Beskid ridgeline.

## Brand Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Beskid Teal** | `#3aac9e` | Primary brand. Ridge, struts, facets, diamond, wordmark. |
| **Beskid Teal Dark** | `#1a6b62` | Back ridgeline (depth cue). |
| **Beskid Teal Light** | `#5eeadb` | Dark mode variant — replaces teal on `#0d1117` backgrounds. |
| **Background Light** | `#ffffff` | Default document/website background. |
| **Background Dark** | `#0d1117` | Dark mode. Matches GitHub dark. |

**Color constraints:** NO opacity modifiers on fill colors — use `fill-opacity` SVG attribute. NO gradients. NO alpha channels in hex.

## Typography

| Role | Spec |
|------|------|
| **Primary font** | `Inter, system-ui, -apple-system, sans-serif` |
| **Logo wordmark** | Lowercase `"beskid"`, `font-weight: 700`, `letter-spacing: 4px` |
| **Service name** | `font-weight: 300`, `letter-spacing: 1.5px`, secondary color (`#868e96`) |
| **Code / monospace** | `SF Mono`, `Fira Code`, `Cascadia Code` |

No custom web fonts required — Inter ships with `@fontsource/inter`.

## Logo Variants

| File | Description | Use case |
|------|-------------|----------|
| `beskid-icon.svg` | 3D mesh mountain + diamond. `120×120`. | Favicons, app icons. |
| `beskid-logo-stacked.svg` | Mesh above wordmark. `200×200`. | README, docs. |
| `beskid-logo-horizontal.svg` | Mesh left, wordmark right. `300×80`. | Headers, navbars. |
| `beskid-logo-dark.svg` | Stacked on `#0d1117` with `#5eeadb`. `200×200`. | Dark mode. |

## Service Icons

8 icons share the identical 3D mesh above, plus a unique geometric service accent below:

| File | Service | Accent |
|------|---------|--------|
| `icon-beskid-core.svg` | Beskid Core | Diamond (AST node) |
| `icon-auth.svg` | Beskid Auth | Pentagon shield |
| `icon-platform-spec.svg` | Platform Spec | Document rect with lines |
| `icon-learn.svg` | Beskid Learn | Open book (two angled polygons) |
| `icon-website.svg` | Beskid Website | 10-vertex globe + equator |
| `icon-tracker.svg` | Beskid Tracker | Three solid squares |
| `icon-pckg.svg` | Package Registry | Isometric box |
| `icon-nexus.svg` | Beskid Nexus | Three connected diamond nodes |

## Merged Service Logos

Each service has 3 lockups: `service-{name}-{horizontal,stacked,dark}.svg`

Horizontal: `[3D mesh] beskid ServiceName` (bold 700 + light 300 type)
Stacked: mesh above, "beskid" below, service name at bottom

## Logo Usage

### Minimum Sizes

| Variant | Minimum |
|---------|---------|
| `beskid-icon.svg` | `24×24 px` |
| `beskid-logo-horizontal.svg` | `150 px` wide |
| `beskid-logo-stacked.svg` | `100 px` wide |

### Don'ts
- ❌ Don't add curves — no beziers, no arcs
- ❌ Don't add gradients — flat colors only
- ❌ Don't use hex-alpha — use `fill-opacity` / `stroke-opacity`
- ❌ Don't recolor — use the dark variant
- ❌ Don't alter mesh coordinates — the asymmetry is intentional

## File Naming

```
beskid-{variant}.svg       # Logo lockups (icon, logo-stacked, logo-horizontal, logo-dark)
icon-{service}.svg         # Service icons
service-{service}-{layout}.svg  # Merged service lockups
```

## Brand Voice

> *"A language you climb, not one handed to you."*

Clear, direct sentences. Technical precision. Honest trade-offs.
No corporate jargon. No hype.
