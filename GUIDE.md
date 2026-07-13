# Beskid project guide

Basis for parallel agent work in this repository. Complement with `AGENTS.md` and the global orchestrator at `~/.agents/ORCHESTRATOR.md`.

## Purpose

Beskid is an AOT-only programming language, compiler/runtime, core library, package ecosystem, editor tooling, documentation/standard platform, project tracker, knowledge graph, and self-hosted service stack. The repository coordinates regular directories and Git submodules; inspect both the root and the affected nested repository before changing or committing work.

## Layout

| Path | Role |
|---|---|
| `openspec/` | Sole normative Beskid standard, change proposals, migration catalog, and capability specs |
| `compiler/` | Rust compiler, runtime, LSP, CLI, conformance tests, and Beskid corelib sources |
| `site/platform-spec/` | React standard reader/editor and OpenSpec embed APIs |
| `site/website/` | Astro landing site and informative Beskid Book |
| `beskid_tracker/` | SQLite-backed roadmap and bug application; GitHub integration is bug-only after migration |
| `beskid_nexus/` | Code/document/standard graph indexing and explorer |
| `beskid_web_common/` | Published shared TypeScript packages shared by web applications |
| `beskid_infra/` | Coolify Compose, OpenBao, monitoring, deployment helpers, and infrastructure docs |
| `pckg/` | Package registry being migrated from .NET/Blazor to Rust/React |
| `beskid_vscode/`, `beskid_treesitter/`, `beskid_bsol/`, `beskid_distrib/`, `beskid_templates/` | Editor, grammar, BSOL, distribution, and template subprojects |
| `.github/workflows/`, `scripts/ci/` | Root CI orchestration, reusable delivery contracts, and local validation |

## Commands

| Task | Command |
|---|---|
| Checkout/setup | `./scripts/setup-environment.sh` |
| Install root web dependencies | `bun install` |
| Rebuild the OpenSpec read catalog | `bun run openspec:catalog` |
| Validate OpenSpec and provenance | `bun run openspec:validate` |
| Build platform-spec | `bun --cwd site/platform-spec run build` |
| Test platform-spec | `bun --cwd site/platform-spec run test` |
| Build website | `bun --cwd site/website run build` |
| Test Tracker | `bun --cwd beskid_tracker run test` |
| Install compiler tools | `just replace` |
| Rebuild VS Code extension | `just vscode` |
| Inspect GitNexus index | `node .gitnexus/run.cjs status` |

## Processes

1. Define observable behavior changes in an OpenSpec delta before implementation.
2. Run GitNexus impact analysis before editing an existing symbol; report high or critical blast radius.
3. Stabilize tests, add the canonical path, migrate consumers, and only then delete the legacy path.
4. Build artifacts once by commit SHA, deploy the same digest manifest to staging, then promote through a protected production environment.
5. Run focused tests plus strict OpenSpec/provenance validation and GitNexus change detection before commit.
6. Update `CHANGELOG.md`; update `GLOSSARY.md` when canonical terminology changes. Do not add `Co-authored-by` trailers.

## ABI v5 rewrite invariants

- Expanded AST nodes plus generation-safe Salsa facts are the sole semantic representation.
- Generated ISLE rules are the sole language-operation lowering layer; every emitted function must pass `verify_function`.
- ABI v5 calls manifest-declared `beskid_rt_v5_*` symbols directly; do not reintroduce ABI-v4 fallback or handler dispatch.
- `compiler/runtime_manifest.bsol` and generated `abi.json` are the symbol/layout authority; never hand-edit generated ABI files.
- The supported target set is `x86_64-unknown-linux-gnu`, `aarch64-apple-darwin`, and `x86_64-pc-windows-msvc`.
- Runtime intrinsics are available only to the canonical runtime compilation through a non-forgeable trusted capability.

## Agent boundaries

Parallel agents must use disjoint write scopes. Knowledge files live outside the repository and must never be pushed. Before an existing-symbol edit, run GitNexus upstream impact analysis; before a commit, run focused tests and GitNexus change detection.

| Domain | Paths | Knowledge doc |
|---|---|---|
| Standard and docs | `openspec/`, `site/platform-spec/`, `site/website/`, `docs/` | `~/.agents/knowledge/spec-docs.md` |
| Tracker and Nexus integration | `beskid_tracker/`, `beskid_nexus/`, relevant shared package APIs | `~/.agents/knowledge/apps-integration.md` |
| CI/CD and infrastructure | `.github/`, `scripts/ci/`, `beskid_infra/` | `~/.agents/knowledge/cicd.md` |
| Compiler/runtime | `compiler/` | `~/.agents/knowledge/compiler.md` |
| ABI contracts | `compiler/runtime_manifest.bsol`, ABI model and generated metadata | `~/.agents/knowledge/abi-v5.md` |
| pckg migration | `pckg/`, `compiler/crates/beskid_pckg_*`, `site/auth/` | `~/.agents/knowledge/pckg-*.md` |

## Prior agent and IDE artifacts

- Root instructions: `AGENTS.md`, `CLAUDE.md`.
- Cursor: `.cursor/` with rules, hooks, plans, skills, and agents.
- Claude-compatible skills: `.claude/skills/`.
- OpenCode: `.opencode/`.
- Additional orchestration evidence: `.omo/`, `.superpowers/`, `docs/superpowers/`, `docs/orchestrate/`.
- GitNexus index: `.gitnexus/`; verify freshness before relying on impact results.
- Existing user work is present in the root and several submodules. Always inspect `git status` before edits and never restore unrelated deletions.

## Related docs

- [GLOSSARY.md](./GLOSSARY.md)
- [CHANGELOG.md](./CHANGELOG.md)
- [Root README](./README.md)
