# wayfinder:research

## Question

Which design tokens from `beskid_web_common/packages/beskid-ui/src/styles/` should the learn site adopt to align with other Beskid services?

Investigate:
1. Catalog all CSS custom properties defined across beskid-ui stylesheets (theme.material.css, hub.css, book.css, platform-spec-core.css, landing.css, etc.)
2. Compare against the current learn site tokens in `site/learn/src/styles.css` — which are duplicated, which are missing, which are inconsistent?
3. Check what tokens other sites (website, platform-spec, auth) use for spacing, typography, transitions, and surfaces
4. Identify a recommended set of tokens the learn site should standardize on

Output: a token map — what to adopt, what to drop, what to add.

---

## Answer

### 1. Catalog of All CSS Custom Properties in beskid-ui

#### theme.material.css (the canonical token file)

**Brand tokens — dark `:root`:**

| Token | Value |
|-------|-------|
| `--beskid-material-seed` | `#0ea5a3` (teal) |
| `--beskid-fluent-accent` | `var(--beskid-material-seed)` |
| `--beskid-fluent-neutral` | `#3f4948` |
| `--beskid-primary` | `#7cf3ef` |
| `--beskid-on-primary` | `#003736` |
| `--beskid-primary-container` | `#00504e` |
| `--beskid-on-primary-container` | `#96fffb` |
| `--beskid-secondary` | `#b4cccb` |
| `--beskid-secondary-container` | `#354b4a` |
| `--beskid-surface` | `#0f1414` |
| `--beskid-surface-variant` | `#3f4948` |
| `--beskid-outline` | `#899392` |
| `--beskid-outline-variant` | `#3f4948` |
| `--beskid-topbar-height` | `3rem` |
| `--sl-font` | `ui-sans-serif, system-ui, sans-serif` |
| `--sl-font-mono` | `'SFMono-Regular', Menlo, Monaco, Consolas, ...` |

**Platform-spec surface tokens — dark `:root` (derived via `color-mix`):**

| Token | Derivation |
|-------|------------|
| `--platform-spec-surface` | `color-mix(in srgb, var(--beskid-surface) 92%, black)` |
| `--platform-spec-surface-muted` | `color-mix(in srgb, var(--beskid-surface-variant) 44%, transparent)` |
| `--platform-spec-surface-strong` | `color-mix(in srgb, var(--beskid-surface) 96%, black)` |
| `--platform-spec-outline` | `color-mix(in srgb, var(--beskid-outline) 58%, var(--beskid-outline-variant))` |
| `--platform-spec-divider` | `color-mix(in srgb, var(--platform-spec-outline) 54%, transparent)` |
| `--platform-spec-card-bg` | `color-mix(in srgb, var(--platform-spec-surface-strong) 68%, transparent)` |
| `--platform-spec-card-border` | `var(--platform-spec-divider)` |
| `--platform-spec-badge-bg` | `color-mix(in srgb, var(--beskid-primary-container) 38%, transparent)` |
| `--platform-spec-badge-text` | `color-mix(in srgb, var(--beskid-primary) 78%, white)` |
| `--platform-spec-overlay-scrim` | `color-mix(in srgb, var(--beskid-surface) 72%, transparent)` |
| `--platform-spec-tab-indicator` | `var(--beskid-primary)` |
| `--platform-spec-tab-active-bg` | `color-mix(in srgb, var(--beskid-primary-container) 44%, transparent)` |
| `--platform-spec-tab-text` | `color-mix(in srgb, var(--beskid-primary) 84%, white)` |
| `--platform-spec-tab-text-active` | `color-mix(in srgb, var(--beskid-primary) 70%, white)` |
| `--platform-spec-edge-label-bg` | `color-mix(in srgb, var(--platform-spec-surface-strong) 90%, white)` |
| `--platform-spec-edge-label-stroke` | `color-mix(in srgb, var(--platform-spec-surface-strong) 98%, white)` |

