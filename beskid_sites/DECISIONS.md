# Decisions — beskid_sites

## 1. Standalone pnpm workspace (not a root workspace member, not a submodule)

`beskid_sites/` is a self-contained pnpm workspace living inside the Beskid monorepo working tree, but it is **not** listed in the root `pnpm-workspace.yaml` and is **not** a git submodule.

Rationale:

- The root workspace already spans compiler (Rust), tracker, `beskid_web_common`, and the existing Astro/TanStack sites under `site/*`. Adding a second generation of TanStack Start site apps directly to the root workspace would entangle their install graph with the Astro-based sites and the Rust toolchain gates before the new apps are stable.
- A standalone workspace keeps its own `pnpm-workspace.yaml` catalogs, `biome.json`, `tsconfig.base.json`, and `.npmrc`, so the new site apps can evolve their dependency set (TanStack Start, Nitro, React 19) without forcing root-level overrides or catalog churn across unrelated lanes.
- It is **not** a submodule because the source lives in the same repository working tree (no separate remote, no pinned commit). It is simply a directory the root workspace does not yet glob. A later change can promote it into the root `pnpm-workspace.yaml` once the shell template and per-service apps are proven.

## 2. DRY: a single canonical React library — `@cyber-nomad-collective/beskid-ui-react`

`beskid_web_common` ships two UI packages:

- `beskid-ui` — a mixed Astro/React package (Starlight overrides, platform-spec reader chrome, vanilla client scripts, plus a small React surface).
- `beskid-ui-react` — a pure React shadcn component library.

The React parts of `beskid-ui` are **already relocated** into `beskid-ui-react`:

- `beskid-ui/src/react/BeskidHub.tsx` is byte-identical (modulo import paths) to `beskid-ui-react/src/hub/BeskidHub.tsx`. The React copy carries an explicit relocation comment:
  > "Relocated from @beskid/beskid-ui so React apps (platform-spec) can use it without pulling the Astro package's transitive deps (astro, trudoc, starlight)."
- `beskid-ui/src/react/LinkedAstFactsPanel.tsx` is a one-line re-export shim: `export { LinkedAstFactsView as LinkedAstFactsPanel } from "@cyber-nomad-collective/beskid-ui-react/graph"`.
- `beskid-ui/src/hub/icons.ts`, `beskid-ui/src/hub/beskid-hub-close-icon.ts`, and `beskid-ui/src/data/beskid-services.ts` are already present under `beskid-ui-react/src/hub/` (with import-path adjustments and trivial comment differences).

**DRY scan result.** A full scan of `beskid-ui/src/` for any React (`.tsx`/`.ts`) code not already present in `beskid-ui-react/src/` found **nothing to fold**:

- The only `.tsx` files in `beskid-ui` are the two `src/react/*` files above, both already canonicalized in `beskid-ui-react`.
- The remaining `.ts` files in `beskid-ui` (`src/doc-area.ts`, `src/platform-spec/*.ts`, `src/client/*.ts`) are Astro/server-only — they import `astro:content`, `node:fs/promises`, and `@cyber-nomad-collective/trudoc/platform-spec`, and manipulate the DOM directly (`document.documentElement`). They are not React code and belong to the Astro package.

**Decision:** copy only `beskid-ui-react` into `beskid_sites/packages/`. Do **not** create a duplicate `beskid-ui` package — that would be drift. The single `beskid-ui-react` package is the canonical React component library for every app in this workspace.

## 3. Catalog and override strategy

`beskid_sites/pnpm-workspace.yaml` declares two catalogs:

- `tanstack-start` — mirrors the root catalog so TanStack Start apps in `apps/*` resolve identical versions: `@tanstack/react-devtools 0.10.9`, `@tanstack/react-router 1.170.28`, `@tanstack/react-start 1.168.45`, `@tanstack/react-router-devtools 1.167.1`.
- `react` — `react`/`react-dom` `^19.2.0` and matching `@types/*`, so the shared library and every app pin one React 19 line.

The copied `beskid-ui-react` package references `catalog:react` for `react`, `react-dom`, `@types/react`, and `@types/react-dom`; all other dependencies keep their pinned public-npm versions (radix-ui, cmdk, lucide-react, recharts, sonner, vaul, @xyflow/react, @base-ui/react, etc.). The library has **no** `@beskid/*` or `@cyber-nomad-collective/*` runtime dependencies — its only scoped reference is a CSS `@import "@beskid/material-theme"` inside `src/styles/beskid-tokens.css`, which is resolved by the host app's Vite alias (see `site/auth/vite.config.ts`), not by the package graph. Therefore no GitHub Packages registry config is needed in `.npmrc`; `pnpm install` resolves entirely from the public npm registry.

Root-level pnpm overrides (uuid, devalue, @dagrejs/dagre, @dagrejs/graphlib, @tanstack/router-core) are **not** copied. They belong to the root workspace's broader graph; if a dedup conflict appears in this workspace, add a `pnpm.overrides` block to `beskid_sites/package.json` at that point — do not preemptively mirror.

## 4. Shell template and per-service Plan.md are out of scope here

This workspace sets up the foundation only: root config, the shared library, and an empty `apps/` directory (with `.gitkeep`). The TanStack Start shell template app and the per-service `Plan.md` files (one per site app to be built) are added by other agents. Each new app lands under `apps/<name>/` and consumes the shared library via a workspace dependency (`@cyber-nomad-collective/beskid-ui-react: "workspace:*"`).
