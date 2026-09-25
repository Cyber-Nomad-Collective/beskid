---
title: "Runtime fibers"
description: Cooperative scheduling in beskid_runtime, why a fiber switch on Linux x86-64 is a Cranelift tail transfer, and where the language-facing API lives instead.
tableOfContents: true
---

Beskid schedules fibers cooperatively rather than handing control to an OS thread scheduler or an async/await state machine; inception [D-INC-0008](/platform-spec/community/project-inception/adr/0008-fibers-not-async-await/) is why that fight was settled early. `beskid_runtime` implements the scheduler itself, stack growth, run-queue fairness, and what shutdown does to fibers that were never joined, specified under [fiber scheduler and stacks](/platform-spec/execution/runtime/fiber-scheduler-and-stacks/) and [channels and synchronization](/platform-spec/execution/runtime/channels-and-synchronization/).

On Linux x86-64 a fiber switch lowers to a Cranelift tail transfer, not an OS context switch, which is the source of most of the performance story and none of the API story. `corelib_concurrency` is the language-facing surface, `Fiber<T>`, `Join`, `Detach`, covered in chapter 11, and this page is only about what the scheduler underneath it does. Confusing the two crates is how a PR meant to "fix fibers" lands in the wrong repository.
