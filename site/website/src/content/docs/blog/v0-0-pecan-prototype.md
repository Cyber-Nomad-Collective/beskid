---
title: "v0.0: Pecan prototype"
description: "The Pecan-era experiments that preceded the Beskid name and compiler submodule."
date: 2026-03-05
blogStatus: released
release: v0.0
---

v0.0 records the Pecan prototype period, from 18 February to 5 March 2026. It ends at the compiler-submodule handoff (`dd75bff`); later Beskid compiler work belongs to the next delivery band.

The prototype established a staged analysis direction: parsing, HIR, resolution, diagnostics, desugaring, and query-style traversal. It also explored JIT and runtime seams, including a simple `gc-arena` research path. These were experiments and foundations, not claims about the later production runtime.

The period also included an in-process `pecan_lsp` experiment and early project-manifest and compiler-mod research. Neither `project.pn` nor the stage-8 metaprogramming experiments became the later public path: subsequent work moved to `Project.proj`, pckg, and the Beskid tooling stack.

For current language behaviour, use the [Platform Spec](/platform-spec/), not this historical note.

## Provenance

[Tracker record](https://github.com/Cyber-Nomad-Collective/beskid_tracker/blob/main/data/v0.0/version.json) · [maintainer narrative](https://github.com/Cyber-Nomad-Collective/beskid_tracker/blob/main/data/v0.0/article.md) · [compiler handoff `dd75bff`](https://github.com/Cyber-Nomad-Collective/compiler/commit/dd75bff)
