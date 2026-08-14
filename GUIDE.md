# Beskid project guide

Start here for agent work in this repository. Then read `AGENTS.md` and the
nearest nested `AGENTS.md` or README for the area being changed. The global
orchestrator, when installed, lives at `~/.agents/ORCHESTRATOR.md`.

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
| `pckg/` | Package registry service and web client; browser identity is delegated to the shared Auth Hub |
| `beskid_vscode/`, `beskid_treesitter/`, `beskid_bsol/`, `beskid_distrib/`, `beskid_templates/` | Editor, grammar, BSOL, distribution, and template subprojects |
| `site/auth/`, `site/learn/` | Shared GitHub OAuth hub and interactive learning application |
| `.github/workflows/`, `scripts/ci/` | Root CI orchestration, reusable delivery contracts, and local validation |

Most major product directories above are Git submodules. Before editing one,
run `git submodule status` and treat its own repository status, instructions,
tests, and changelog as separate from the superrepo root.

## Commands

| Task | Command |
|---|---|
| Checkout/setup | `./scripts/setup-environment.sh` |
| Initialize selected submodules only | `./scripts/setup-environment.sh --submodules <path>...` |
| Check required contributor tools | `just deps-check` |
| Install root web dependencies | `pnpm install` |
| Run host-callable preflight gates | `just gate` |
| Add static workflow-policy checks | `just gate-full` |
| Rebuild the OpenSpec read catalog | `pnpm openspec:catalog` |
| Validate OpenSpec and provenance | `pnpm openspec:validate` |
| Build platform-spec | `pnpm --cwd site/platform-spec run build` |
| Test platform-spec | `pnpm --cwd site/platform-spec run test` |
| Build website | `pnpm --cwd site/website run build` |
| Test Tracker | `pnpm --cwd beskid_tracker run test` |
| Run the focused Corelib spine test | `BESKID_CORELIB_SPINE_SMOKE=1 just test-corelib-spine` |
| Install compiler tools | `just replace` |
| Rebuild VS Code extension | `just vscode` |
| List root recipes | `just --list` |

`just gate` deliberately does not run the compiler gate; that gate is reserved
for Blacksmith Testbox. Use the compiler repository's own documented commands
for focused compiler work. `just gate-full` additionally requires `actionlint`.
Private `@beskid/*` packages may require `NODE_AUTH_TOKEN`; the preflight script
reports applicable skips rather than treating missing package credentials as a
successful package gate.

## Processes

1. Define observable behavior changes in an OpenSpec delta before implementation.
2. Run GitNexus impact analysis before editing an existing symbol; report high or critical blast radius.
3. Stabilize tests, add the canonical path, migrate consumers, and only then delete the legacy path.
4. Build artifacts once by commit SHA, deploy the same digest manifest to staging, then promote through a protected production environment.
5. Run focused tests plus strict OpenSpec/provenance validation and GitNexus change detection before commit.
6. Update `CHANGELOG.md`; update `GLOSSARY.md` when canonical terminology changes. Do not add `Co-authored-by` trailers.

## Authority boundaries

- Normative language and platform requirements live in `openspec/specs/`.
  `openspec/catalog.json` is the generated identity and provenance catalog.
- `site/platform-spec/` renders and integrates the standard. Its SQLite and
  Memgraph stores are projections, not alternate normative sources.
- `site/website/` contains the informative Book and landing documentation.
- Compiler implementation and Corelib sources live under `compiler/`; consult
  that nested repository before relying on release-specific implementation
  invariants.
- Tracker's SQLite model is delivery authority. Its GitHub synchronization is
  limited to the supported public bug surface.

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
- Additional orchestration evidence: `docs/superpowers/`, `docs/orchestrate/`,
  and domain notes under `~/.agents/knowledge/` (outside the repository).
- GitNexus MCP currently reports the `beskid` index behind the checkout. This
  worktree has no `.gitnexus/run.cjs`; refresh from a checkout that contains the
  runner before treating graph results as current.
- `.claude/`, `.cursor/`, `.windsurf/`, `.opencode/`, `.omo/`, and
  `.superpowers/` are not present in this worktree. Do not infer tool-specific
  policy from absent local artifacts.
- Always inspect root and affected submodule status before edits. Never restore,
  stage, or commit unrelated changes, and never commit external knowledge files.

## Open questions before broad work

- Which nested repository owns the requested change and release note?
- Does the change alter observable behavior and therefore require an OpenSpec
  delta before implementation?
- Which focused nested-repository test is required in addition to root
  preflight, especially for compiler work that root preflight excludes?
- Does the task require private package access, deployment credentials, or
  another external authority that must fail closed when unavailable?

## Related docs

- [GLOSSARY.md](./GLOSSARY.md)
- [CHANGELOG.md](./CHANGELOG.md)
- [Root README](./README.md)