**Graph node tokens (dark):**
`--platform-spec-graph-node-root-fill`, `--platform-spec-graph-node-root-stroke`, `--platform-spec-graph-node-root-text`, `--platform-spec-graph-node-domain-fill`, `--platform-spec-graph-node-domain-stroke`, `--platform-spec-graph-node-domain-text`, `--platform-spec-graph-node-area-fill`, `--platform-spec-graph-node-area-stroke`, `--platform-spec-graph-node-area-text`, `--platform-spec-graph-node-feature-fill`, `--platform-spec-graph-node-feature-stroke`, `--platform-spec-graph-node-feature-text`, `--platform-spec-graph-edge-stroke`

**Light theme (`html[data-theme='light']`):**
All of the above are re-defined with light-mode values. The brand tokens shift to light equivalents (e.g. `--beskid-surface: #f4fbfa`), and the platform-spec tokens use different `color-mix` ratios targeting lighter surfaces.

**Starlight bridge (dark, in `@layer starlight.theme`):**
`--sl-color-*` tokens are mapped to beskid/platform-spec tokens. `--sl-color-bg`, `--sl-color-bg-nav`, `--sl-color-bg-sidebar`, `--sl-color-text`, `--sl-color-text-accent`, `--sl-color-hairline`, `--sl-color-hairline-light`, `--sl-color-hairline-shade`, `--sl-color-gray-1..7`, `--sl-color-black` — all derived from beskid brand tokens via `color-mix`.

#### book.css

| Token | Value |
|-------|-------|
| `--book-measure` | `42rem` |
| `--book-toc-min` | `12rem` |
| `--book-toc-max` | `20rem` |
| `--book-figure-max` | `28rem` |
| `--book-figure-gif-max` | `22rem` |
| `--book-nav-content-gap` | `1.35rem` |
| `--book-text-base` | `1.0625rem` |
| `--book-line-height` | `1.68` |

#### doc-areas.css

| Token | Value |
|-------|-------|
| `--platform-spec-nav-width` | `min(22rem, 28vw)` |
| `--platform-spec-nav-rail-collapsed` | `2.85rem` |

#### landing.css

Tokens are scoped under `.landing-root`:
`--landing-surface`, `--landing-muted`, `--landing-border`, `--landing-card`, `--landing-panel`, `--landing-band`, `--landing-band-alt`, `--landing-accent`, `--landing-on-accent`, `--landing-code-bg`, `--landing-code-fg`, `--landing-code-kw`, `--landing-code-type`, `--landing-gutter`, `--landing-container`, `--landing-terminal-chrome`. All are derived from `--beskid-*` or `--platform-spec-*` tokens.

#### platform-spec-graph-and-reader.css

Panel layout tokens:
`--platform-spec-panel-inline-pad`, `--platform-spec-panel-scroll-top-pad`, `--platform-spec-panel-scroll-bottom-pad`, `--platform-spec-panel-tabs-top-pad`, `--platform-spec-panel-tabs-bottom-pad`, `--platform-spec-panel-rel-item-pad-inline`, `--platform-spec-panel-rel-item-pad-block-start`, `--platform-spec-panel-rel-item-pad-block-end`, `--platform-spec-panel-rel-item-gap`, `--platform-spec-panel-width`, `--platform-spec-panel-top`, `--platform-spec-panel-bottom`.

#### hub.css, downloads.css, starlight-layout.css, view-transitions.css

No new custom properties defined. They consume existing tokens from `theme.material.css`.

#### shadcn-theme.css (from `@beskid/ui-react/src/styles/`)

**Dark theme (`html[data-theme="dark"]`):**

