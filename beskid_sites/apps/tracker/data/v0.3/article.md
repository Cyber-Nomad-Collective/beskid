# v0.3 — Macros, concurrency, and stabilization

**Cutoff window:** 2026-05-23 through 2026-05-25 · superrepo `f57377a` → `aaddd32` (`beskid`)

v0.3 is the first delivery wave after the v0.2 analysis/packages/spec baseline. Work landed as **eight orchestrated subplanner tracks** merged into `main` between 23 and 25 May 2026: export FFI link-time, native DI codegen/runtime, compiler-mod execution, foreign `import lib`, runtime phase-B GC, corelib tiering (collections + FS/Path + api-shape), tooling `packageKind`, and post-merge CI/docs/LSP hardening.

## Merge-wave narrative (23 May)

The 23 May integration day sequences submodule pins and merge commits that bring compiler, corelib, and pckg to integrated tips:

| Merge / anchor | Track | Superrepo commit (tip) |
|----------------|-------|-------------------------|
| `compiler-mod-execution` | Mod host, SampleMod, ContractInvoker | `bf03401` |
| `native-di-codegen-runtime` | Native DI codegen + runtime E2E | `33d5730` |
| `export-ffi-link-time` | Export FFI, dynamic types, link libraries | `f6fb5a6` |
| `foreign-lib-import-cli` | `beskid import lib`, ExternalLibrary registry | `8bedceb` |
| `runtime-phase-b-gc-syscall` | Phase B GC opt-in, launch/with lowering | `66013bb` |
| `corelib-tiering-collections-fs-api-shape` | Tier tags, System.FS/Path, api-shape | `3b51b53` |
| `tooling-package-kind-tool-and-formatter-spec` | packageKind tool + formatter hub | `83c57a7` |

Orchestration handoffs (`docs(orch)`, `orchestrate(beskid-v0-3)`) record final SHAs per track; `d137f11` promotes **corelib-api-shape** to **Standard** with tier pipeline evidence.

## Post-merge stabilization (24–25 May)

After the merge wave, work shifts to **CI truth on main** and **editor/tooling polish**:

- **Runtime CI:** release bridge before AOT e2e, ASan archive wiring, serialized runtime tests (`e8bc073`, `a3d7cee`, `c0ac8fd`).
- **Docs/trudoc:** Node-backed `verify:trudoc` in CI, Beskid grammar in trudoc, YAML frontmatter quoting, unified book/platform-spec nav drawer (`0a173a6`, `e679792`, `c2dece3`, `278da1b`).
- **FFI CI:** `ffi_v03` scaffold stabilization and compiler submodule bumps (`8ba01c8`, `8cffb33`).
- **LSP & VS Code:** `beskid lsp` CLI, GitHub release tags, extension cli-latest bootstrap and inventory docs (`a86a6d6`, `503223d`, `aaddd32`).
- **Completion evidence:** `verify-all-on-main` documents green main after v0.3 landings (`aba4331`).

## Deliverable map

| Deliverable | Focus | Closed |
|-------------|-------|--------|
| **v03-merge-wave** | Macro/runtime/FFI/tooling integration merges (23 May) | 2026-05-23 |
| **v03-corelib-tier-ship** | Tier-tagged collections, FS/Path, prelude fixes, JIT smoke | 2026-05-24 |
| **v03-analysis-interop** | ExternalLibrary registry, export-FFI HIR, formatter notes, e2e labels | 2026-05-23 |
| **v03-pckg-tool-registry** | packageKind tool in pckg + CLI pack, api.json tier/paths | 2026-05-24 |
| **v03-post-merge-ci** | Runtime bridge, ASan, ffi_v03, submodule-driven CI | 2026-05-24 |
| **v03-verify-main** | verify-all-on-main evidence + trudoc grammar | 2026-05-24 |
| **v03-docs-reader-hardening** | docs-ui shell, nav client, Docker git-meta, frontmatter | 2026-05-24 |
| **v03-editor-lsp-cli** | `beskid lsp`, releases, VS Code toolchain bootstrap | 2026-05-25 |
| **v03-superrepo-orchestration** | Cross-track SHA handoffs and integration traceability | 2026-05-23 |

## Workstream coverage

- **ffi-export** — export FFI, dynamic types promotion, AotBuildRequest link libraries, ffi_v03 CI.
- **concurrency-runtime** — phase B GC, launch/with lowering, frozen ABI allowlists, composition e2e.
- **compiler-mods** — mod host pipeline, `import lib`, Project.proj links, native DI.
- **stabilization** — corelib tiering, api-shape Standard, formatter/packageKind spec, docs nav.
- **analysis-pipeline** — ExternalLibrary analysis, api.json tier resolver, HIR/export legality.
- **pckg-registry** — tool packageKind UI/CLI, docs-ui refactor, artifact path resolution.
- **ci-release** — runtime bridge e2e, trudoc verify, verify-all evidence.
- **editor-extension** — `beskid lsp`, Open VSX/CLI releases, extension bootstrap.
- **dev-experience** — tracker bootstrap (backlog), roadmap labels, Docker/Bun alignment.
- **superrepo-orchestration** — pinned submodule tips and orchestration docs.

## Cut-off note

v0.3 delivery was **truncated at `aaddd32` (2026-05-25)**; platform auth, `beskid_web_common`, nexus, and full tracker productization continue under **v0.4** (`data/v0.4/`).

## Out of scope for this catalog slice

- **v0.5+** delivery versions and public **bug** issues (separate route).
- In-flight **tracker-local-dev-bootstrap** (Backlog): document `bun install` before `bun run dev` and GitHub Packages auth for `@beskid/docs-ui` — not a v0.3 merge deliverable.

## Source axis

All seed tasks anchor to a single **source commit** per landing (`source.repo`, `source.commit`, `source.subject`). Platform-spec tasks include `specRelations` with `implements` / `updates` links; the tracker appends a provenance table and spec block when rendering issue bodies.
