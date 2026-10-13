---
title: "The corelib command"
description: Materialize the embedded corelib template when you need to read or patch the standard library locally.
tableOfContents: true
---

`beskid dev corelib` copies the **embedded** Corelib workspace that ships inside the CLI build. You use it when you need a tree on disk: contributing to the standard library, debugging injection, or pointing `BESKID_CORELIB_ROOT` at something you actually control.

## What it does

- Copies the whole Corelib **workspace**: the `.bws` workspace manifest and every member, including the Mods under `mods/`. Default output: `corelib` (override with `--output`).
- If the destination is already the bundled Corelib location, the command reports the path and exits, no redundant copy.
- Canonical sources in the superrepo live under `compiler/corelib/`; the aggregate manifest is `compiler/corelib/beskid_corelib/corelib.bproj` and the **pckg package id** is **`corelib`**, not whatever folder name your trauma assigned in 2019.

## Example

```bash
beskid dev corelib --output ./vendor/corelib
```

## Normative anchors

- [Corelib discovery and packaging](/docs/standard/capabilities/core-library--compiler-integration--corelib-discovery-and-packaging/)
- [`beskid dev corelib` command reference](/book/reference/cli/commands/corelib/)

## Previous

[Corelib hub](/book/16-corelib-batteries-with-opinions/)