| Token | Derivation |
|-------|------------|
| `--background` | `var(--beskid-surface)` |
| `--foreground` | `color-mix(in srgb, var(--beskid-secondary) 82%, white)` |
| `--card` | `var(--platform-spec-card-bg)` |
| `--card-foreground` | `var(--foreground)` |
| `--popover` | `var(--platform-spec-surface-strong)` |
| `--popover-foreground` | `var(--foreground)` |
| `--primary` | `var(--beskid-primary)` |
| `--primary-foreground` | `var(--beskid-on-primary)` |
| `--secondary` | `color-mix(in srgb, var(--beskid-secondary-container) 55%, transparent)` |
| `--secondary-foreground` | `color-mix(in srgb, var(--beskid-secondary) 90%, white)` |
| `--muted` | `var(--platform-spec-surface-muted)` |
| `--muted-foreground` | `color-mix(in srgb, var(--beskid-outline) 78%, var(--beskid-secondary))` |
| `--accent` | `color-mix(in srgb, var(--beskid-primary-container) 42%, transparent)` |
| `--accent-foreground` | `var(--beskid-primary)` |
| `--destructive` | `#f2b8b5` |
| `--destructive-foreground` | `#601410` |
| `--border` | `var(--platform-spec-divider)` |
| `--input` | `color-mix(in srgb, var(--beskid-surface-variant) 72%, transparent)` |
| `--ring` | `color-mix(in srgb, var(--beskid-primary) 45%, transparent)` |
| `--radius` | `0.75rem` |
| `--sidebar` | `var(--platform-spec-surface)` |
| `--sidebar-foreground` | `var(--foreground)` |
| `--sidebar-primary` | `var(--beskid-primary)` |
| `--sidebar-primary-foreground` | `var(--beskid-on-primary)` |
| `--sidebar-accent` | `var(--platform-spec-tab-active-bg)` |
| `--sidebar-accent-foreground` | `var(--platform-spec-tab-text-active)` |
| `--sidebar-border` | `var(--platform-spec-divider)` |
| `--sidebar-ring` | `var(--ring)` |
| `--chart-1`..`--chart-5` | Derived from `--beskid-primary/secondary/outline` |

**Light theme (`html[data-theme="light"]`):**
Same structure, different `color-mix` ratios targeting lighter surfaces.

---

### 2. Learn Site Token Catalog (site/learn/src/styles.css)

The learn site currently defines these tokens in its own `styles.css`:

**Bespoke beskid-brand overrides (`:root` — hardcoded blue values):**

| Token | Learn Value (blue) | beskid-ui Value (teal) |
|-------|--------------------|------------------------|
| `--beskid-surface` | `#08111f` | `#0f1414` |
| `--beskid-primary` | `#86b7ff` | `#7cf3ef` |
| `--beskid-on-primary` | `#07111f` | `#003736` |
| `--beskid-primary-container` | `#173b70` | `#00504e` |
| `--beskid-on-primary-container` | `#e7edf8` | `#96fffb` |
| `--beskid-secondary` | `#c8d5ed` | `#b4cccb` |
| `--beskid-secondary-container` | `#1a2b45` | `#354b4a` |
| `--beskid-outline` | `#9aa9c2` | `#899392` |
| `--beskid-outline-variant` | `#334766` | `#3f4948` |
| `--beskid-surface-variant` | `#121f34` | `#3f4948` |

**Bespoke platform-spec overrides (`:root` — hardcoded blue):**

| Token | Learn Value | beskid-ui Derivation |
|-------|-------------|----------------------|
| `--platform-spec-surface` | `#0b1525` | `color-mix(in srgb, var(--beskid-surface) 92%, black)` |
| `--platform-spec-surface-muted` | `#16253b` | `color-mix(in srgb, var(--beskid-surface-variant) 44%, transparent)` |
| `--platform-spec-surface-strong` | `#101d31` | `color-mix(in srgb, var(--beskid-surface) 96%, black)` |
| `--platform-spec-divider` | `#2a3c58` | `color-mix(in srgb, var(--platform-spec-outline) 54%, transparent)` |
| `--platform-spec-card-bg` | `#0d182a` | `color-mix(in srgb, var(--platform-spec-surface-strong) 68%, transparent)` |
| `--platform-spec-tab-active-bg` | `#1b365d` | `color-mix(in srgb, var(--beskid-primary-container) 44%, transparent)` |
| `--platform-spec-tab-text-active` | `#fff` | `color-mix(in srgb, var(--beskid-primary) 70%, white)` |

**Learn-local shell tokens (`:root`):**

