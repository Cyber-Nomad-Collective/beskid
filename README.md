# Beskid

[![Runtime CI](https://github.com/Cyber-Nomad-Collective/beskid/actions/workflows/runtime-ci.yml/badge.svg?branch=main)](https://github.com/Cyber-Nomad-Collective/beskid/actions/workflows/runtime-ci.yml?query=branch%3Amain)
[![pckg CI](https://github.com/Cyber-Nomad-Collective/beskid/actions/workflows/pckg-ci.yml/badge.svg?branch=main)](https://github.com/Cyber-Nomad-Collective/beskid/actions/workflows/pckg-ci.yml?query=branch%3Amain)
[![Open VSX publish](https://github.com/Cyber-Nomad-Collective/beskid/actions/workflows/publish-open-vsx.yml/badge.svg?branch=main)](https://github.com/Cyber-Nomad-Collective/beskid/actions/workflows/publish-open-vsx.yml?query=branch%3Amain)
[![CLI (rolling)](https://img.shields.io/github/v/tag/Cyber-Nomad-Collective/beskid_compiler/cli-latest?label=CLI&logo=github)](https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/tag/cli-latest)
[![VS Code on Open VSX](https://img.shields.io/open-vsx/v/beskid/beskid-vscode?label=VS%20Code&logo=openvsx)](https://open-vsx.org/extension/beskid/beskid-vscode)
[![Last commit](https://img.shields.io/github/last-commit/Cyber-Nomad-Collective/beskid/main?label=superrepo&logo=github)](https://github.com/Cyber-Nomad-Collective/beskid/commits/main/)

Welcome. Beskid is a programming language and toolchain designed for clear projects, dependable packages, and a smooth path from editor to runtime.

This repository is the **superrepo**: it aggregates the main pieces of the ecosystem so you can work across them in one checkout. Day-to-day language work usually happens in the **compiler** and **website** trees; the registry service and editor extension live alongside them here. Source and issue tracking: **[github.com/Cyber-Nomad-Collective/beskid](https://github.com/Cyber-Nomad-Collective/beskid)**.

## Where to start on the web

- **[beskid-lang.org](https://beskid-lang.org)** — Landing page and home for the project. Documentation (spec, guides, core library reference, and the Beskid Book) is published on the same site.
- **[pckg.beskid-lang.org](https://pckg.beskid-lang.org)** — The public **pckg** registry: browse packages, read metadata, and use it as the default registry when you publish or fetch dependencies with the Beskid CLI.

If you are new to the language, open the site and follow **The Beskid Book** from the docs navigation, then explore the CLI and project guides when you start building.

## Toolchain overview

### Compiler and CLI (`compiler/` submodule)

The compiler lives in a dedicated Rust workspace (submodule path: `compiler/`). It includes the command-line interface used to build, test, analyze, and format Beskid code, the compiler front end and backends, and supporting crates for diagnostics and tooling.

Prebuilt CLI binaries are published from the compiler repository’s CI to GitHub Releases (rolling tag `cli-latest`). Install and upgrade flows are documented on [beskid-lang.org](https://beskid-lang.org).

The standard library (**corelib**) is maintained as a nested submodule under `compiler/corelib/` and is published as a package through the registry where appropriate.

### Language Server (`beskid_lsp` in `compiler/`)

The **Beskid Language Server** implements the Language Server Protocol so editors get completions, go-to-definition, diagnostics, formatting, and related features while you edit `.bd` sources and `.proj` manifests.

It ships as the `beskid_lsp` binary from the compiler workspace. The VS Code extension runs this server by default (bundled per platform or configurable path).

### VS Code extension (`beskid_vscode/` submodule)

**beskid_vscode** is the official Visual Studio Code extension (its own repository, checked out under this path): file associations for Beskid, integration with the language server, and settings for dev versus bundled server binaries.

See `beskid_vscode/README.md` for local development (`bun install`, `bun run build`, Extension Development Host).

### Package registry — pckg (`pckg/` submodule)

**pckg** is the registry service: HTTP API, web UI, accounts, API keys, and storage for package artifacts. The public instance is **[pckg.beskid-lang.org](https://pckg.beskid-lang.org)**.

The Beskid CLI includes client commands for registry operations (publish, fetch, keys, and related workflows) that target this service by default or a custom URL you configure.

Local development typically uses Docker Compose from the `pckg/` directory; see `pckg/README.md` for compose profiles and database setup.

### Website and documentation (`site/website/`)

The marketing site and **canonical documentation** are built with **Astro** and **Starlight**. All user-facing docs are authored under `site/website/src/content/docs/` (no separate docs export step).

Run the dev server from `site/website/` with `bun install` and `bun dev` (see `site/website/README.md` for build, preview, and deployment notes).

### Superrepo automation (`ci/`, `.github/`)

Top-level continuous integration ties the submodules together (compiler, pckg, extension publishing, and related checks). Details live under `ci/` and `.github/` for contributors maintaining pipelines.

## Repository layout (summary)

| Path | Role |
|------|------|
| `compiler/` | Submodule: Rust compiler, CLI, LSP, package CLI client, nested corelib |
| `pckg/` | Submodule: .NET registry application and infrastructure |
| `site/website/` | Astro site: landing + Starlight docs |
| `beskid_vscode/` | Submodule: VS Code extension (Bun/TypeScript) |
| `ci/` | Superrepo CI documentation and helpers |
| `AGENTS.md` | Notes for automation and recurring project conventions |

Clone with submodules so `compiler/`, `pckg/`, and `beskid_vscode/` are populated:

```bash
git clone --recurse-submodules <repository-url>
```

If you already cloned without submodules:

```bash
git submodule update --init --recursive compiler pckg beskid_vscode
```

(`compiler` uses nested submodules for corelib; `--recursive` pulls those too.)

---

Questions about the language itself are best answered by the docs on **[beskid-lang.org](https://beskid-lang.org)**. For registry-specific behavior and URLs, use **[pckg.beskid-lang.org](https://pckg.beskid-lang.org)** together with the guides for the `pckg` CLI in the documentation sidebar.
