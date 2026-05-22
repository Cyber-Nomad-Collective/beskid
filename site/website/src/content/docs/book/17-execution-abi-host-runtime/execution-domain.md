---
title: "Execution domain"
description: Where runtime law lives in platform-spec and how it relates to language-meta.
tableOfContents: true
---

The **Execution** domain owns runtime behavior: memory and GC contracts, fiber scheduling, channels, panic policy, and ABI/host integration. **Language meta** owns what programs *mean*; execution owns how the reference platform *does it* without every language lawyer editing Rust.

Start at [/platform-spec/execution/](/platform-spec/execution/) when you need MUST/SHOULD text. Start at [Language meta / Evaluation](/platform-spec/language-meta/evaluation/) when the question is spawn semantics, not stack guard page sizes.

## Split that saves review time

| Question type | Open first |
| --- | --- |
| "What can a Beskid program observe?" | Language-meta |
| "How does the reference runtime implement it?" | Execution |
| "Which crate file do I patch?" | [Implementation map](/platform-spec/compiler/implementation-map/crate-to-spec-anchors/) + chapter 13 |

## Hub

[17. Execution](/book/17-execution-abi-host-runtime/)