| Token | Value |
|-------|-------|
| `--beskid-border-inner` | `#263c61` |
| `--beskid-border-accent` | `#7da4e6` |
| `--beskid-surface-panel` | `rgba(13, 24, 46, 0.72)` |
| `--beskid-surface-hover` | `rgba(80, 120, 196, 0.25)` |
| `--beskid-text-primary` | `#e6edf6` |
| `--beskid-text-muted` | `#94a3c0` |
| `--beskid-radius-xl` | `14px` |
| `--beskid-ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` |

**Learn shadcn semantic tokens (`html:not([data-theme])`):**

| Token | Learn Value |
|-------|-------------|
| `--background` | `var(--beskid-surface)` |
| `--foreground` | `#e7edf8` (hardcoded) |
| `--card` | `var(--platform-spec-card-bg)` |
| `--card-foreground` | `#e7edf8` (hardcoded) |
| `--popover` | `var(--platform-spec-surface-strong)` |
| `--popover-foreground` | `#e7edf8` (hardcoded) |
| `--primary` | `var(--beskid-primary)` |
| `--primary-foreground` | `var(--beskid-on-primary)` |
| `--secondary` | `var(--beskid-secondary-container)` |
| `--secondary-foreground` | `#e7edf8` (hardcoded) |
| `--muted` | `var(--platform-spec-surface-muted)` |
| `--muted-foreground` | `#aebbd0` (hardcoded) |
| `--accent` | `var(--beskid-primary-container)` |
| `--accent-foreground` | `#fff` (hardcoded) |
| `--destructive` | `#f2b8b5` |
| `--destructive-foreground` | `#601410` |
| `--border` | `var(--platform-spec-divider)` |
| `--input` | `var(--platform-spec-surface-muted)` |
| `--ring` | `var(--beskid-primary)` |
| `--radius` | `.75rem` |

**@theme inline mappings:**

Standard shadcn `--color-*` → semantic token bridge present (same pattern as auth and platform-spec sites).

---

### 3. Diff: Inconsistencies and Missing Tokens

#### Critical: Beskid brand tokens are hardcoded with a BLUE palette instead of the shared teal

The learn site overrides every `--beskid-*` token with blue-tinted hex values. This means:
- The learn site **looks different** from every other Beskid service
- It **ignores** `theme.material.css` entirely by redefining tokens after the import
- If the shared theme is updated (e.g. a new brand color), the learn site won't pick it up
- The `material-theme` CSS import from `shadcn-entry.css` is effectively dead code — the learn site overrides every single token it defines

#### Critical: Platform-spec surface tokens are hardcoded hex values instead of `color-mix` derivations

The canonical approach (used by theme.material.css) derives platform-spec tokens from beskid brand tokens using `color-mix()`. This ensures surface tokens automatically adapt when the brand palette changes. The learn site's hardcoded hex values break this chain.

#### Critical: Shadcn selectors don't match the shared theme

| Aspect | shadcn-theme.css (shared) | learn site |
|--------|---------------------------|------------|
| Selector | `html[data-theme="dark"]` | `html:not([data-theme])` |
| Light selector | `html[data-theme="light"]` | None (no light theme support) |
| `--foreground` | `color-mix(in srgb, var(--beskid-secondary) 82%, white)` | `#e7edf8` |
| `--secondary` | `color-mix(in srgb, var(--beskid-secondary-container) 55%, transparent)` | `var(--beskid-secondary-container)` |
| `--accent` | `color-mix(in srgb, var(--beskid-primary-container) 42%, transparent)` | `var(--beskid-primary-container)` |
| `--accent-foreground` | `var(--beskid-primary)` | `#fff` |
| `--muted-foreground` | `color-mix(in srgb, var(--beskid-outline) 78%, var(--beskid-secondary))` | `#aebbd0` |
| `--input` | `color-mix(in srgb, var(--beskid-surface-variant) 72%, transparent)` | `var(--platform-spec-surface-muted)` |
| Missing | All `--sidebar-*`, `--chart-1..5` | Not present |

