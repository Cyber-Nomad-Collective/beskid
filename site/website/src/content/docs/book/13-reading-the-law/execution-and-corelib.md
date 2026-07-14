---
title: "Execution and core library"
description: Navigate execution and core library in platform-spec and tie reading to crates.
tableOfContents: true
---

Execution and the core library answer different questions. Read [Execution](/platform-spec/execution/) for runtime, ABI, and host behavior; read [Core library](/platform-spec/core-library/) for the library surface exposed to programs.

## Choose the right domain

| If you are asking about… | Start here |
| --- | --- |
| Host calls, runtime services, ABI boundaries, or conformance execution | [Execution](/platform-spec/execution/) |
| Public library APIs, corelib organization, or compiler integration | [Core library](/platform-spec/core-library/) |

Cross-domain features may link to both hubs. Follow those links rather than assuming that an API name describes its owning contract.

## Trace into code carefully

Once you have identified the feature, use its implementation anchors and tests as supporting evidence. The standard remains the authority for observable behavior; source layout is allowed to change.

## Hub

[13. Reading the law](/book/13-reading-the-law/)
