# Wayfinder: Improve learn UI layout and fix compiler deployment

## Destination

A redesigned learn.beskid-lang.org with a horizontal tiled lesson workspace (per-lesson customizable tiles with tabs for terminals, source files, and a shared file explorer), aligned Beskid design tokens, view transitions and micro-interactions throughout. The beskid compiler binary deploys correctly to the container with graceful degradation when unavailable.

## Notes

- **Domain:** learn site UI (React/Vite/Tailwind), compiler Docker build pipeline (Rust/Bun), shared design system (@beskid/beskid-ui)
- **Skills:** codebase-design, prototype, tdd, changelog
- **Design tokens** live in `beskid_web_common/packages/beskid-ui/src/styles/`
- **Curriculum data** in `site/learn/src/data/learningCatalog.ts`
- **Server** in `site/learn/server.ts`
- **Dockerfile** in `site/learn/Dockerfile`
- Standing preference: fail closed, no half-migrations

## Decisions so far

- [001: Root cause of missing beskid binary](./001-research-compiler-build.md) — Binary built via multi-stage Dockerfile but missing verification. Hardened with `set -e`, pre-created output dir, explicit `test -x` check. Server now has `verifyBeskidBinary()` health check and graceful degradation.
- [002: Fix compiler deployment + graceful degradation](./002-task-fix-compiler-deployment.md) — Server startup health check, structured error responses instead of raw ENOENT, Dockerfile verification step.
- [003: Design token audit for learn site](./003-research-design-tokens.md) — Learn site hardcoded blue palette diverging from canonical beskid-ui teal theme. Fixed by importing `@beskid/material-theme`, using `color-mix()` derivations.
- [004: Tiled lesson workspace layout](./004-prototype-tile-workspace.md) — `LessonWorkspace` component with resizable tile grid, 6 tile types (Editor, Terminal, Content, Hints, Questions, Explorer), localStorage layout persistence, WorkspaceTabs, ResizableTileGrid. Legacy `LessonView` preserved as `__LessonViewLegacy`.
- [005: Shared file explorer component](./005-task-shared-explorer.md) — `FileExplorer` component extracted to `@beskid/ui-react/explorer` with accessible tree ARIA roles, keyboard navigation, file-type icons, active path highlighting, lazy loading support. `RepoExplorerDialog` refactored to use shared `FileExplorer`.

## Discovered and fixed

- **pckg styling**: Missing `@import "@beskid/material-theme"` — all design tokens were undefined. Added import + shadcn block + `data-theme="dark"`.
- **auth styling**: Had the alias but never imported `@beskid/material-theme`. Added import.
- **Platform-spec review bug**: Comments uneditable — added `updateComment`, inline comment bubble with markdown input, DOM range positioning.
- **Platform-spec document sections**: Added polished CSS for collapse/details sections, layout conformance badges, architecture graph loading/error states, related card grid.
- **Tree-sitter grammar**: Regenerated parser, rewrote highlights.scm (25+ capture groups), enhanced tags.scm for symbol navigation.
- **VSCode extension**: Updated TextMate grammar with 30+ missing keywords, semantic scope groups, string interpolation, `@types/vscode ^1.96.0` compatibility fixes, settings defaults improved.
- **Zed LSP**: Created `.zed/settings.json` + language config TOMLs for `.bd`, `.bproj`, `.bws` files.

## Out of scope

- AUR packaging
- Playground mode redesign beyond tile-compatibility
- Adding new curriculum lessons
- Auth flow changes