#### Tokens the learn site duplicates (and should delegate to beskid-ui)

Every token in `:root` that starts with `--beskid-*` or `--platform-spec-*` is a **duplicate** of what `theme.material.css` already defines. The learn site should import and use the canonical values, not redefine them.

#### Tokens the learn site is missing from beskid-ui

| Missing Token | Used By | Needed? |
|---------------|---------|---------|
| `--beskid-material-seed` | Fluent UI Bridge | Maybe (if using Fluent components) |
| `--beskid-fluent-accent` | Fluent UI Bridge | Maybe |
| `--beskid-fluent-neutral` | Fluent UI Bridge | Maybe |
| `--beskid-topbar-height` | Header layout | No (learn has its own header) |
| `--platform-spec-card-border` | Hub component | Yes (hub.css uses it) |
| `--platform-spec-outline` | Divider derivation | No (platform-spec-divider covers it) |
| `--platform-spec-overlay-scrim` | Hub backdrop | Yes (hub.css uses it) |
| `--platform-spec-tab-indicator` | Tab chrome | Maybe |
| `--platform-spec-tab-text` | Tab chrome | Maybe |
| `--platform-spec-badge-bg` | Badges | No |
| `--platform-spec-badge-text` | Badges | No |
| All `--platform-spec-graph-*` | D3 map | No |
| All `--platform-spec-edge-label-*` | D3 map | No |
| `--sidebar, --sidebar-foreground, ...` | shadcn sidebar | No (no sidebar) |
| `--chart-1..--chart-5` | shadcn charts | Maybe |

#### Tokens unique to the learn site (beskid-ui does NOT define them)

| Token | Used In | Recommendation |
|-------|---------|---------------|
| `--beskid-border-inner` | `.option-btn`, editor/playground panes | Keep as learn-local |
| `--beskid-border-accent` | `.option-btn:hover` | Keep as learn-local |
| `--beskid-surface-panel` | `.option-btn`, editor pane | Keep as learn-local |
| `--beskid-surface-hover` | `.option-btn:hover` | Keep as learn-local |
| `--beskid-text-primary` | `.option-btn` | Keep as learn-local |
| `--beskid-text-muted` | `.playground-mode-label` | Keep as learn-local |
| `--beskid-radius-xl` | Editor/terminal/playground panes | Keep as learn-local |
| `--beskid-ease-out` | Animation keyframes | Consider moving to beskid-ui as `--beskid-ease-out` if other sites need it |

These are "learn-specific shell tokens" used for the editor/terminal/playground/option-button components that are unique to the learn experience. They are legitimate site-local design decisions.

---

### 4. What Other Sites Use

#### site/platform-spec (reference implementation)

**File:** `site/platform-spec/src/styles.css`

```css
@import "@beskid/material-theme";              /* ← brings in theme.material.css */
@import "@beskid/ui-react/styles/shadcn-entry.css"; /* ← brings in shadcn-theme.css + beskid-tokens.css */
@import "@beskid/beskid-ui/styles/hub.css";

html[data-theme="light"],
html[data-theme="dark"] {
  --background: var(--beskid-surface);
  --foreground: var(--beskid-on-primary-container);
  --card: var(--platform-spec-card-bg);
  /* ... all shadcn tokens mapped to beskid/platform-spec tokens */
  --radius: 0.75rem;
}
```

Key patterns:
- Imports the **full** `@beskid/material-theme` (shared teal theme)
- Maps shadcn tokens directly to beskid variables (NO hardcoded hex values)
- Uses `html[data-theme="light"], html[data-theme="dark"]` selectors (supports light/dark)
- Has `@theme inline` with radius tokens and `--font-sans`

#### site/auth

**File:** `site/auth/src/styles.css`

```css
@import "@beskid/ui-react/styles/shadcn-entry.css";

@theme inline {
  --font-sans: ...;
  /* shadcn color mappings only — no beskid/ overrides */
}
```

Key patterns:
- Auth does NOT import `@beskid/material-theme` — it relies on `shadcn-entry.css` alone
- Auth does NOT hardcode any `--beskid-*` overrides — it trusts the shared theme
- Auth only maps shadcn `--color-*` → semantic tokens via `@theme inline`

