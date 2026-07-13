# Beskid Superrepo

[![Open VSX publish](https://github.com/Cyber-Nomad-Collective/beskid/actions/workflows/publish-open-vsx.yml/badge.svg?branch=main)](https://github.com/Cyber-Nomad-Collective/beskid/actions/workflows/publish-open-vsx.yml?query=branch%3Amain)
[![CLI (rolling)](https://img.shields.io/github/v/tag/Cyber-Nomad-Collective/beskid_compiler/cli-latest?label=CLI&logo=github)](https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/tag/cli-latest)
[![VS Code on Open VSX](https://img.shields.io/open-vsx/v/beskid/beskid-vscode?label=VS%20Code&logo=openvsx)](https://open-vsx.org/extension/beskid/beskid-vscode)
[![Last commit](https://img.shields.io/github/last-commit/Cyber-Nomad-Collective/beskid/main?label=superrepo&logo=github)](https://github.com/Cyber-Nomad-Collective/beskid/commits/main/)

Most software is business records with lipstick. Beskid is a language and toolchain for the part where you actually ship those records—without importing a cathedral to save one row.

This repository is the **superrepo**: one checkout that wires together the compiler, registry, docs site, editor extension, and the services that run in production. Source and issues live at **[github.com/Cyber-Nomad-Collective/beskid](https://github.com/Cyber-Nomad-Collective/beskid)**.

## Live services

| Service | URL | What you get |
| --- | --- | --- |
| **Home & docs** | [beskid-lang.org](https://beskid-lang.org) | Landing page, [Platform specification](https://beskid-lang.org/platform-spec/), and [The Beskid Book](https://beskid-lang.org/book/) |
| **pckg** | [pckg.beskid-lang.org](https://pckg.beskid-lang.org) | Public package registry—browse packages, publish and fetch with the CLI |
| **Tracker** | [tracker.beskid-lang.org](https://tracker.beskid-lang.org) | SQLite-backed roadmap and kanban; GitHub synchronization is limited to public bugs |

Auth for Tracker, Nexus, and pckg flows through the shared [auth hub](https://auth.beskid-lang.org) (`site/auth/`).

## What Beskid is (and is not)

Beskid is an **AOT-native** language aimed at everyday business software: permissions, workflows, reports that must match finance's spreadsheet, integrations with vendors who treat webhooks as optional. The hard part is rarely algorithms.

| What the industry sells | What Beskid optimizes for |
| --- | --- |
| Runtime mystery and reflection | **Compile-time clarity** you can see in the build artifact |
| Framework religion | **Language features as language features**—not ten layers of corelib indirection |
| DI container theatre | **Explicit, verifiable wiring**—IoC in the compiler, not in a black box |
| "Enterprise-friendly" maze | **Fast local dev and honest CI** so structure cannot hide in PowerPoint |

If your problem is finite element solvers or a game engine, use Rust or C++ and be happy. Beskid is not auditioning for that job.

Status: opinionated project. Not finished. Not apologizing. Start with [The Beskid Book](https://beskid-lang.org/book/) or the [Platform specification](https://beskid-lang.org/platform-spec/) when you want normative rules, not informative sales pitch.

## This superrepo

Day-to-day language work happens in **`compiler/`**, normative standard changes in **`openspec/`**, and informative documentation in **`site/website/`**. Everything else—registry, VS Code extension, tracker UI, deploy infra—lives in git submodules so each piece can version and ship on its own while CI in this repo ties them together.

```
beskid/                          ← you are here (aggregate root)
├── openspec/                    ← sole normative standard + change workflow
├── compiler/                    ← Rust: CLI, compiler, LSP, corelib (nested submodule)
├── pckg/                        ← .NET registry service + UI
├── beskid_vscode/               ← VS Code extension (bundles beskid_lsp)
├── beskid_tracker/              ← Roadmap / issue tracker (TanStack Start)
├── beskid_nexus/                ← Compiler knowledge graph + MCP (GitNexus fork)
├── beskid_web_common/           ← Shared TS: trudoc, beskid-ui, auth client
├── beskid_treesitter/           ← Tree-sitter grammar (synced from compiler Pest)
├── beskid_templates/            ← First-party `beskid.templates.*` scaffolds
├── beskid_infra/                ← Coolify Compose deploy, OpenBao, monitoring
├── site/
│   ├── platform-spec/           ← OpenSpec reader, editor and embed APIs
│   ├── website/                 ← Astro + Starlight informative Book/docs
│   └── auth/                    ← GitHub OAuth hub for tracker, nexus, pckg
├── scripts/                     ← setup-environment.sh, install-deps.sh, CI helpers
└── .github/workflows/           ← Container images, Open VSX, Coolify compose deploy
```

## Submodules and READMEs

Each row links to the README in that tree. Clone submodules before following those links locally.

| Path | Role | README |
| --- | --- | --- |
| `compiler/` | Rust workspace: `beskid` CLI, compiler crates, `beskid_lsp`, package client | [compiler/README.md](compiler/README.md) |
| `compiler/corelib/` | Standard library (nested submodule: `corelib`, foundation, runtime, Mod SDK) | [compiler/corelib/README.md](compiler/corelib/README.md) |
| `pckg/` | Registry HTTP API, Blazor UI, PostgreSQL, Docker Compose for local dev | [pckg/README.md](pckg/README.md) |
| `beskid_vscode/` | Official VS Code extension; Open VSX publish runs from superrepo CI | [beskid_vscode/README.md](beskid_vscode/README.md) |
| `beskid_tracker/` | SQLite roadmap/kanban and public bugs; GitHub synchronization is bug-only | [beskid_tracker/README.md](beskid_tracker/README.md) |
| `beskid_nexus/` | Interactive repo graph explorer; MCP at `/api/mcp` | [beskid_nexus/README.md](beskid_nexus/README.md) |
| `beskid_web_common/` | `@cyber-nomad-collective/trudoc`, `@beskid/beskid-ui`, auth client packages | [beskid_web_common/README.md](beskid_web_common/README.md) |
| `beskid_treesitter/` | `@cyber-nomad-collective/beskid-tree-sitter` grammar for editors and tooling | [beskid_treesitter/README.md](beskid_treesitter/README.md) |
| `beskid_templates/` | Published project/workspace/item templates (`beskid.templates.*`) | [beskid_templates/README.md](beskid_templates/README.md) |
| `beskid_infra/` | Coolify Compose stack, OpenBao secrets, production deploy | [beskid_infra/README.md](beskid_infra/README.md) |

### In-repo (not submodules)

| Path | Role | README |
| --- | --- | --- |
| `site/` | Docs site + auth hub; Docker Compose for Coolify/GHCR | [site/README.md](site/README.md) |
| `openspec/` | Canonical standard capabilities, change proposals, and migration catalog | [GUIDE.md](GUIDE.md) |
| `site/platform-spec/` | OpenSpec reader/editor and framework-neutral embed service | [site/platform-spec/README.md](site/platform-spec/README.md) |
| `site/website/` | Astro dev server and informative Beskid Book/docs | [site/website/README.md](site/website/README.md) |
| `site/auth/` | Central GitHub OAuth; one app handoff to tracker, nexus, pckg | [site/auth/README.md](site/auth/README.md) |
| `scripts/` | Toolchain install (`repo-deps.json`), submodule sync, setup wizard entry | [scripts/README.md](scripts/README.md) |
| `.github/` | Workflow index for container images, Open VSX, Coolify compose | [.github/README.md](.github/README.md) |

## Getting started

**Recommended:** interactive setup from the superrepo root (toolchain, submodules, Bun workspaces, `site/` env files):

```bash
git clone https://github.com/Cyber-Nomad-Collective/beskid.git
cd beskid
just setup
```

Requires [just](https://github.com/casey/just) (`./scripts/install-deps.sh --install --tool just`). The wizard offers profiles for docs-only, full developer, and infra operator workflows—see [site/README.md](site/README.md).

**Non-interactive sync** (git submodules + `bun install` at the root):

```bash
./scripts/setup-environment.sh
```

Limit paths: `./scripts/setup-environment.sh compiler pckg beskid_web_common`. Skip JS install: `BESKID_SKIP_JS_INSTALL=1 ./scripts/setup-environment.sh`.

**Clone with submodules:**

```bash
git clone --recurse-submodules https://github.com/Cyber-Nomad-Collective/beskid.git
# or, after a plain clone:
git submodule update --init --recursive
```

`compiler/` pulls nested submodules for **corelib**; use `--recursive`.

**Day-to-day submodule work** uses [lazygit](https://github.com/jesseduffield/lazygit) with the Beskid config ([scripts/lazygit/README.md](scripts/lazygit/README.md)):

```bash
mkdir -p ~/.config/lazygit
cp scripts/lazygit/config.yml ~/.config/lazygit/config.yml
lazygit   # U = init/update all submodules; P = recursive commit+push
```

**Toolchain check** (Rust, Bun, .NET, gh, lazygit—see [repo-deps.json](repo-deps.json)):

```bash
just deps-check
just deps-install   # install missing tools
```

### Common next steps

| Goal | Where to go |
| --- | --- |
| Read the language | [beskid-lang.org/book/](https://beskid-lang.org/book/) |
| Install the CLI | [Downloads](https://beskid-lang.org/downloads/) (rolling tag `cli-latest` on [compiler releases](https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/tag/cli-latest)) |
| Hack the compiler | [compiler/README.md](compiler/README.md) — `cargo build` in `compiler/` |
| Run docs locally | `cd site/website && bun install && bun dev` → [site/website/README.md](site/website/README.md) |
| Run pckg locally | `cd pckg && podman compose up --build -d` → [pckg/README.md](pckg/README.md) |
| VS Code extension dev | [beskid_vscode/README.md](beskid_vscode/README.md) — `bun install`, Extension Development Host |
| Deploy / infra | [beskid_infra/docs/deploy-compose.md](beskid_infra/docs/deploy-compose.md) |

Local CI sanity check for web/docs: `./validate-ci-local.sh` (submodule init, prebuild, platform-spec verify).

---

Questions about the language: **[beskid-lang.org](https://beskid-lang.org)**. Registry behavior and URLs: **[pckg.beskid-lang.org](https://pckg.beskid-lang.org)** plus the pckg guides in the docs sidebar. Delivery timeline and bugs: **[tracker.beskid-lang.org](https://tracker.beskid-lang.org)**.

Automation conventions for agents and recurring tasks: [AGENTS.md](AGENTS.md).
