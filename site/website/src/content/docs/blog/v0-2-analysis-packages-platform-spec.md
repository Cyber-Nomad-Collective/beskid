---
title: "v0.2: Analysis, packages, and platform specification"
description: "A released band connecting the analysis pipeline, package documentation, and the public specification."
date: 2026-05-22
blogStatus: released
release: v0.2
---

v0.2 ran from 23 April to 22 May 2026, after v0.1.0 and through the trudoc verification baseline (`f57377a`). Its main result was a shared direction for analysis, package documentation, editor services, and public specification work.

The platform-spec cutover made [`/platform-spec/`](/platform-spec/) the normative documentation area, with the Book remaining informative. The compiler and package registry also adopted hierarchical `api.json` as a documentation contract, so package documentation could represent types, members, signatures, and links consistently.

Other tracked work included the pipeline/services split, expanded LSP workspace capabilities, macro and composition HIR work, and runtime-related surfaces such as fibers, channels, and `abfall` GC integration. This summary records the delivery band; it does not change the normative status of any individual feature.

See [the Platform Spec](/platform-spec/) for current language and execution requirements.

## Provenance

[Tracker record](https://github.com/Cyber-Nomad-Collective/beskid_tracker/blob/main/data/v0.2/version.json) · [maintainer narrative](https://github.com/Cyber-Nomad-Collective/beskid_tracker/blob/main/data/v0.2/article.md) · [delivery cutoff `f57377a`](https://github.com/Cyber-Nomad-Collective/beskid/commit/f57377a)
