# Service: site/learn

> Original research for migrating `site/learn` into the `beskid_sites/`
> workspace. The research below is the planning basis; the migration is
> **PENDING** (master Plan Phase 7) — see Current Status.

## Current Status

**Migration: NOT STARTED.** `learn.beskid-lang.org` is still served by the
legacy `site/learn` Bun SPA + bespoke `Bun.serve` server. No
`beskid_sites/apps/learn/` directory exists yet.

- **Deployed:** yes — `learn.beskid-lang.org` (production), but from the
  **legacy** `site/learn` (Bun runtime, `ghcr.io/cyber-nomad-collective/beskid-learn`
  image, Coolify). Not yet part of `beskid_sites/`.
- **What's working (legacy):**
  - Vite + React 19 SPA, `Bun.serve` runtime, hand-rolled JWT session
    (HS256, `beskid_learn_session` cookie) bootstrapped from a Beskid
    auth-hub handoff token.
  - `/api/check` spawns the `beskid` CLI (`analyze`/`parse`/`tree`/`run`)
    in a temp file with a 25s timeout; `run` auto-stages an ABI-v5 native
    runtime kit via `compiler/scripts/stage-native-runtime-kit.sh`.
  - Learning catalog hardcoded in `src/data/learningCatalog.ts` (11
    exercises); `curriculum/` tree consumed only by the offline
    `scripts/check-lesson.mjs` runner.
  - File-backed progress at `.beskid-learn-progress.json`.
  - In-memory lesson CRUD (`POST/PUT /api/lessons/:id`) — non-durable,
    lost on restart.
- **Pending (master Plan Phase 7):**
  - Scaffold `beskid_sites/apps/learn` from the shell template; port the
    pure-React components + `learningCatalog.ts` + `curriculum/` with
    imports re-homed to `@cyber-nomad-collective/beskid-ui-react`.
    Introduce a TanStack Start route tree (`/`, `/lesson/:slug`,
    `/playground`).
  - Reimplement `/api/check` as a Nitro server route (compiler-spawning,
    sandboxed temp file, timeout/SIGKILL, expected-output matching,
    ABI-v5 runtime-kit staging). Replace `Bun.which`/`Bun.file` with Node
    equivalents.
  - Replace the hand-rolled JWT session + auth-hub handoff with the
    template's Authelia OIDC integration. Migrate
    `.beskid-learn-progress.json` to a `learn_progress` table in shared
    Postgres keyed by user + exercise.
  - Adopt the shell template's sidebar-items + topbar nav-slot services
    (view-mode toggle in left slot, user/avatar in right slot). Remove
    the compact `Sheet` fallback once the template's sidebar-disabled
    avatar dropdown covers it.
  - Update the Dockerfile (preserve the Rust stage + staged native runtime
    kit; switch the web stage to TanStack Start Nitro + Node).
  - Remove `site/learn` from the root `pnpm-workspace.yaml`; point
    `learn.beskid-lang.org` at the new Nitro service; retire `site/learn`.
- **Blockers / decisions needed:**
  - **ABI-v5 runtime kit staging.** Whether the new `beskid_sites`
    workspace (standalone, not in root workspace) can still reach
    `compiler/scripts/*` and `compiler/target/*` at runtime — keep learn
    depending on a repo-root compiler checkout, or ship the kit as a
    downloadable artifact. The production image copies the kit in, but the
    new workspace boundary may complicate the local-dev path.
  - **In-memory lesson CRUD.** Decide whether to port it with persistence,
    or drop it (it is already non-durable today).
  - **Monaco + xterm in SSR.** Must be `clientOnly`/`useEffect`-guarded;
    SSR import of these libs will break. The current SPA never SSRs, so
    this is a new constraint.
  - **`@beskid/beskid-ui` (non-React) material-theme CSS.** Confirmed
    absorbed into `@cyber-nomad-collective/beskid-ui-react` (per the
    website/platform-spec/tracker migrations); the learn port reuses
    that.

The phased approach and risks documented below remain the planning basis
for the pending migration.

---

## Current architecture

`site/learn` (package `beskid-learn`, `site/learn/package.json:2`) is a Rustlings-style interactive learning surface for the Beskid language. It is **not** an Astro/Vite markdown site — it is a custom SPA plus a hand-rolled Bun HTTP server.

