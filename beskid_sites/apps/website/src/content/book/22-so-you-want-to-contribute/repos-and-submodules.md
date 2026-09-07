---
title: "Repos and submodules"
description: Where compiler, pckg, VS Code extension, and corelib actually live in the aggregate repo.
tableOfContents: true
---

The **beskid** superrepo aggregates submodules—especially **`compiler`**, **`pckg`**, and **`beskid_vscode`**. Corelib is a nested submodule under `compiler/corelib` (`beskid_standard`), not a top-level sibling.

## Typical layout

| Path | What |
| --- | --- |
| `compiler/` | CLI, analysis, codegen, runtime, LSP, pckg client crates |
| `pckg/` | Registry service (ASP.NET), dashboard, publish pipeline |
| `beskid_vscode/` | Open VSX extension and bundled LSP |
| `compiler/corelib/beskid_corelib/` | Canonical stdlib Beskid sources (`corelib` package) |
| `site/website/` | Public docs (platform-spec + book + downloads) |
| `packages/trudoc/` | Docs verification and nav generation |

Clone with submodules initialized or you will debug "missing crate" ghosts for an afternoon.

```bash
git submodule update --init --recursive
```
