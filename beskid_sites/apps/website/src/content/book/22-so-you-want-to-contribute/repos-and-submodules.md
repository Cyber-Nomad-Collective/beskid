---
title: "Repos and submodules"
description: Where compiler, pckg, VS Code extension, and corelib actually live in the aggregate repo.
tableOfContents: true
---

The **beskid** superrepo aggregates submodules, especially **`compiler`**, **`pckg`**, and **`beskid_vscode`**. Corelib is a nested submodule under `compiler/corelib` (`beskid_standard`), not a top-level sibling.

## Typical layout

| Path | What |
| --- | --- |
| `compiler/` | CLI, analysis, codegen, ABI/runtime, LSP, pckg client crates |
| `compiler/crates/beskid_pckg_server/` | Registry service (Rust, not the old ASP.NET one) |
| `pckg/` | Registry deployment: Dockerfile, Compose files, ops scripts |
| `beskid_vscode/` | Open VSX extension and bundled LSP |
| `compiler/corelib/beskid_corelib/` | Canonical stdlib Beskid sources (`corelib` package) |
| `beskid_sites/apps/website/` | Beskid Book (this file tree) |
| `beskid_sites/apps/pckg/` | Registry dashboard (TanStack web app) |
| `packages/trudoc/` | Docs verification and nav generation |

Public docs are split across more than one site app under `site/` and `beskid_sites/apps/`. See [Docs and website](/book/22-so-you-want-to-contribute/docs-and-website/) for the reader-facing split; treat this table as the repo map, not the routing map.

Clone with submodules initialized or you will debug "missing crate" ghosts for an afternoon.

```bash
git submodule update --init --recursive
```
