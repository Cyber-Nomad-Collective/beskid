---
title: "v0.1: Compiler foundation"
description: "Standalone compiler foundations, release tooling, and the first Beskid delivery band."
date: 2026-04-22
blogStatus: released
release: v0.1
---

v0.1 spans 5 March through 22 April 2026, from the compiler handoff (`dd75bff`) to the superrepo v0.1.0 tag (`f777b79`). It established the standalone compiler repository while keeping release automation in the Beskid superrepo.

This band included AOT and `beskid pack` work, file-scoped module semantics, resolver hardening, and graph-based standard-library injection. The compiler's nested corelib submodule became the standard-library source for standalone compiler CI and CLI provisioning.

The delivery work also covered CLI release uploads and the VS Code extension's bundled-LSP default, alongside Open VSX publishing automation. v0.1 stops before the later platform-spec and trudoc cutover; those changes are documented by v0.2.

The current contract for modules and compiler behaviour is maintained in the [Platform Spec](/platform-spec/), rather than inferred from this release history.

## Provenance

[Tracker record](https://github.com/Cyber-Nomad-Collective/beskid_tracker/blob/main/data/v0.1/version.json) · [maintainer narrative](https://github.com/Cyber-Nomad-Collective/beskid_tracker/blob/main/data/v0.1/article.md) · [delivery cutoff `f777b79`](https://github.com/Cyber-Nomad-Collective/beskid/commit/f777b79)