#### site/website

No custom CSS files in `site/website/src/` — it's a pure Starlight site that pulls CSS entirely from beskid-ui (`@beskid/material-theme` + `hub.css` + `landing.css` + `shadcn-entry.css`).

---

## Updated Answer (fresh investigation 2026-07-31)

### Executive Summary

The learn site's root problem is that it **hardcodes a blue colour palette** directly into `:root`, overriding every `--beskid-*` and `--platform-spec-*` token that `shadcn-entry.css` defines. This means:
1. The learn site looks visually disconnected from every other Beskid service (which use the canonical teal palette from `theme.material.css`)
2. Changes to the shared theme never reach the learn site
3. Several shadcn tokens (`--foreground`, `--card-foreground`, `--accent-foreground`, `--muted-foreground`, etc.) are hardcoded hex values instead of derived from brand tokens via `color-mix()`

The fix is surgical: **delete the `:root` overrides, import `@beskid/material-theme`, and keep only the 8 learn-specific shell tokens** that have no equivalent in the shared design system.

---

### Token Map

#### ADOPT from beskid-ui (remove learn overrides, use canonical values)

| Token | Current learn value | Canonical beskid-ui value |
|-------|---------------------|---------------------------|
| `--beskid-surface` | `#08111f` (blue-black) | `#0f1414` (teal-black) |
| `--beskid-primary` | `#86b7ff` (blue) | `#7cf3ef` (teal) |
| `--beskid-on-primary` | `#07111f` | `#003736` |
| `--beskid-primary-container` | `#173b70` | `#00504e` |
| `--beskid-on-primary-container` | `#e7edf8` | `#96fffb` |
| `--beskid-secondary` | `#c8d5ed` | `#b4cccb` |
| `--beskid-secondary-container` | `#1a2b45` | `#354b4a` |
| `--beskid-outline` | `#9aa9c2` | `#899392` |
| `--beskid-outline-variant` | `#334766` | `#3f4948` |
| `--beskid-surface-variant` | `#121f34` | `#3f4948` |
| `--platform-spec-surface` | `#0b1525` | `color-mix(in srgb, var(--beskid-surface) 92%, black)` |
| `--platform-spec-surface-muted` | `#16253b` | `color-mix(in srgb, var(--beskid-surface-variant) 44%, transparent)` |
| `--platform-spec-surface-strong` | `#101d31` | `color-mix(in srgb, var(--beskid-surface) 96%, black)` |
| `--platform-spec-divider` | `#2a3c58` | `color-mix(in srgb, var(--platform-spec-outline) 54%, transparent)` |
| `--platform-spec-card-bg` | `#0d182a` | `color-mix(in srgb, var(--platform-spec-surface-strong) 68%, transparent)` |
| `--platform-spec-tab-active-bg` | `#1b365d` | `color-mix(in srgb, var(--beskid-primary-container) 44%, transparent)` |
| `--platform-spec-tab-text-active` | `#fff` | `color-mix(in srgb, var(--beskid-primary) 70%, white)` |
| `--background` | `var(--beskid-surface)` | same — but now points to teal surface |
| `--foreground` | `#e7edf8` (hardcoded) | `var(--beskid-on-primary-container)` (derived) |
| `--card-foreground` | `#e7edf8` (hardcoded) | `var(--foreground)` |
| `--popover-foreground` | `#e7edf8` (hardcoded) | `var(--foreground)` |
| `--secondary-foreground` | `#e7edf8` (hardcoded) | `var(--beskid-on-primary-container)` |
| `--muted-foreground` | `#aebbd0` (hardcoded) | `var(--beskid-outline)` |
| `--accent-foreground` | `#fff` (hardcoded) | `var(--beskid-primary)` |
| `--input` | `var(--platform-spec-surface-muted)` | `var(--beskid-outline-variant)` |

