---
title: "Execution domain"
description: Where runtime law lives in the platform spec, and the line between what a program can observe and how the reference runtime implements it.
tableOfContents: true
---

The execution domain owns runtime behavior: memory and GC contracts, fiber scheduling, channels, panic policy, ABI and host integration. Language-meta owns what a program means; execution owns how the reference platform makes that happen, so that changing a stack guard page size does not require a language lawyer's sign-off.

Start at [/platform-spec/execution/](/platform-spec/execution/) for MUST/SHOULD text about the runtime itself. Start at [Language-meta / Evaluation](/platform-spec/language-meta/evaluation/) instead when the question is about spawn semantics rather than stack sizes: "what can a Beskid program observe" is language-meta's question, "how does the reference runtime implement that" is execution's, and "which crate file do I patch" goes to the [implementation map](/platform-spec/compiler/implementation-map/crate-to-spec-anchors/) and chapter 13.
