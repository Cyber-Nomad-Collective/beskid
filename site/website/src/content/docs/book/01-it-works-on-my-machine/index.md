---
title: "It works on my machine (and yours, eventually)"
description: Install the Beskid CLI, verify a release or local build, and run your first commands without ritual sacrifice.
tableOfContents: true
---

Philosophy is optional. A compiler binary is not.

This chapter is the **"get off Twitter and onto a terminal"** track: downloads, PATH, building from source when you must, and the smallest smoke test that proves the toolchain is alive. Normative install contracts live on [Downloads](/downloads/) and in [tooling manifests](/platform-spec/tooling/); here we stay practical.

If you skipped [Why Beskid Exists](/book/00-why-beskid-exists/), nobody is judging you (much).

## What you will find here

| Section | Topic |
| --- | --- |
| [Downloads and rolling releases](/book/01-it-works-on-my-machine/downloads-and-releases/) | `cli-stable` / `cli-unstable`, version files, and what "rolling" means. |
| [Install scripts and PATH](/book/01-it-works-on-my-machine/install-scripts-and-path/) | Platform install tabs, shell profile, and finding `beskid`. |
| [Build from source](/book/01-it-works-on-my-machine/build-from-source/) | Compiler workspace, targets, and when CI binaries are not enough. |
| [First smoke test](/book/01-it-works-on-my-machine/first-smoke-test/) | `beskid --version`, `parse`, `analyze` on a real `.bd` file. |
| [Troubleshooting install](/book/01-it-works-on-my-machine/troubleshooting-install/) | Wrong arch, stale PATH, corelib materialization, and other fun. |

## By the end of this chapter

- You have a `beskid` binary on your PATH (or you know exactly why not).
- You understand rolling CLI versioning vs pinning for CI.
- You can run a one-file parse/analyze without opening the compiler repo.

## Start here

[Downloads and rolling releases](/book/01-it-works-on-my-machine/downloads-and-releases/) — or jump straight to [First smoke test](/book/01-it-works-on-my-machine/first-smoke-test/) if someone already installed the CLI for you.

## Next chapter

[02. PATH not found — tooling anyway](/book/02-path-not-found-tooling-anyway/) — editors, LSP, and the CLI surface you will live in daily.
