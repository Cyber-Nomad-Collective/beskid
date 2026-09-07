# Nexus — Migration Notes

Migration of the `beskid_nexus/gitnexus-web/` Vite + React 19 SPA into the
`beskid_sites/` standalone pnpm workspace as `apps/nexus/`. This is a **full
copy** (not a rewrite): the Sigma.js / graphology / Mermaid explorer surface
and the `gitnexus-shared` data contracts move verbatim; only the shell chrome
and the `@beskid/*` dependency wiring change.

## What was copied

- `beskid_nexus/gitnexus-web/src/` → `apps/nexus/src/` (all components, hooks,
  lib, services, core, config, styles, vendor/leiden).
- `beskid_nexus/gitnexus-web/test/` → `apps/nexus/test/`.
- `beskid_nexus/gitnexus-web/e2e/` → `apps/nexus/e2e/`.
- `beskid_nexus/gitnexus-web/index.html` → `apps/nexus/index.html`.

## How `gitnexus-shared` was handled

`gitnexus-shared` is substantial (~4 600 lines across 38 files: graph types,
resilient fetch + circuit breaker, language detection, and the full
scope-resolution algorithm). Inlining the subset the web app uses would
duplicate the source of truth the CLI/server still maintains in
`beskid_nexus/gitnexus-shared/`. To preserve DRY, the package was copied
**verbatim** into `beskid_sites/packages/gitnexus-shared/` as a workspace
package and consumed via `workspace:^`.

- `packages/gitnexus-shared/package.json` exports source `.ts` files directly
  (`.` → `./src/index.ts`, `./test-helpers` → `./src/test-helpers.ts`), so no
  build step is required — Vite/Vitest/tsc resolve the workspace symlink to
  source. This mirrors how `@cyber-nomad-collective/beskid-ui-react` exports
  its `src/` in this workspace.
- The `scope-resolution/` subtree (~3 000 lines) is unused by the web app but
  ships with the package; it is dead weight for the web bundle but keeps the
  package a faithful fork of the CLI/server contract. Pruning it is a future
  decision (publish a slim web-only build vs. keep the full contract).

## Dependency changes (old → new)

