---
title: "Runtime fibers"
description: Cooperative scheduling, stacks, and why async/await is not the plan.
tableOfContents: true
---

Beskid uses **fibers** with cooperative scheduling—see inception [D-INC-0008](/platform-spec/community/project-inception/adr/0008-fibers-not-async-await/). The runtime feature [Fiber scheduler and stacks](/platform-spec/execution/runtime/fiber-scheduler-and-stacks/) is where stack growth, scheduling fairness, and shutdown behavior are specified.

`beskid_runtime` implements the scheduler; `corelib_concurrency` exposes the language-facing API. Confusing the two is how you open a PR that "fixes fibers" in the wrong repo.

## Spec

- [Channels and synchronization](/platform-spec/execution/runtime/channels-and-synchronization/)
- [Fibers and spawn (language)](/platform-spec/language-meta/evaluation/fibers-and-spawn/)

## Hub

[17. Execution](/book/17-execution-abi-host-runtime/)
