---
title: "v0.3: Integration weekend"
description: "A truncated integration band for macro, runtime, FFI, corelib, and tooling tracks."
date: 2026-05-25
blogStatus: truncated
release: v0.3
---

v0.3 covers the 23–25 May 2026 integration window, from `f57377a` to `aaddd32`. Eight coordinated tracks brought together compiler-mod execution, native DI, export FFI, foreign-library import, phase-B GC work, corelib tiering, tooling package kinds, and post-merge CI and documentation hardening.

The stabilization work included runtime bridge and ASan CI wiring, trudoc verification, grammar and frontmatter fixes, the `beskid lsp` command, and VS Code bootstrap work. It also recorded `verify-all-on-main` evidence for the landings captured in this band.

This is deliberately marked **truncated**. Work not completed within the cutoff—including further macro/concurrency stabilization and tracker productization—continued in v0.4. The post is a delivery record, not a statement that every planned v0.3 item shipped.

For current contracts, consult [the Platform Spec](/platform-spec/).

## Provenance

[Tracker record](https://github.com/Cyber-Nomad-Collective/beskid_tracker/blob/main/data/v0.3/version.json) · [maintainer narrative](https://github.com/Cyber-Nomad-Collective/beskid_tracker/blob/main/data/v0.3/article.md) · [truncation cutoff `aaddd32`](https://github.com/Cyber-Nomad-Collective/beskid/commit/aaddd32)
