# v0.4 — Platform services, auth, and delivery tooling

**Cutoff window:** 2026-05-26 through 2026-06-07 · superrepo `aaddd32` → `ee88edf` (`beskid`)

v0.4 opens immediately after the **truncated v0.3** release at `aaddd32`. Scope shifts from compiler macro/concurrency stabilization to **platform-facing services**: centralized OAuth (`site/auth`), shared frontend packages in `beskid_web_common`, the **beskid_tracker** roadmap product, **beskid_nexus** as a deployable knowledge graph, and **superrepo CI/CD** that keeps docs, tracker, nexus, and web workspaces green on Bun 1.3.14.

## Narrative

| Period | Theme | Anchor commits |
|--------|-------|----------------|
| **26 May** | Superrepo structure + docs hub | `6438ae8` tracker/manifests/hub; `1e73032` `<beskid-hub>` + platform-spec catalog; `a49d2e9` trudoc/docs-ui → `beskid_web_common`; `72698c7` nexus submodule; `1b0a15c` web workspace CI |
| **26 May** | Nexus CI + hosting | `b37a9c2`–`87da140` Ladybug/native Docker CI; `eb2aa21` service hosting model; `5777116` CICD fixes |
| **26–27 May** | Auth + tracker product | `510f302`–`bed2192` auth hub + tracker fixes; `bbd6366` nexus Coolify hosting; `4fde6e0` lazygit recursive commit/push |
| **27 May** | Toolchain hygiene | `f40ecb3` bun.lock alignment; `c8e5fc4` bsharp `update=none` |
| **29 May** | Deploy + packages | `3ed47af` tracker container CI; `870ef7b` `@beskid/*` sync; `bc9f2e0` observability pass; `49c49d7` tracker deploy + nexus in hub |
| **3 Jun** | Auth/tracker hardening | `801f1e2` auth/tracker refactor; `574a84c` autopairing; `742f086`/`1e3e3cf` session fixes |
| **4–6 Jun** | Corelib + tracker UX | `b73d49d` corelib implementation; `7246412` kanban DnD fix; `7461652` scoped GitHub sync |
| **7 Jun** | Tracker SOT + BSOL | SQLite source of truth, settings shell, seed catalog refresh; `ee88edf` BSOL stability pass |
| **8 Jun** | Closure catalog + DX | Wave-aligned corelib tasks, auth-hub platform-spec, deploy matrix, VS Code spec/pckg links |

## Deliverable map

| Deliverable | Focus | Status (seed) |
|-------------|-------|---------------|
| **v04-platform-dx** | Hub, redirects, hosting model, Coolify multi-app, observability | Partial — hub/packages/observability + auth-hub spec landed; production OAuth + ui-react publish remain |
| **v04-cicd-realized** | Web CI action, trudoc paths, nexus smoke, verify-all | Partial — CI + tracker container landed; verify-all skeleton at `docs/orchestrate/verify-all-on-main-v04.md` |
| **v04-tracker-ship** | Submodule, SQLite SOT, scoped GitHub sync, auth integration | In progress — core product landed; production webhook validation remains |
| **v04-nexus-operational** | Submodule, native CI, `gitnexus serve` hosting | In progress — hub entry + COOLIFY docs landed; production smoke backlog |
| **v04-corelib-complete** | Compiler structure; 61-target matrix; API/runtime completion | In progress — fresh baseline 20/61; collection, Core.FS, native-kit, and publish evidence remain |
| **v04-vscode-pckg-docs** | pckg + platform-spec + docs in editor | Mostly done — vscode tasks Done; specBaseUrl, symbol links, pckg health landed; diagnostic→spec + Open VSX deferred |

## Workstreams

- **web-auth-web-common** — `site/auth` OAuth hub, `beskid_web_common` trudoc/docs-ui/settings, shared `@beskid/beskid-ui`.
- **tracker-implementation** — Roadmap kanban, SQLite source of truth, scoped GitHub sync, auth handoff, settings dialog.
- **nexus** — `beskid_nexus` submodule, Ladybug graph CI, Coolify `gitnexus serve`.
- **repo-cicd** — Manifests, lazygit recursive push, treesitter, Bun lock, setup-environment cleanup.
- **compiler-corelib** — Wave-aligned gates (import codemod, spine, BSOL, pipeline, concurrency Done; matrix + API completion In Progress/Backlog).
- **vscode-editor** — pckg registry UX, platform-spec deep links, status-bar pckg health.
- **platform-docs-dx** — Cross-app hub, legacy URLs, trudoc prebuild in web workspace.
- **platform-infra** — Observability, GHCR container builds, Coolify deploy fixes.

## v0.3 carry-over

Items planned under v0.3 but **cut off** at `aaddd32` (not re-seeded here): late macro/mod polish, full verify-all closure for v0.3 scope, and completed LSP/editor items already in v0.3 seed.

## Source axis

Seed tasks anchor to **`source.commit`** on the landing repo (`beskid` unless submodule-only). `In Progress` / `Backlog` tasks use the latest known superrepo tip (`ee88edf`) when work is ongoing without a final landing SHA.

Import seed JSON into tracker SQLite via Settings → Import catalog, or `importCatalogBundleFn`. Validate with `bun run seed:validate`.

## v0.4 closure (2026-07-24)

| Period | Theme | Anchor commits |
|--------|-------|----------------|
| **20–24 Jul** | Compiler W0–W6 Done + W7 evidence | `17442fb9` all state merge; `790adad6` parser + ISLE; `aad9b219` MethodDefinition + ForStatement ISLE; catalog revision `f011a8cb2e46` (185 caps, 524 reqs) |

Historical W0–W6 wave work is present, but current source-tip release evidence does not support calling the compiler/Corelib/runtime complete. On 2026-08-09 the release CLI built and the explicit runtime kit staged, while the EOF-bound authoritative Corelib matrix finished at 20/61 passing. The historical apparent hang was stdin job control, not a compiler deadlock. Structural splits completed for the semantic contract, ISLE library, package store, GC, TypeChecker expressions, and module emission; remaining qualified monoliths are tracked separately.

**Remaining for 0.4 sign-off:** recover 61/61 Corelib and harness performance; complete semantic/enum/generic lowering gaps; implement rooted Core.Collections and canonical host-backed Core.FS; retire all Corelib stubs; correct per-artifact runtime-kit verification; obtain fresh Linux, macOS arm64, and Windows x86-64 debug/release static/shared JIT+AOT evidence; finish tracker/release sign-off.
