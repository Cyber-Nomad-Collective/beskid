---
title: "Registry-assigned versions"
description: Normal flows do not let publishers hand-type package versions like it is 2014.
tableOfContents: true
---

In normal publish flows, **the registry assigns package versions**—publishers do not supply manual semver bumps for every upload unless policy explicitly allows exceptions. That kills an entire class of "I published `99.99.99` because marketing" incidents.

## What you declare vs what you get

| You write in `Project.proj` | Registry / lockfile owns |
| --- | --- |
| Package id, dependencies, targets | Resolved version pins |
| Dependency version ranges (policy) | Concrete versions after fetch/lock |

Treat `Project.lock` as truth for CI reproducibility—chapter 06 workspace material covers multi-project graphs.

## Spec

- [Package kinds](/platform-spec/tooling/registry-client/package-kinds/)
- [Project manifest contract](/platform-spec/tooling/manifests-and-lockfiles/project-manifest-contract/)