- **Frontend**: Vite + React 19 SPA, single entry `index.html` → `src/main.tsx` → `src/App.tsx`. No router: the whole app is one `App` component using `useState` for view switching (`lesson` / `playground`) and active exercise (`site/learn/src/App.tsx:474`). `@tanstack/react-router` is a dependency (`package.json:25`) but is **not used** anywhere in `src/` (no router tree, no `createRouter`).
- **Server**: A bespoke `Bun.serve` runtime in `server.ts` (834 lines). It serves the built SPA from `dist/`, provides SPA fallback (`server.ts:819-830`), and exposes a hand-written JSON API:
  - `GET /api/exercises`, `GET /api/exercise/:id` — catalog from `src/data/learningCatalog.ts` (in-memory array of 11 exercises).
  - `POST /api/check` — runs learner code against the `beskid` CLI (`analyze`/`parse`/`tree`/`run`) in a temp file, with timeout and expected-output matching (`server.ts:502-591`). `run` auto-stages an ABI-v5 native runtime kit via `compiler/scripts/stage-native-runtime-kit.sh` (`server.ts:269-310`).
  - `POST/PUT /api/lessons/:id` — in-memory lesson CRUD (mutates the imported catalog object, no persistence).
  - `GET/POST /api/progress` — file-backed progress JSON at `.beskid-learn-progress.json` (`server.ts:627-645`).
  - `GET /api/auth/me`, `GET /api/auth/hub-finish`, `POST /api/auth/logout` — JWT (HS256) session sealed in `beskid_learn_session` cookie, bootstrapped from a Beskid auth-hub handoff token (`server.ts:67-159`).
- **Content pipeline**: Curriculum lives in `site/learn/curriculum/<NN-slug>/` with `lesson.md`, `start.bd`, `solution.bd`, and `obj/`. But the running app does **not** read these files — the catalog is hardcoded in `src/data/learningCatalog.ts:51-685` (titles, starter code, hints, questions, detailed markdown all inlined as string arrays). The `curriculum/` tree is only consumed by the offline `scripts/check-lesson.mjs` runner and the `lesson:check` / `check:all` npm scripts (`package.json:16-18`). `lessonPath` fields point at the curriculum files but are only metadata.
- **Shell**: Custom one-off shell in `App.tsx` — bespoke `learn-shell`/`learn-header`/`learn-grid`/`learn-sidebar` CSS layout, a sidebar toggle button (`PanelLeftClose/Open`), a compact-mode `Sheet` (from `@beskid/ui-react`), and a header with `BeskidHub` + view-mode buttons + `UserBadge`. Not derived from the tracker shell; no shared sidebar/topbar abstraction.
- **Build / deploy**: `vite build` → `dist/`; production image is `oven/bun:1.3.14-alpine` running `bun run server.ts` (`Dockerfile:63-87`). The Dockerfile has a Rust stage that builds `beskid_cli` and stages the native runtime kit, then copies both into the final image (`Dockerfile:24-58`). Published as `ghcr.io/cyber-nomad-collective/beskid-learn`, served at `learn.beskid-lang.org` via Coolify (`COOLIFY.md`).
- **Tests**: Vitest + jsdom + `@testing-library/react`. Component tests for `AuthGate`, `LessonContent`, `LessonWorkspace`, `WorkspaceTabs`, plus `server-routing.test.ts` and `lessonWorkspace/steps.test.ts`. Setup in `src/test-setup.ts` and `vitest.config.ts`.

## Coupling to beskid packages

Direct `@beskid/*` imports (from `site/learn/package.json:22-23` via `file:` links to `beskid_web_common`):

- `@beskid/ui-react` — primary React UI lib. Used by: `App.tsx`, `AuthGate.tsx`, `Playground.tsx`, `LessonCard.tsx`, `LessonEditor.tsx`, `lessonWorkspace/GuidedLessonRail.tsx`, `ProgressTracker.tsx`, `LessonContent.tsx` (via `src/styles.css` source scanning). Symbols used: `Badge`, `BeskidHub`, `Button`, `Card`, `Separator`, `AuthPageShell`, `Sheet`/`SheetContent`/`SheetHeader`/`SheetTitle` (subpath `@beskid/ui-react/ui/sheet`).
- `@beskid/beskid-ui` — used **only** for the material theme CSS alias `@beskid/material-theme` → `node_modules/@beskid/beskid-ui/src/styles/theme.material.css` (`vite.config.ts:11-14`, imported in `src/styles.css` via `@import "@beskid/material-theme"`). No JS imports from this package in `src/`.
- Stylesheet coupling: `src/styles.css` imports `@beskid/ui-react/styles/hub.css` and `@beskid/ui-react/styles/shadcn-entry.css`, and uses `@source "../node_modules/@beskid/ui-react/src"` for Tailwind v4 source scanning.
- Auth coupling: `src/lib/auth.ts` reuses the Beskid auth-hub flow (`https://auth.beskid-lang.org/login?app=learn`), and `server.ts` verifies a `beskid-auth-hub` signed JWT handoff (`iss: "beskid-auth-hub"`, `app: "learn"`) using a shared `LEARN_AUTH_SERVICE_TOKEN` (`server.ts:144-154`, `.env.example`). This is a parallel hand-rolled implementation of the same flow the tracker uses via `@beskid/auth-client` — **not** sharing that client.
- No coupling to `@beskid/trudoc`, `@beskid/server-observability`, or `@beskid/auth-client` despite all three being available in `beskid_web_common`.

