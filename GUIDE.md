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
| `site/website/` | Astro landing site, Beskid Docs, Book, and blog |
| `beskid_tracker/` | SQLite-backed roadmap and bug application; GitHub integration is bug-only after migration |
| `beskid_nexus/` | Code/document/standard graph indexing and explorer |
| `beskid_web_common/` | Published shared TypeScript packages shared by web applications |
| `beskid_infra/` | Coolify Compose, OpenBao, monitoring, deployment helpers, and infrastructure docs |
| `pckg/` | Package registry service and web client; browser identity is delegated to the shared Auth Hub |
| `beskid_vscode/`, `beskid_treesitter/`, `beskid_bsol/`, `beskid_distrib/`, `beskid_templates/` | Editor, grammar, BSOL, distribution, and template subprojects |
| `site/auth/`, `site/learn/` | Shared GitHub OAuth hub and interactive learning application |
| `appveyor.yml`, `scripts/ci/` | AppVeyor compiler fan-in, immutable-first platform publication, digest evidence, and provider-neutral local validation |
| `.github/workflows/` | GitHub-native releases, distribution, editor-marketplace publication, and maintenance only |

Most major product directories above are Git submodules. Before editing one,
run `git submodule status` and treat its own repository status, instructions,
tests, and changelog as separate from the superrepo root.

## Commands

| Task | Command |
|---|---|
| Checkout/setup | `./scripts/setup-environment.sh` |
| Initialize selected submodules only | `./scripts/setup-environment.sh --submodules <path>...` |
| Check required contributor tools | `just deps-check` |
| Install required contributor tools | `just deps-install` |
| Install root web dependencies | `pnpm install` |
| Run host-callable preflight gates | `just gate` |
| Add static workflow-policy checks | `just gate-full` |
| Run the AppVeyor migration contract | `bash scripts/ci/test/appveyor-migration-contract.test.sh` |
| Rebuild the OpenSpec read catalog | `pnpm openspec:catalog` |
| Validate OpenSpec and provenance | `pnpm openspec:validate` |
| Build website | `pnpm --cwd site/website run build` |
| Test Tracker | `pnpm --cwd beskid_tracker run test` |
| Run the focused Corelib spine test | `BESKID_CORELIB_SPINE_SMOKE=1 just test-corelib-spine` |
| Install compiler tools | `just replace` |
| Rebuild VS Code extension | `just vscode` |
| List root recipes | `just --list` |

`just gate` deliberately does not run the compiler gate; AppVeyor runs the
native compiler matrix through the canonical `scripts/ci` entrypoint. Use the
compiler repository's own documented commands for focused compiler work.
`just gate-full` additionally requires `actionlint` for the retained
GitHub-native publication workflows.
Private `@beskid/*` packages may require `NODE_AUTH_TOKEN`; the preflight script
reports applicable skips rather than treating missing package credentials as a
successful package gate.

The full contributor tool group installs `cargo-binstall` on macOS, Linux, and
Windows. It installs `mold` only on Linux, where the compiler Cargo configuration
selects it through `clang`; macOS and Windows keep their platform linkers.

## Processes

1. Define observable behavior changes in an OpenSpec delta before implementation.
2. Run GitNexus impact analysis before editing an existing symbol; report high or critical blast radius.
3. Stabilize tests, add the canonical path, migrate consumers, and only then delete the legacy path.
4. Let AppVeyor's `max_jobs: 1` project cap serialize builds through its FIFO
   queue. Within a build, complete all three required compiler jobs before the
   platform lane. Build and publish five immutable `sha-<commit>` images with
   registry digests, publish packages successfully, then retag those exact
   images as `production`; leave production reconciliation solely to
   Watchtower.
5. Run focused tests plus strict OpenSpec/provenance validation and GitNexus change detection before commit.
6. Update `CHANGELOG.md`; update `GLOSSARY.md` when canonical terminology changes. Do not add `Co-authored-by` trailers.

## Authority boundaries

- Normative language and platform requirements live in `openspec/specs/`.
  `openspec/catalog.json` is the generated identity and provenance catalog.
- `site/website/` provides the public Docs entry point at `/docs/standard/`,
  the Book, the blog, and the landing documentation. It does not create a
  second normative copy of OpenSpec.
- Compiler implementation and Corelib sources live under `compiler/`; consult
  that nested repository before relying on release-specific implementation
  invariants.
- Tracker's SQLite model is delivery authority. Its GitHub synchronization is
  limited to the supported public bug surface.
- AppVeyor is the validation and platform-image publication authority. Its
  project queue serializes release-capable builds to prevent an older build
  from advancing mutable tags after a newer build. This intentionally trades
  build duration for release ordering. Its
  shared event policy rejects pull requests, tags, manual/API and scheduled
  builds, rebuilds, and incomplete reruns from mutation. Watchtower is the only
  automated production-reconciliation authority; its asynchronous convergence
  is observed by operators, not controlled by CI.
  GitHub Actions remains only for GitHub-native release, distribution,
  editor-marketplace, security, and maintenance operations.

## Agent boundaries

Parallel agents must use disjoint write scopes. Knowledge files live outside the repository and must never be pushed. Before an existing-symbol edit, run GitNexus upstream impact analysis; before a commit, run focused tests and GitNexus change detection.

| Domain | Paths | Knowledge doc |
|---|---|---|
| Standard and docs | `openspec/`, `site/website/`, `docs/` | `~/.agents/knowledge/spec-docs.md` |
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
- Has a live AppVeyor proof shown that every serialized hosted job, especially
  the platform lane, stays within the 60-minute per-job limit, or is a
  private/BYOC worker required?
- Can private nested submodules be checked out at their pinned commits on every
  native worker without exposing reusable credentials to pull-request code?

## Related docs

- [GLOSSARY.md](./GLOSSARY.md)
- [CHANGELOG.md](./CHANGELOG.md)
- [Root README](./README.md)
