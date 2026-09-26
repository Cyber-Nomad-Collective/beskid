---
title: "Install scripts and PATH"
description: Shell install flows, PATH hygiene, and verifying the binary the shell actually runs.
tableOfContents: true
---

Installing a compiler is two problems: **get bytes onto disk** and **convince your shell to run those bytes** instead of the haunted binary from 2019 in `/usr/local/bin`.

## Install scripts (high level)

The Downloads page exposes platform tabs with a copy-paste command block. Scripts generally:

1. Detect OS/arch (or ask you to pick the right asset).
2. Download the release artifact (GitHub or CDN mirror).
3. Place `beskid` in a predictable directory (often user-local).
4. Print instructions to add that directory to `PATH`.

Follow the tab for your platform on [Downloads](/downloads/); do not cargo-cult a macOS curl line on WSL unless you enjoy surprise architecture mismatches.

## PATH: the silent failure mode

After install, open a **new** terminal (or `source` your profile). Then:

```bash
which beskid
beskid --version
```

If `which` points somewhere unexpected, the shell is running whichever `beskid` sits first on `PATH`, not the one you just installed. Common fixes:

- Put the install directory **before** stale paths in `PATH` (profile or `direnv`).
- Remove duplicate installs you forgot about.
- On macOS, check whether Rosetta vs native arch matches the downloaded build.

## Corelib is implicit, not installed

The standard library (`Core.*`, e.g. `Core.Output`, `Core.Optional`) is available to every project automatically; the resolver injects the corelib package for you, so you never declare it as a dependency. You still import what you use, under the `Std` root, for example `use Std.Core.Output;`. There is nothing to install here.

If you are developing the standard library itself, `beskid corelib [--output dir]` copies the embedded corelib tree to disk so you have something to edit, and `BESKID_CORELIB_SOURCE` points the resolver at that materialized tree instead of the embedded one (see [CLI command reference](/book/reference/cli/command-reference/)). Application code never needs either.