## What moves cleanly

- **React 19 UI code**: `App.tsx` and all `src/components/*` are plain React function components with hooks. They port directly to the TanStack Start app shell with minimal change — mostly re-homing imports from `@beskid/ui-react` to `@cyber-nomad-collective/beskid-ui-react`.
- **Component library reuse**: `Badge`, `Button`, `Card`, `Separator`, `BeskidHub`, `AuthPageShell`, `Sheet` are already consumed from `@beskid/ui-react`, so the canonical `@cyber-nomad-collective/beskid-ui-react` (copied from the same source) covers them with no API change. The `@beskid/material-theme` CSS alias just needs to resolve to the new package's `theme.material.css`.
- **Learning catalog** (`src/data/learningCatalog.ts`) is self-contained TypeScript with one import from `#/components/lessonWorkspace/steps` (a type only). It can move verbatim.
- **Lesson content / curriculum files** (`curriculum/**`) are static markdown + `.bd`/`.sol` files; they move as resources unchanged. The `scripts/check-lesson.mjs` Node runner is repo-root-relative and decoupled from the server — moves as-is.
- **Auth gate + UserBadge** (`src/components/AuthGate.tsx`) is a small React wrapper around `@beskid/ui-react`'s `AuthPageShell`. It maps cleanly onto the shell template's Authelia (GitHub login) integration — the bespoke JWT handoff in `src/lib/auth.ts` is replaced by the template's auth, and `AuthGate` collapses into the template's `AuthGate` equivalent.
- **Custom shell → template shell**: The bespoke `learn-shell`/`learn-header`/`learn-sidebar` grid in `App.tsx:559-680` maps onto the shell template's sidebar-items + sidebar show/hide + topbar nav-slot services. The view-mode toggle (Lessons/Playground) fits the topbar left slot; `UserBadge`/sign-in fits the topbar right slot (and the "sidebar disabled → avatar dropdown with user data" template behaviour covers the compact `Sheet` fallback in `App.tsx:671-678`).
- **Reusable candidates for the shared lib**: `LessonCard`, `ProgressTracker`, `CodeHighlight` (markdown code block), `LessonContent` (react-markdown + remark-gfm wrapper) are generic enough to be promoted to `@cyber-nomad-collective/beskid-ui-react` if other learning-style surfaces appear. `LessonEditor` and the `lessonWorkspace/*` tiles are Beskid-specific and stay in the learn app.

## What requires migration

