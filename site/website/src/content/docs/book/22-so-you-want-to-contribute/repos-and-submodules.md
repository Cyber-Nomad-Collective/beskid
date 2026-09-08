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
| `pckg/` | Registry service (Rust), dashboard, publish pipeline |
| `beskid_vscode/` | Open VSX extension and bundled LSP |
| `compiler/corelib/beskid_corelib/` | Canonical stdlib Beskid sources (`corelib` package) |
| `openspec/` | Normative Standard source and generated catalog |
| `site/website/` | Public Docs, Book, Standard presentation, and downloads |

Run the repository setup script from the superrepo root. It initializes the required submodules and installs the root pnpm dependencies.

```bash
./scripts/setup-environment.sh
```

Use [Repository setup](/docs/contributing/repository/) for prerequisites, focused checks, ownership, and recovery.
