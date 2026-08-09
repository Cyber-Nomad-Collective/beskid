# Website Blog and Learn Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver an editorial blog, authenticated Learn access, and one coherent accessible workspace layout.

**Architecture:** Retain stable Astro/Starlight blog routes but add a blog-aware presentation layer. Learn keeps its SPA and persisted mosaic, while the server completes the canonical Auth Hub callback and denies lesson/check/progress APIs without a verified session. The tab strip retains navigation semantics because desktop panels are simultaneously visible.

**Tech Stack:** Astro/Starlight, React 19, TypeScript, Bun, Vitest, `@beskid/ui-react`, `react-resizable-panels`.

## Global Constraints

- Preserve existing `/blog/*` URLs and all non-blog Starlight areas.
- Fail closed for missing, invalid, expired, or wrong-app Learn sessions.
- Do not introduce a duplicate mosaic/grid implementation or a new UI dependency.
- Keep selectable tabs and close controls separate buttons within one visual shell.
- Update root `CHANGELOG.md` under `Unreleased` after user-visible changes.

---

### Task 1: Make blog content a validated editorial surface

**Files:**
- Modify: `site/website/src/lib/blog.ts`
- Modify: `site/website/src/content.config.ts`
- Modify: `site/website/src/components/ReleaseBlogIndex.astro`
- Create: `site/website/src/components/starlight/BlogAwarePageTitle.astro`
- Create: `site/website/src/components/starlight/BlogAwareMarkdownContent.astro`
- Modify: `site/website/astro.config.mjs`
- Modify: `site/website/src/lib/blog.test.mjs`

- [ ] Write failing tests for deterministic equal-date sorting, required blog metadata, index archive links, and an article masthead.
- [ ] Run `pnpm test:blog` in `site/website` and confirm the new assertions fail.
- [ ] Add metadata validation and the conditional blog presentation layer; make the index feature the newest entry and list all remaining entries chronologically.
- [ ] Run `pnpm test:blog` and confirm it passes.

### Task 2: Complete fail-closed Learn authentication

**Files:**
- Modify: `site/learn/src/components/AuthGate.tsx`
- Modify: `site/learn/src/App.tsx`
- Modify: `site/learn/server.ts`
- Modify: canonical Learn Auth Hub registration files discovered from `site/auth` and `beskid_web_common`
- Create: `site/learn/src/components/AuthGate.test.tsx`
- Create: server session/auth contract tests adjacent to `site/learn/server.ts`

- [ ] Write failing tests proving anonymous and failed auth never render lesson controls, and protected Learn endpoints return 401 without a verified session.
- [ ] Run those tests and confirm the expected failure.
- [ ] Implement the canonical callback, verified sealed session, and endpoint authorization; require the application gate and remove login-based edit authorization.
- [ ] Run Learn auth tests and `pnpm typecheck` in `site/learn`.

### Task 3: Consolidate workspace presentation

**Files:**
- Modify: `site/learn/src/components/WorkspaceTabs.tsx`
- Modify: `site/learn/src/components/LessonWorkspace.tsx`
- Modify: `site/learn/src/styles.css`
- Delete: `site/learn/src/components/ResizableTileGrid.tsx`
- Delete: `site/learn/src/components/ResizableTileGrid.test.tsx`
- Modify: `site/learn/src/components/WorkspaceTabs.test.tsx`
- Modify: `site/learn/src/components/LessonWorkspace.test.ts`

- [ ] Write a failing tab contract test showing label and close controls share one active visual shell, and a mosaic test covering valid persisted nested layout.
- [ ] Run the focused workspace tests and confirm they fail on the old shell/obsolete layout contract.
- [ ] Put all tab geometry on the shared shell, retain separate buttons and keyboard behavior, and delete the unused grid implementation and styles.
- [ ] Run the focused workspace test suite and confirm it passes.

### Task 4: Verify artifacts and record the change

**Files:**
- Modify: `CHANGELOG.md`

- [ ] Run `pnpm test:blog && pnpm build` in `site/website`.
- [ ] Run `pnpm test && pnpm typecheck && pnpm build` in `site/learn`.
- [ ] Inspect generated blog pages and logged-out Learn output; run GitNexus `detect_changes` before any commit.
- [ ] Add concise `Unreleased` entries for the blog, Learn access, and workspace consolidation.