- **Server runtime**: `server.ts` is a Bun-native 834-line program (`Bun.serve`, `Bun.file`, `Bun.which`, `bun build`). The new architecture is TanStack Start (React + Nitro on Node). The `/api/check` endpoint that spawns the `beskid` CLI and stages the ABI-v5 runtime kit is the hard part — it must be reimplemented as a Nitro server route (`server/api/check.ts` or a TanStack Start server function), preserving: temp-file write, command resolution (`BESKID_BINARY` → PATH `beskid` → `cargo run -p beskid_cli`), `--plain` flag logic, timeout/SIGKILL, expected-output matching, and runtime-kit staging (`server.ts:269-310`, `server.ts:502-591`). `Bun.which` and `Bun.file` have no Node direct equivalent — replace with `which`-equivalent (`node:child_process` lookup or a `which` dep) and `node:fs` streaming.
- **Auth**: The hand-rolled HS256 JWT issue/verify + cookie sealing (`server.ts:67-159`) and the auth-hub handoff verification (`verifyLearnHandoff`) are **replaced wholesale** by the template's Authelia (GitHub login) integration backed by shared Postgres. `LEARN_SESSION_SECRET` / `LEARN_AUTH_SERVICE_TOKEN` go away. `src/lib/auth.ts`'s `fetchAuthUser`/`logoutUser` become template calls.
- **Routing**: There is no router today. Moving to TanStack Start requires introducing a real route tree — at minimum `/` (lesson list/workspace), `/lesson/:slug` (active exercise), `/playground`, plus the API routes above. The current `useState` view-mode switching becomes routes.
- **Progress persistence**: The file-backed `.beskid-learn-progress.json` store (`server.ts:627-645`) must migrate to the shared Postgres (per the target architecture: "Shared Postgres backs website + Authelia"). A `learn_progress` table keyed by user + exercise replaces the flat JSON.
- **Lesson CRUD**: The in-memory `POST/PUT /api/lessons/:id` handler mutates the imported catalog object (`server.ts:779-806`) and is inherently non-durable (lost on restart, never persisted). Decide whether to keep editable lessons at all in the new world; if yes, they need a real backing store.
- **Dockerfile**: The current image bundles the Rust-built `beskid` CLI + staged native runtime kit (`Dockerfile:24-58`). The new build must preserve this — the `/api/check` endpoint depends on the CLI binary and kit at runtime (`ENV BESKID_BINARY`, `BESKID_RUNTIME_PREFIX`). The web stage changes from `pnpm --dir site/learn run build` + `bun run server.ts` to the TanStack Start Nitro build (`vinxi build` / `react-start build`) + Node server. The Rust stage is unchanged.
- **Vite config**: `vite.config.ts` adds `react()` + `tailwindcss()` plugins and the `@beskid/material-theme` alias. TanStack Start uses its own Vite plugin chain (`@tanstack/react-start` plugin); the material-theme alias must be re-pointed at `@cyber-nomad-collective/beskid-ui-react` and the Tailwind v4 `@source` path in `src/styles.css` updated.
- **`pnpm-workspace.yaml` membership**: `site/learn` is currently a member of the root workspace (`pnpm-workspace.yaml:9`). The new `beskid_sites/` is a standalone workspace (own `pnpm-workspace.yaml`, not in root, not a submodule). The learn app moves from `site/learn` to `beskid_sites/apps/learn` and joins the new workspace; the root `site/learn` entry is removed.
- **Workspace deps for tests/dev**: `@types/bun` and `@vitejs/plugin-react` are Bun/Vite-specific; the TanStack Start app drops Bun types and uses the Start plugin. `vitest.config.ts` aliases stay.

## Risks & unknowns

- **`/api/check` security**: It spawns an external compiler on user-supplied code with a temp file and a 25s timeout (`server.ts:504-552`). Moving to Nitro must preserve the sandboxing (temp dir under `os.tmpdir()`, recursive cleanup in `finally`, SIGKILL on timeout). Nitro's worker/process model and any sandboxing differences from Bun need verification — this is the highest-risk migration surface.
- **ABI-v5 runtime kit staging**: The `run` command requires `compiler/scripts/stage-native-runtime-kit.sh` to have produced `compiler/target/native-runtime-kit` (or `BESKID_RUNTIME_PREFIX`). The Dockerfile stages it at build time (`Dockerfile:52-58`). Local dev currently relies on `just learn-deps` / `just learn-runtime-kit`. Whether the new `beskid_sites` workspace (which is meant to be standalone, not in the root workspace) can still reach `compiler/scripts/*` and `compiler/target/*` at runtime is an open question — the production image copies the kit in, but the new workspace boundary may complicate the local-dev path. Needs an explicit decision: keep learn depending on a repo-root compiler checkout, or ship the runtime kit as a downloadable artifact.
- **Catalog/curriculum drift**: `src/data/learningCatalog.ts` and `curriculum/**/*.md` are duplicated content maintained by hand. The current server ignores the markdown files at runtime; only `check-lesson.mjs` reads `start.bd`. Migration is a chance to consolidate, but any consolidation (e.g., loading the catalog from the curriculum tree at build time) is new scope and a behavior change — out of scope for a straight port unless explicitly requested.
- **Authelia vs. auth-hub**: The target says "Auth via Authelia (GitHub login)" and "Shared Postgres backs website + Authelia." Today learn uses the Beskid auth-hub JWT handoff with a per-app `LEARN_AUTH_SERVICE_TOKEN`. Whether Authelia fully replaces the auth-hub for all `site/*` apps, or coexists, is an architecture-level decision that must be settled before the learn port can drop its JWT code. Unknown until the shell template's auth design is finalized.
- **Monaco + xterm in SSR**: TanStack Start is SSR-capable. Monaco editor (`@monaco-editor/react`) and xterm (`xterm` + `@xterm/addon-fit`) are browser-only and currently mount in `useEffect`. They must be client-rendered only (`clientOnly` / `useEffect` guards); SSR import of these libs will break. The current SPA never SSRs, so this is a new constraint.
- **`@beskid/beskid-ui` (non-React) dependency**: learn only uses it for the material-theme CSS (`vite.config.ts:11-14`). The target React lib is purged of non-React — confirm the material-theme CSS ships inside `@cyber-nomad-collective/beskid-ui-react`, or learn keeps a separate CSS import path. Low risk but must be resolved or the theme breaks.
- **In-memory lesson CRUD is already broken**: `POST/PUT /api/lessons/:id` mutates an imported object and is lost on restart (`server.ts:779-806`). It is auth-gated but not persisted. Decide intentionally whether to port, persist, or drop it.
- **`dist/` served with SPA fallback** (`server.ts:605-630`) — Nitro/Start handles SPA fallback differently; verify client routes like `/playground` resolve correctly under the new server once a real router is in place (the router change mostly supersedes this).

