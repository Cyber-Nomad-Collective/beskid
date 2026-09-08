---
title: Beskid Docs
description: Technical documentation for the Beskid language and its tools.
audience:
  - evaluator
  - newcomer
  - developer
  - package author
  - operator
  - contributor
authority:
  status: informative
  sourceLabel: Beskid Standard
  sourceHref: /docs/standard/
  limits: This page routes readers to technical guidance. It does not define language behavior.
verified:
  revision: 66b9df956038d24f9d216308223175ca9da60931
  date: 2026-09-08
---

Use this area for technical work with Beskid. It is the public documentation surface at `beskid-lang.org/docs`.

The 0.4.0 tag exists. Post-tag work is still under verification: the Rust-backed package registry starts with a fresh package store, and compiler and delivery evidence are being checked as separate release slices. Read published guidance as current only when it names a verified command, artifact, or standard rule.

Start with the task that you need to do:

- Read [Get started](/docs/getting-started/) to install the toolchain and check a first program.
- Read [Tooling](/docs/tooling/) for analysis, formatting, builds, and language-service support.
- Read [Projects](/docs/projects/) before you add a `.bproj` manifest or dependencies.
- Read [Packages](/docs/packages/) before you pack or publish a `.bpk` artifact.
- Read [the standard](/docs/standard/) for normative language and tool behavior.
- Read [documentation authoring](/docs/contributing/documentation/) before you change technical documentation.
- Read [The Beskid Book](/book/) to learn the language step by step.
- Read [Downloads](/downloads/) to install the current tools.

## Documentation authority

Each source has one job.

| Source | Use it for |
| --- | --- |
| OpenSpec | Normative requirements and conformance scenarios. |
| Beskid Docs | Technical guidance that explains how to use or maintain Beskid. |
| The Beskid Book | Learning material and tutorials. |
| The Beskid Blog | Dated project news and decisions. |

The Docs site does not create another copy of the standard. OpenSpec remains the source for normative requirements. This site provides its public entry point and technical guidance.
