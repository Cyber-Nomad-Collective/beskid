---
id: advanced_extend
slug: extending-types
title: Extend without stealing the house
context: advanced-language
objective: Explain extend type as an external member contribution with a clear ownership boundary.
category: advanced-language
difficulty: intermediate
prerequisites: ["corelib_conversions"]
command: reference
source: openspec/specs/language-meta--program-structure--extend-type/spec.md
vocabulary: ["boundary","contract","advanced","language"]
hints: ["extend type adds members externally; it is not an excuse to split a coherent owner."]
questions: [{"id":"advanced_extend_q1","text":"Predict when a method belongs inline with a type versus in an external extension.","options":["It follows the stated contract.","It is a timing or implementation guess."],"correctIndex":0}]
---

## Hook and goal

Explain extend type as an external member contribution with a clear ownership boundary. extend type adds members externally; it is not an excuse to split a coherent owner.

## Predict

Predict when a method belongs inline with a type versus in an external extension.

## Run

Reference-only: this capability has no lesson-specific compiler proof in the current Learn runtime. Read the cited specification and do not present this package as an interactive acceptance exercise.

```beskid
extend type Quest {
  pub i32 Priority() { return 0; }
}
```

## Investigate

Reference-only: verify project and module context before treating extension syntax as runnable.

## Modify

Classify three methods as owning-type behavior, cross-module extension, or generated contribution.

## Make and retrieve

Make an extension review question and retrieve it.

## Failure clinic

```beskid
// Bad external extension: private owning storage is not its API.
quest.privateScore;
```

Do not use extensions to hide an unclear module dependency.

## Recap and next link

Extensions contribute deliberately. Next: attach metadata without changing runtime logic.
