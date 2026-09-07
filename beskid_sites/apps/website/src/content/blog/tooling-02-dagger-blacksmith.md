---
title: "Dagger, Blacksmith, Nox: The CI Pipeline That Segfaulted on Docker"
description: "June 2026. We migrated CI from GitHub Actions to Dagger on Blacksmith Testbox. The Dagger engine segfaulted. We downgraded it twice. Node runtime crashed. This is the story of infrastructure mortality — and why CI should be boring."
date: 2026-06-17
blogStatus: released
release: Tooling
---

Infrastructure is not pure. It crashes in ways the docs don't cover.

In June 2026, Beskid's CI migrated from GitHub Actions to Dagger pipelines running on Blacksmith Testbox, orchestrated by Nox-driven aggregate workflows. The migration was planned. The design was reviewed. The commits were clean. The engine still segfaulted three times before it stabilized.

This is not a story about Dagger or Blacksmith being bad tools. They are good tools. It is a story about the gap between "it works on my machine" and "it works in CI" — and the discovery that CI runners have hardware quirks, kernel versions, and memory pressure patterns that your laptop does not.

## Before: GitHub Actions with manual submodule bumps

The old CI was not broken. It was just slow, manual, and encoding tribal knowledge in YAML files that nobody wanted to read.

GitHub Actions ran the test matrix. Submodule bumps were manual — someone had to notice that `beskid_runtime` had a new commit, open a PR updating the submodule pointer, wait for CI, merge. If nobody noticed, the submodule drifted. The drift was silent until something broke, at which point it was loud.

The workflow files were hundreds of lines of YAML with seventeen `if:` conditionals checking whether the runner was macOS or Linux, whether the cache was warm, whether the previous step had produced artifacts. Each conditional was a decision made at 2 AM and never revisited. The sum of those decisions was a CI pipeline that worked — but nobody could explain why.

## The migration

The commits tell the story in three acts:

1. **Setup.** Commits for git nexus ingest, CICD workflow scaffolding, and the initial Nox session file. These were the calm before the storm. Every line of YAML looked reasonable. Every `dagger call` returned zero.

2. **Migration.** The "CICD: Dagger migration" commit swapped the entire pipeline. GitHub Actions became a thin shell — `nox -s cicd` — and the real work moved into Dagger functions written in TypeScript. Pipeline-as-code, not pipeline-as-YAML. Functions that could be tested locally, not debugged in CI. The promise of Dagger is that your CI pipeline is just a program, and programs can be run anywhere. The promise held for about four hours.

3. **Reverts.** This is where the story diverges from the blog post you were expecting.

## The segfault trilogy

Dagger engine v0.21.6 shipped with a Node.js runtime update. The update changed how the V8 garbage collector interacted with shared memory buffers used by Dagger's container orchestration layer. On x86_64 Linux, under the kernel version Blacksmith Testbox was running (6.1.x), the interaction produced a segfault. On arm64 macOS, it did not. On x86_64 Linux with kernel 6.5+, it did not. The failure was a single point in a three-dimensional matrix of architecture, kernel version, and V8 GC flag.

The first revert: `fix: Revert Dagger engine to v0.21.0 (Node runtime segfault in 0.21.5+)`. v0.21.0 worked. v0.21.5 introduced the problematic V8 update. The fix was to pin to v0.21.0 and wait.

v0.21.0 had a different bug: it leaked file descriptors when pulling container images from GHCR. After three hours of CI, the runner would hit the `ulimit` and fail with `EMFILE: too many open files`. The bug was fixed in v0.21.5 — the version we couldn't run.

The second revert: `fix: Downgrade Dagger engine from v0.21.6 to v0.21.5 (segfault in Node runtime)`. v0.21.6 had attempted to fix the v0.21.5 segfault but introduced a new one — different stack trace, same symptom, deeper in the V8 embedding layer. The downgrade to v0.21.5 was an attempt to live with the segfault by running fewer concurrent pipelines. It didn't work. The segfault wasn't load-dependent; it was timing-dependent. A pipeline that ran fine at 3 PM would crash at 3:15 PM with the same inputs.

The final stable configuration: Dagger v0.21.0 with a `ulimit -n 4096` workaround and a cron job that restarted the Blacksmith runner every two hours to clear the file descriptor leak. Not elegant. Not what the docs describe. But green.

## The Book chapter connection

The [Book chapter "It works on my machine"](/book/00-why-beskid-exists/it-works-on-my-machine/) is not just a joke. It is a statement about the mortality of infrastructure. Every CI system is a machine — a real machine, with a real kernel, running real processes, subject to real resource limits. The abstraction layers (Dagger, Docker, Node.js, V8, the kernel) stack so high that when something breaks at the bottom, the symptoms at the top are inscrutable.

The irony is not lost. Beskid is building a language runtime. We debugged a CI engine's language runtime to deploy the CI that tests our language runtime. The recursion is absurd. The lesson is not.

## Why CI should be boring

CI should be boring. When CI is exciting, something is wrong.

"Exciting" means segfaults you have to bisect by engine version. It means file descriptor leaks that only manifest after three hours. It means a kernel version matrix that isn't in any compatibility table. Boring means you push, it runs, it passes or fails on the merits of your code — not on the phase of the moon.

Besk ID's CI is now boring. Dagger v0.21.0 is pinned. Blacksmith Testbox restarts every two hours. The Nox workflows are stable. The migration taught us that infrastructure mortality is real — every layer you depend on can and will fail in ways that are not your fault but are absolutely your problem. The only defense is to make the failure surface as boring as possible, and to document every exciting moment so the next engineer knows they are not crazy.

## Provenance

[Dagger migration commits](https://github.com/Cyber-Nomad-Collective/beskid/commits/main/.github/workflows) — [Blacksmith Testbox configuration](https://github.com/Cyber-Nomad-Collective/beskid_infra)
