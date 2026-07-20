# Beskid — Toolchain & Stack

## Toolchain
- **Checkout:** `./scripts/setup-environment.sh` (git submodules + root `bun install`—not Google `repo`)
- **Submodules:** day-to-day via lazygit (`U` sync / `P` recursive push); toolchain via `scripts/install-deps.sh` + `repo-deps.json`
- **Rust:** workspace in `compiler/`; `just replace` installs `beskid` + `beskid_lsp`, `just vscode` rebuilds the extension
- **Sites:** **Bun** for all site apps
- **CI:** compiler gate runs via Blacksmith Testbox (no Dagger); other gates in `beskid_infra/dagger/`; root `dagger.json`

## Tech Stack
- **Compiler:** Rust, AOT-only, host composition. Corelib in `compiler/corelib` (Beskid sources, not a Rust crate move)
- **pckg:** .NET package registry (Compose locally)
- **Sites:** `site/website` (book/landing), `site/platform-spec` (TanStack, Memgraph SOT), `site/auth`
- **Apps:** `beskid_tracker` (SQLite SOT), `beskid_nexus` (graph explorer), `beskid_web_common` (shared TS: `trudoc`, `@beskid/beskid-ui`, `@beskid/ui-react`)
- **Infra:** Coolify Compose (one service per lane), OpenBao secrets, Memgraph, Grafana monitoring at `monitor.beskid-lang.org`
- **Spec:** normative spec served from `spec.beskid-lang.org`; update before observable behavior changes

## Conventions
- **Git:** no `Co-authored-by`
- **Naming:** PascalCase types/functions/methods; camelCase locals/params; crates `beskid_<domain>`
- **Packages:** `@beskid/*` on GitHub Packages (not monorepo `file:` links); pin `^0.2.0`; refresh via `./scripts/sync-beskid-packages.sh`
- **Domains:** Coolify URLs use explicit ports per service (`https://<host>:<port>`); staging uses `stg-` prefix
- **UI:** match existing Fluent Blazor / `@beskid` patterns; hub launcher leftmost in navbars
- **Docs:** no emoji; Beskid Book tone (`book/00-why-beskid-exists/...`); prefer practical deploy/container guidance over abstraction

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **beskid** (59804 symbols, 118171 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> Index stale? Run `node .gitnexus/run.cjs analyze` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? `npx gitnexus analyze` (npm 11 crash → `npm i -g gitnexus`; #1939).

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows. For regression review, compare against the default branch: `detect_changes({scope: "compare", base_ref: "main"})`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit changes without running `detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/beskid/context` | Codebase overview, check index freshness |
| `gitnexus://repo/beskid/clusters` | All functional areas |
| `gitnexus://repo/beskid/processes` | All execution flows |
| `gitnexus://repo/beskid/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

## Learned User Preferences
- Prefer Cursor Auto agents for parallel work; do not use Composer 2.5 Fast when Auto is available
- Prefer full, complete refactors that purge the old design—no leftover legacy APIs or half-migrations
- Prefer parallel agents for large multi-surface work; serialize only for final integration when merge/revert loops appear
- Always spell the project name `beskid` (never `beschid`)
- In beskid hi on macOS, prefer menu shortcut Ctrl+M (not F10); keep shortcuts centralized and mouse-clickable
- Prefer readable symbol/type identifiers in compiler and ISLE traces—expand `SourceUnitId`/`AstNodeKey` and `#gN:nM` into real names plus span/construct detail, not raw numeric ids
- Settings/kanban dialogs: structural tabs/groups; settings shell with left nav tree and right auto-rendered form; task dialogs roughly 70% form / 30% preview
- Verify builds and gates locally until they pass before pushing; do not stop at the first remote CI failure
- When promoting provisional OpenSpec capabilities, require real SHALL requirements and scenarios via OpenSpec changes—not stub fills

## Learned Workspace Facts
- Tracker SQLite DB is the task-tracking source of truth; GitHub Issues sync is limited to active version and bugs
- Normative standard lives in `openspec/specs` + `openspec/catalog.json` (sole authority); `site/platform-spec` reads OpenSpec directly and serves it at `spec.beskid-lang.org`; website uses `openspec/catalog.json` at build time only and redirects `/platform-spec`; legacy `site/spec-content` corpus is removed
- VS Code extension is BSOL-only (`.bws` / `.bproj`); outline panel removed; projects panel retained; dashboard should open from the Beskid status-bar entry like rust-analyzer
- Cranelift ISLE is the intended path for lowering Beskid constructs and gradually porting runtime from Rust to Beskid
- Local `.beskid` directories should stay gitignored
- Platform-spec / tracker integration: OpenSpec is normative SOT; Tracker is delivery/version authority (revisioned catalog links, public latest delivery, reconciliation without overwrite); seed workstreams from `beskid_tracker/data/` and OpenSpec; platform-spec auth PR editing uses `site/platform-spec/src/server/git-sync/pr.ts` only
- Distribution pipelines intentionally omit AUR; keep the remaining packaging channels
- Shared AST/DAG explorer UI (ReactFlow/d3) belongs in common `@beskid` components and should reuse one repo/browser explorer dialog across website, pckg, platform-spec, and tracker
- OpenSpec `validate-standard` catalogues `AGENTS.md` and hard-fails TBD Purpose headers; regenerating `openspec/catalog.json` may be required after editing either
- Platform delivery CI hard-gates every lane image including `pckg` (needs GHCR Write on `beskid-pckg` or `GHCR_TOKEN` with `write:packages`); green `main` auto-applies Coolify staging with digest-pinned compose
