# v0.1 — Compiler foundation

Companion narrative for `version.json` (the tracker loads `summary` and `cutoff.rationale` from JSON; this file is not read by the app today).

## Timeline

| Boundary | Date | Repo | Commit | Meaning |
|----------|------|------|--------|---------|
| **Start** | 2026-03-05 | `compiler` | [`dd75bff`](https://github.com/Cyber-Nomad-Collective/compiler/commit/dd75bff) | **Initial Commit** — Pecan-era history is archived; Beskid compiler work continues in the standalone `compiler` repository. |
| **End** | 2026-04-22 | `beskid` | [`f777b79`](https://github.com/Cyber-Nomad-Collective/beskid/commit/f777b79) | Superrepo tag **v0.1.0** after Open VSX publish hardening (final CI fix in this band). |

v0.1 ends **before** the platform-spec / trudoc cutover band (v0.2 starts at `f777b79` and the `19745d4` docs restructuring on `main`).

## Deliverables (closed in-band)

1. **v01-compiler-parity** — Compiler bootstrap, AOT refactor, `pack`, optional `?.`, file-scoped module semantics, graph Std injection, and parity merge (`1f8d62d`, 2026-04-09).
2. **v01-corelib-submodule** — Nested `corelib` submodule is the sole stdlib source for standalone compiler CI and CLI provisioning (`3552572` / `8fa00e9`, 2026-04-10).
3. **v01-open-vsx** — VS Code extension defaults to bundled LSP; Open VSX workflow, version derivation, namespace bootstrap, and publish retries through **v0.1.0** (`f777b79`, 2026-04-22).

The removed **v01-cli-release** milestone is **not** recreated; CLI/GitHub Releases work is tracked under the **ci-release** workstream without a separate deliverable anchor.

## Workstreams

| Order | Slug | Focus |
|-------|------|--------|
| 1 | `compiler-foundation` | Repo bootstrap, AOT, modules, analysis/resolver |
| 2 | `corelib-packaging` | Corelib submodule, stdlib manifest, pckg UI/deploy/bootstrap |
| 3 | `ci-release` | Nox aggregate CI, CLI release uploads, docs site surfaces |
| 4 | `editor-extension` | Bundled LSP default, VSCE/Open VSX automation |

## Narrative

March 2026 splits the monolithic superrepo compiler tree into a **compiler submodule** while preserving release automation on `beskid`. April hardens **file-scoped modules**, consolidates **stdlib → corelib**, connects **pckg** for registry UX and Coolify deploy, and finishes with **SeaweedFS/S3 release upload** reliability plus **Open VSX** publish on `main`. All catalog tasks are **Done**; provenance is one git commit per task (`source.repo` + `source.commit` + `source.subject`).
