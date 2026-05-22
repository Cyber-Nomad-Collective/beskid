---
title: "The corelib command"
description: Materialize the embedded corelib template when you need to read or patch the standard library locally.
tableOfContents: true
---

`beskid corelib` copies the **embedded** corelib project template that ships inside the CLI build. You use it when you need a tree on disk—contributing to stdlib, debugging injection, or pointing `BESKID_CORELIB_SOURCE` at something you actually control.

## What it does

- Default output: `corelib/beskid_corelib` (override with `--output`).
- If the destination is already the bundled template location, the command reports the path and exits—no redundant copy performance theatre.
- Canonical sources in the superrepo live under `compiler/corelib/beskid_corelib/`; the **pckg package id** is **`corelib`**, not whatever folder name your trauma assigned in 2019.

## Example

```bash
beskid corelib --output ./vendor/beskid_corelib
```

## Normative anchors

- [Corelib discovery and packaging](/platform-spec/core-library/compiler-integration/corelib-discovery-and-packaging/)
- [CLI corelib command](/book/reference/cli/commands/corelib/)

## Previous

[Corelib hub](/book/16-corelib-batteries-with-opinions/)
