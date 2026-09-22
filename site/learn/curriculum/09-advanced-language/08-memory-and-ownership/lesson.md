---
id: advanced_memory
slug: memory-and-ownership
title: Keep references where they can live
context: advanced-language
objective: Explain the memory/reference model and why boundaries reject unsafe escaping references.
category: advanced-language
difficulty: intermediate
prerequisites: ["advanced_ffi"]
command: reference
source: openspec/specs/language-meta--memory-model--memory-and-references/spec.md
vocabulary: ["boundary","contract","advanced","language"]
hints: ["Memory safety depends on ownership, lifetime, and safe cross-boundary representation."]
questions: [{"id":"advanced_memory_q1","text":"Predict why a stack reference cannot simply be carried into independently scheduled work.","options":["It follows the stated contract.","It is a timing or implementation guess."],"correctIndex":0}]
---

## Hook and goal

Explain the memory/reference model and why boundaries reject unsafe escaping references. Memory safety depends on ownership, lifetime, and safe cross-boundary representation.

## Predict

Predict why a stack reference cannot simply be carried into independently scheduled work.

## Run

Reference-only: this capability has no lesson-specific compiler proof in the current Learn runtime. Read the cited specification and do not present this package as an interactive acceptance exercise.

```beskid
// Boundary audit: update ownership transfers through a typed channel.
Channel<QuestUpdate> updates = Channel.Create<QuestUpdate>();
```

## Investigate

Reference-only: memory diagnostics require target/compiler evidence; the normative model remains the guide.

## Modify

For a value crossing an API or fiber boundary, identify owner, lifetime, representation, and mutation rule.

## Make and retrieve

Make a boundary memory audit and retrieve it.

## Failure clinic

```beskid
// Bad: a short-lived stack reference cannot escape into independent work.
spawn () => localScore;
```

Do not infer safety from a program that happened not to fail in one run.

## Recap and next link

Ownership makes long-lived systems explainable. You can now revisit fibers, APIs, and FFI with a complete boundary vocabulary.