Also ADOPT (currently missing, added by `@beskid/material-theme`):
- `--beskid-material-seed`, `--beskid-fluent-accent`, `--beskid-fluent-neutral` (Fluent UI bridge)
- `--beskid-topbar-height` (used by hub.css header layout)
- `--platform-spec-card-border` (used by hub.css tiles)
- `--platform-spec-overlay-scrim` (used by hub.css dialog backdrop)
- `--platform-spec-tab-indicator`, `--platform-spec-tab-text` (tab chrome)
- `--platform-spec-outline` (divider derivation base)
- `--platform-spec-badge-bg`, `--platform-spec-badge-text` (badge components)
- All Starlight bridge tokens (`--sl-color-bg`, `--sl-color-text`, `--sl-color-gray-1..7`, etc.)

---

#### KEEP as learn-specific (no equivalent in beskid-ui)

| Token | Value | Justification |
|-------|-------|--------------|
| `--beskid-border-inner` | `#263c61` (should be derived from `--beskid-outline-variant`) | Used by `.option-btn`, editor/playground pane borders |
| `--beskid-border-accent` | `#7da4e6` (should be derived from `--beskid-primary`) | Used by `.option-btn:hover` |
| `--beskid-surface-panel` | `rgba(13, 24, 46, 0.72)` (should be derived from `--beskid-surface`) | Used by `.option-btn`, editor pane background |
| `--beskid-surface-hover` | `rgba(80, 120, 196, 0.25)` (should be derived from `--beskid-primary-container`) | Used by `.option-btn:hover` |
| `--beskid-text-primary` | `#e6edf6` (should be derived from `--beskid-on-primary-container`) | Used by `.option-btn` text |
| `--beskid-text-muted` | `#94a3c0` (should be derived from `--beskid-outline`) | Used by `.playground-mode-label` |
| `--beskid-radius-xl` | `14px` | Used by editor/terminal/playground pane border-radius |
| `--beskid-ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Used by all learn animations (card-entry, progress-fill, highlight-pulse) |

Note: These 8 tokens should be **derived from** beskid-ui brand tokens via `color-mix()` rather than hardcoded hex values, so they automatically adapt to theme changes.

---

#### DROP (remove from learn — already provided)

| Token | Reason |
|-------|--------|
| All `--beskid-*` brand overrides (10 tokens) | Redundant — `@beskid/material-theme` defines them |
| All `--platform-spec-*` surface overrides (7 tokens) | Redundant — `@beskid/material-theme` defines them with `color-mix` derivations |
| `--background` through `--radius` shadcn overrides (16 tokens) | Redundant — `shadcn-entry.css` already defines these under `html[data-theme="dark"]` / `html[data-theme="light"]` |
| `html { color-scheme: dark; }` | Already set by `shadcn-entry.css` |
| `html:not([data-theme]) { ... }` block | Wrong selector — shared theme uses `html[data-theme="dark"]` / `html[data-theme="light"]` |
| `@theme inline` shadcn mappings (12 `--color-*` tokens) | Should remain (required by Tailwind) — but values will resolve to canonical tokens after removing overrides |

---

### Recommended Unified `:root` Block

The learn site currently defines tokens in 3 separate blocks (lines 7-10 of `site/learn/src/styles.css`):
1. `:root` with brand/platform-spec overrides
2. `:root` with learn-local shell tokens
3. `html:not([data-theme])` with shadcn semantic tokens

After adoption, replace lines 1-11 with:

```css
@import "tailwindcss";
@import "@beskid/material-theme";                          /* NEW: canonical teal brand + platform-spec tokens */
@import "@beskid/ui-react/styles/hub.css";
@import "@beskid/ui-react/styles/shadcn-entry.css";
@source "../node_modules/@beskid/ui-react/src";

