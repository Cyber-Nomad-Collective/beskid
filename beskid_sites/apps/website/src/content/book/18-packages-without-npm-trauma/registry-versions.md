---
title: "Registry-assigned versions"
description: Normal flows do not let publishers hand-type package versions like it is 2014.
tableOfContents: true
---

In normal publish flows, **the registry assigns package versions**. Publishers do not supply manual semver bumps for every upload unless policy explicitly allows exceptions. That kills an entire class of "I published `99.99.99` because marketing" incidents.

## What you declare vs what you get

You write the package id, its dependencies, and its targets in the `.bproj` manifest. The registry resolves the concrete version on upload, and the lockfile pins it for every later fetch. Dependency version ranges are policy you write; the exact versions that satisfy them after resolution are not yours to type.

Treat the lockfile as truth for CI reproducibility. Chapter 06 covers multi-project workspace graphs.

## Spec

- [Package kinds](/platform-spec/tooling/registry-client/package-kinds/)
- [Project manifest contract](/platform-spec/tooling/manifests-and-lockfiles/project-manifest-contract/)