## Recommended phased approach

1. **Phase 0 — Lib + template readiness (blocking, shared)**: Confirm `@cyber-nomad-collective/beskid-ui-react` exports `Badge`, `Button`, `Card`, `Separator`, `BeskidHub`, `AuthPageShell`, `Sheet/*`, plus the `material-theme` CSS, `hub.css`, and `shadcn-entry.css` styles. Confirm the shell template's Authelia auth + sidebar/topbar slot API. Do not start the learn port until these are stable.
2. **Phase 1 — Scaffolding & static port**: Create `beskid_sites/apps/learn` from the shell template. Port `src/data/learningCatalog.ts`, `curriculum/`, `scripts/check-lesson.mjs`, and the pure-React components (`LessonCard`, `ProgressTracker`, `CodeHighlight`, `LessonContent`, `AuthGate`/`UserBadge`) with imports re-homed to `@cyber-nomad-collective/beskid-ui-react`. Introduce a minimal TanStack Start route tree (`/`, `/lesson/:slug`, `/playground`) replacing the `useState` view switching. No backend yet — stub `/api/check` and auth against template mocks. Get tests green.
3. **Phase 2 — `/api/check` reimplementation**: Port `server.ts`'s `runBeskidCheck` + `resolveBeskidCommand` + `runCommand` + `ensureRuntimeKitForRunCommand` to a Nitro server route. Replace `Bun.which`/`Bun.file` with Node equivalents. Preserve temp-file handling, timeout/SIGKILL, `--plain` flag logic, expected-output matching, and the `analyze`/`parse`/`tree`/`run` command surface. Re-stage the ABI-v5 runtime kit in the Dockerfile (Rust stage unchanged). Verify the `/api/check` smoke checks from `COOLIFY.md:38-41` pass.
4. **Phase 3 — Auth + progress migration**: Replace the hand-rolled JWT session + auth-hub handoff with the template's Authelia integration. Migrate `.beskid-learn-progress.json` to a `learn_progress` table in the shared Postgres keyed by user + exercise. Drop `LEARN_SESSION_SECRET` / `LEARN_AUTH_SERVICE_TOKEN`. Decide on lesson CRUD (port with persistence, or drop).
5. **Phase 4 — Shell adoption + cleanup**: Replace the bespoke `learn-shell`/`learn-header`/`learn-sidebar` grid with the shell template's sidebar-items + sidebar show/hide + topbar nav-slot services (view-mode toggle in left slot, user/avatar in right slot). Remove the compact `Sheet` fallback once the template's sidebar-disabled avatar dropdown covers it. Remove `site/learn` from the root `pnpm-workspace.yaml`. Update Coolify compose / delivery docs to point at the new image path.

## Verdict

**PENDING — Medium, not yet started (master Plan Phase 7).** The entire
React surface and content catalog will move cleanly onto TanStack Start +
the canonical lib, but the bespoke 834-line Bun server (compiler-spawning
`/api/check` + ABI-v5 runtime-kit staging + hand-rolled JWT auth +
file-backed progress) is non-trivial to port to Nitro/Node and carries
real runtime/security risk that the SPA-only services in this migration do
not. `learn.beskid-lang.org` continues to be served by the legacy
`site/learn` until Phase 7 lands.