/* Learn-local shell tokens — derived from canonical beskid-ui brand tokens */
:root {
  --beskid-border-inner: color-mix(in srgb, var(--beskid-outline-variant) 78%, transparent);
  --beskid-border-accent: color-mix(in srgb, var(--beskid-primary) 62%, var(--beskid-outline-variant));
  --beskid-surface-panel: color-mix(in srgb, var(--beskid-surface) 82%, transparent);
  --beskid-surface-hover: color-mix(in srgb, var(--beskid-primary-container) 18%, transparent);
  --beskid-text-primary: var(--beskid-on-primary-container);
  --beskid-text-muted: color-mix(in srgb, var(--beskid-outline) 78%, var(--beskid-secondary));
  --beskid-radius-xl: 14px;
  --beskid-ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}

html {
  color-scheme: dark;
}

/* shadcn semantic layer — delegates to beskid-ui tokens (no hardcoded values) */
html[data-theme="dark"] {
  --background: var(--beskid-surface);
  --foreground: var(--beskid-on-primary-container);
  --card: var(--platform-spec-card-bg);
  --card-foreground: var(--foreground);
  --popover: var(--platform-spec-surface-strong);
  --popover-foreground: var(--foreground);
  --primary: var(--beskid-primary);
  --primary-foreground: var(--beskid-on-primary);
  --secondary: var(--beskid-secondary-container);
  --secondary-foreground: var(--beskid-on-primary-container);
  --muted: var(--platform-spec-surface-muted);
  --muted-foreground: var(--beskid-outline);
  --accent: var(--beskid-primary-container);
  --accent-foreground: var(--beskid-primary);
  --destructive: #f2b8b5;
  --destructive-foreground: #601410;
  --border: var(--platform-spec-divider);
  --input: var(--beskid-outline-variant);
  --ring: var(--beskid-primary);
  --radius: 0.75rem;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
}
```

---

### Impact Assessment

**Visual changes after adoption:**
- Background shifts from blue-black (`#08111f`) to teal-black (`#0f1414`)
- Primary accent shifts from blue (`#86b7ff`) to teal (`#7cf3ef`)
- All surface layers (cards, panels, muted areas) shift from blue-tinted to teal-tinted
- Text colours change subtly (e.g. `#e7edf8` → `#96fffb` for `--foreground`)
- Border colours change from `#263c61` to teal-derived values

**Non-breaking:**
- All learn-specific CSS classes (`.learn-shell`, `.lesson-view`, `.editor-terminal-grid`, `.playground-grid`, etc.) remain unchanged
- All animations (`card-entry`, `progress-fill`, `highlight-pulse`, `fade-in`) remain — only underlying colour values shift
- The `@theme inline` bridge to Tailwind `--color-*` tokens is preserved
- The `hub.css` and `shadcn-entry.css` imports remain

**What breaks:**
- Nothing structurally breaks. The 8 learn-local tokens have been expressed as `color-mix()` derivations from canonical beskid tokens, so they automatically track the shared theme.
- The hardcoded `#10b981` (green) and `#8fb0ff` (blue) border-left colours on `.hints-card` and `.questions-card` are visual-only accents that don't exist in the shared theme — they stay as-is.

---

### Verification Checklist

- [ ] Add `@import "@beskid/material-theme";` above `@import "@beskid/ui-react/styles/hub.css";`
- [ ] Delete the first `:root` block (lines 7) — all `--beskid-*` and `--platform-spec-*` overrides
- [ ] Replace the learn-local `:root` block with `color-mix()` derivations
- [ ] Change `html:not([data-theme])` selector to `html[data-theme="dark"]`
- [ ] Verify the hub launcher renders correctly (depends on `--platform-spec-overlay-scrim`, `--platform-spec-card-border`)
- [ ] Verify editor panes render correctly (`--beskid-border-inner`, `--beskid-surface-panel`, `--beskid-radius-xl`)
- [ ] Verify option buttons render correctly (`--beskid-border-inner`, `--beskid-border-accent`, `--beskid-surface-panel`, `--beskid-surface-hover`, `--beskid-text-primary`)
- [ ] Verify playground renders correctly
- [ ] Verify animations (`card-entry`, `progress-fill`, `highlight-pulse`) still animate smoothly
- [ ] Verify `hints-card` and `questions-card` left-border accent colours are still visible
- [ ] Run `pnpm build` in `site/learn/` and verify zero new CSS warnings