| Old (gitnexus-web) | New (apps/nexus) | Reason |
| --- | --- | --- |
| `@beskid/beskid-ui` (`file:`) | `@cyber-nomad-collective/beskid-ui-react` (`workspace:^`) | `BeskidHub` + hub CSS absorbed into the canonical lib |
| `@beskid/ui-react` (`file:`) | `@cyber-nomad-collective/beskid-ui-react` (`workspace:^`) | Canonical lib (Button, settings, ui/* subpaths) |
| `@beskid/ui-react/settings` | `@cyber-nomad-collective/beskid-ui-react/settings` | Subpath export re-home |
| `#/components/ui/*` | `@cyber-nomad-collective/beskid-ui-react/ui/*` | Lib `./ui/*` subpath export (drops the tracker-style `#/` alias) |
| `@beskid/beskid-ui/styles/hub.css` | `@cyber-nomad-collective/beskid-ui-react/styles/hub.css` | Hub CSS re-home |
| `@beskid/material-theme` | `@cyber-nomad-collective/beskid-ui-react/styles/theme.material.css` | Theme CSS re-home |
| `gitnexus-shared` (`file:../gitnexus-shared`) | `gitnexus-shared` (`workspace:^`) | Workspace package |
| `@cyber-nomad-collective/trudoc` | **removed** | Dead code (zero imports) |
| `axios` | **removed** | Unused |
| `d3` | **removed** | Unused (the lib graph uses `d3-hierarchy`, not `d3`) |
| `lru-cache`, `uuid`, `zod`, `react-zoom-pan-pinch` | **removed** | Unused in src/ and tests |
| `react` / `react-dom` / `@types/react*` | `catalog:react` | Workspace catalog |
| `@types/node` | `^22.20.1` | Align with shell-template |

Sigma.js 3, graphology\*, `@sigma/edge-curve`, `mermaid`, `dompurify`,
`react-markdown`, `remark-gfm`, `react-syntax-highlighter`, `mnemonist`,
`pandemonium`, `next-themes`, `lucide-react` are kept as direct deps (the
Sigma whole-repo renderer is the core feature).

## Shell-template integration

The bespoke 89-line `nexus-app-shell.tsx` header is replaced by the shell
template's `AppShell` + `Topbar`, copied into `apps/nexus/src/shell/` and
adapted for a Vite SPA:

- `shell/app-shell.tsx` — topbar-only layout (`sidebarEnabled={false}`); the
  sidebar branch from the template is dropped to avoid pulling in
  `AppSidebar` (which depends on the template's TanStack router context).
- `shell/topbar.tsx`, `shell/user-menu.tsx`, `shell/shell-context.tsx`,
  `shell/shell-types.ts`, `shell/user.ts` — lifted from the template.
- `shell/theme-provider.tsx`, `shell/theme-toggle.tsx` — lifted from the
  template; the toggle is adapted to use the nexus app's centralized
  `@/lib/lucide-icons` re-export (which carries the custom GitHub mark).
  The old `components/theme-provider.tsx` / `components/theme-toggle.tsx`
  were deleted to keep a single shell theme surface.
- `nexus-app-shell.tsx` now composes `AppShell` and wires the nexus services
  into the topbar slots: left slot = `Beskid / Nexus` kicker + repo selector;
  right slot = symbol search, settings (admin), Connect MCP, `BeskidHub`.
  `ThemeToggle` is rendered by `Topbar` itself.

## Auth integration (SPA) — TODO

The shell template resolves the user **server-side** via a TanStack Start
server fn (`getShellUser`) that reads the Authelia-sealed session cookie
(`beskid_shell_session`, HS256 JWT). The nexus app is a **Vite SPA** with no
server fns, so it cannot call that fn directly.

Interim approach (`src/shell/shell-user.ts`):

- `SHELL_AUTH_MODE=mock` → return a fake admin user (dev without a backend).
  The mock is both an `AuthUser` (so settings/Connect MCP render) and a
  `ShellUser` (so the topbar avatar renders).
- otherwise → `null`; the nexus app's existing `fetchAuthMe` flow
  (same-origin `/api/auth/me` against the gitnexus backend) remains the
  source of truth for `AuthUser`, and `authUserToShellUser` adapts it for
  the topbar avatar.

**Future work (out of scope for this task):**

1. Convert the SPA to TanStack Start (see below) and adopt the template's
   Authelia OIDC flow + `getShellUser`/`requireShellUser` guards. This drops
   `OAuthSetupWizard`, the `setup` shell phase, `fetchSetupStatus`, and the
   `SESSION_SECRET`/`AUTH_HUB_PUBLIC_URL` env from the web side.
2. Decide the **serving model** (separate Nitro server vs. static bundle
   hosted by `gitnexus serve` on 8452). This gates CORS/cookie-domain work
   for the `/api` proxy and the same-origin `credentials: "include"` calls
   in `nexus-api.ts`.
3. Reconcile `AuthUser` (nexus: `login`, `isAdmin`, `ownedRepoIds`) with
   `ShellUser` (template: `username`, `groups`) once Authelia is the source.

## TanStack Start conversion — TODO

The app is kept as a **Vite SPA** (option (a) in the task brief) to preserve
the current serving behavior (`gitnexus serve` hosts the built bundle on
8452, same origin as `/api`). Converting to TanStack Start is documented as
a future task because it is gated by the serving-model decision above and
requires:

- A route tree (`/`, `/repo/:id`) replacing the `ShellPhase` state machine.
- SSR guards for Sigma.js / graphology / Mermaid / `react-syntax-highlighter`
  (all browser-only; today the SPA never SSRs).
- Re-pointing the Playwright `webServer` to the Nitro dev server.
- Moving the `/api` Vite dev-proxy to a Nitro dev-proxy / production
  same-origin config.

## Vite config changes

- The bespoke `vite.resolve-beskid-ui.ts` resolver (which walked
  `node_modules` for `@beskid/*` and fell back to the
  `beskid_web_common` monorepo source) is **deleted**. With
  `@cyber-nomad-collective/beskid-ui-react` as a normal workspace dependency,
  native resolution + a few explicit CSS/entry aliases suffice.
- `gitnexus-shared` resolves natively via the workspace package's `exports`.
- `#beskid-hub-entry` → `src/shell/hub-entry.ts` (no-op; the old
  `@beskid/beskid-ui` client entry registered web components; the lib's
  `BeskidHub` is a React component now).
- `#beskid-hub-css`, `#beskid-theme-css`, `@beskid/material-theme` → the
  canonical lib's `styles/*.css`.
- The dead `@anthropic-ai/sdk/lib/transform-json-schema` alias is dropped
  (the package was never a dependency and is never imported).
- `__REQUIRED_NODE_VERSION__` is now a static define (`22.12.0`) instead of
  being read from the adjacent `gitnexus/package.json` (which is no longer a
  sibling). The constant is exported from `config/ui-constants.ts` but
  unused elsewhere; kept to minimize churn.

## Files NOT copied (intentional)

- `bun.lock`, `bunfig.toml`, `pnpm-lock.yaml` — workspace uses a single root
  `pnpm-lock.yaml`.
- `dist/`, `playwright-report/`, `test-results/`, `node_modules/`,
  `*.tsbuildinfo`, `.DS_Store`.
- `vercel.json` — the Vercel fallback rebuilt `gitnexus-shared` then
  `gitnexus-web`; the workspace build does not need it.
- `TESTING.md` — referenced the `bun run test` commands; the new scripts use
  pnpm (see `package.json` scripts).
- `src/stubs/` — the hub stubs are replaced by `src/shell/hub-entry.ts` and
  the canonical lib's hub CSS.

## Verification status

See the final report in the task summary for `typecheck` / `test` / `build`
/ `biome check` results.
