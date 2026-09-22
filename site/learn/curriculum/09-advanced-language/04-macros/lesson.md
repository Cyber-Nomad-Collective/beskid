---
id: advanced_macros
slug: macros
title: Generate structure, keep the source honest
context: advanced-language
objective: Explain macro definitions and invocations as syntax-level generation with explicit expansion boundaries.
category: advanced-language
difficulty: intermediate
prerequisites: ["advanced_docs"]
command: reference
source: openspec/specs/language-meta--metaprogramming--macros/spec.md
vocabulary: ["boundary","contract","advanced","language"]
hints: ["Macros generate structured syntax; they do not waive later semantic checking."]
questions: [{"id":"advanced_macros_q1","text":"Predict whether a macro expansion can make an invalid type relationship valid by hiding it.","options":["It follows the stated contract.","It is a timing or implementation guess."],"correctIndex":0}]
---

## Hook and goal

Explain macro definitions and invocations as syntax-level generation with explicit expansion boundaries. Macros generate structured syntax; they do not waive later semantic checking.

## Predict

Predict whether a macro expansion can make an invalid type relationship valid by hiding it.

## Run

Reference-only: this capability has no lesson-specific compiler proof in the current Learn runtime. Read the cited specification and do not present this package as an interactive acceptance exercise.

```beskid
macro Repeat(expression value) {
  // Host-driven expansion contributes structured syntax.
}
```

## Investigate

Reference-only: macro host support and invocation syntax require verified fixtures.

## Modify

List the repetition that a macro would remove and the readable source it must still preserve.

## Make and retrieve

Make a macro justification: repeated structure, input shape, expansion owner, diagnostics plan.

## Failure clinic

```beskid
// Bad use: macro expansion cannot hide an invalid return relationship.
i32 Score() { return "high"; }
```

Do not use a macro to conceal ordinary control flow or an unclear API.

## Recap and next link

Macros reduce structural repetition. Next: learn where compiler mods fit.
