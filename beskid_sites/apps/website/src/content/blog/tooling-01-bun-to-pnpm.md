---
title: "bun lockfiles lied to us. pnpm didn't. The migration that broke CI for three days."
description: "July 2026. The bun→pnpm migration across all sites and CI. Three days of broken pipelines, Docker images that wouldn't build, and the discovery that monorepo package managers are personality tests with consequences."
date: 2026-07-23
blogStatus: released
release: Tooling
---

bun was fast. Impossibly fast. `bun install` finished before you finished typing it. That was the problem.

For six months, the Beskid monorepo ran on bun. The lockfile was a binary format that changed between versions. The Docker builds referenced one platform's resolution; the CI runner used another. The website built fine on a macOS laptop and segfaulted on a Linux CI node. Nobody noticed because the lockfile said everything was resolved — it just didn't say which platform it resolved for.

The [Book chapter "Monorepo as coping mechanism"](/book/03-project-proj-or-it-didnt-happen/) opens with a statement that hits harder after you have lived through this: a monorepo is not a convenience. It is a coordination tax you pay up front so you do not pay it with interest on every cross-repo release. The package manager is the collector of that tax. Pick the wrong collector, and every `install` is a lottery.

## Day 1: The lockfile drift

The first sign was a Docker build failure. The website's Dockerfile ran `bun install` inside a `node:20-slim` container. It resolved dependencies for linux/amd64. The lockfile — committed from a macOS machine — had resolved them for darwin/arm64. Optional dependencies that exist on macOS don't exist in the slim Debian image. bun knew that. The lockfile didn't.

The fix seemed obvious: regenerate the lockfile on Linux. But the CI runner was macOS. The Docker build was Linux. The development machines were a mix. Three platforms, one lockfile, and a package manager that didn't think platform identity was part of the resolution contract.

This is not a bun bug. It is a design choice. bun optimizes for install speed. Lockfile portability is a second-order concern. For a single-platform application deployed in a homogeneous environment, that tradeoff is fine. For a monorepo with three websites, a shared package, Docker builds, and CI across two operating systems, it is a time bomb.

## Day 2: The CI segfault

We tried the migration the obvious way: swap `bun install` for `pnpm install` in every workflow, regenerate the lockfile, push. CI segfaulted.

Not a clean segfault with a stack trace. A bus error in `pnpm`'s dependency resolver, deep inside a native module that had been compiled against bun's Node.js compatibility layer and was now running against real Node.js. The module was `esbuild`. It was two versions behind the version pnpm expected. bun had accepted the mismatch silently.

The [Trauma chapter](/book/00-why-beskid-exists/trauma-and-design/) in the Book — the section on package managers as personality tests — calls this out directly. Every package manager encodes a philosophy. npm encodes "the registry is the source of truth." yarn encodes "determinism above all." bun encodes "speed is the feature." pnpm encodes "correctness is the feature." The philosophy you pick determines which class of bugs you will never see, and which class you will fight every Tuesday afternoon.

## Day 3: The flag plant

Commit [`c6717dee`](https://github.com/Cyber-Nomad-Collective/beskid/commit/c6717dee) — "complete bun→pnpm migration across all sites and CI" — was the flag-plant. It touched thirty-seven files across five workflows:

- **Platform-delivery gates repaired.** Every CI workflow that had `bun` hardcoded was switched to `pnpm`. The `pnpm/action-setup` pin was locked to a specific SHA — not a floating version tag that could drift.
- **Dockerfiles tightened.** The secure-dockerfile contract now mandates `pnpm install --frozen-lockfile` with `--production` for runtime images. No network resolution during Docker build. The lockfile is the sole authority.
- **pnpm learn image.** A dedicated Docker image for CI that pre-installs pnpm with the correct Node.js version, so the CI workflow doesn't spend forty seconds installing the package manager before it can install the packages.
- **Website document smoke.** The website build step now fails if `pnpm build` produces a non-zero exit code or if the output directory is missing `index.html`. Previously it failed silently — bun had swallowed the build error and returned 0.

## What we learned

Lockfile format stability matters more than install speed. A lockfile that resolves differently on different platforms is not a lockfile — it is a suggestion. CI should be boring. When CI is exciting, something is wrong. Monorepo tooling is never a one-afternoon migration. Budget three days. If it takes one, you got lucky. If it takes five, you are normal.

The JavaScript ecosystem fracture rant in the Book is not hyperbole. In 2026, choosing a package manager is choosing a faction in a civil war where the factions don't agree on what a dependency is.

pnpm works. The lockfile is YAML. It is the same YAML on macOS, Linux, and in Docker. The `import` syntax for workspace packages is explicit. The `--frozen-lockfile` flag actually freezes the lockfile. For now, that is enough. That is what matters.

## Provenance

[`c6717dee` — complete bun→pnpm migration across all sites and CI](https://github.com/Cyber-Nomad-Collective/beskid/commit/c6717dee)
