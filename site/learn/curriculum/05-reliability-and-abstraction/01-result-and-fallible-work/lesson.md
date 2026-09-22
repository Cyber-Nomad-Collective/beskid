---
id: reliability_result
slug: result-and-fallible-work
title: Put failure in the return parcel
context: reliability-and-abstraction
objective: Model expected unsuccessful work as an explicit outcome a caller can inspect.
category: reliability-and-abstraction
difficulty: intermediate
prerequisites: ["structure_tests"]
command: reference
source: openspec/specs/core-library--foundation-and-primitives--core-results/spec.md
vocabulary: ["boundary","contract","reliability","and"]
hints: ["Result keeps success and expected failure visible to callers."]
questions: [{"id":"reliability_result_q1","text":"Predict what a caller can do with typed error data that a sentinel number cannot support.","options":["It follows the stated contract.","It is a timing or implementation guess."],"correctIndex":0}]
---

## Hook and goal

Model expected unsuccessful work as an explicit outcome a caller can inspect. Result keeps success and expected failure visible to callers.

## Predict

Predict what a caller can do with typed error data that a sentinel number cannot support.

## Run

Reference-only: this capability has no lesson-specific compiler proof in the current Learn runtime. Read the cited specification and do not present this package as an interactive acceptance exercise.

```beskid
// Normative-pending corelib sketch: a caller receives an outcome, not -1.
Core.Results.Result<i32, QuestError> FindScore(i32 questId) {
  return Results.Failure<i32, QuestError>(QuestError::Missing(questId));
}
```

## Investigate

`Result<T, E>` represents success carrying T or an expected failure carrying E. It differs from a compiler diagnostic, which rejects source before execution.

## Modify

Replace a `-1` failure convention with named success and error outcomes.

## Make and retrieve

Make a caller question: what can recover, and which facts are needed? Retrieve the answer.

## Failure clinic

```beskid
// Bad design: -1 can be both a score and a missing-value sentinel.
i32 FindScore(i32 questId) {
  return -1;
}
```

Do not label every broken invariant as recoverable work; preserve the distinction.

## Recap and next link

Result makes ordinary failure inspectable. Next: give error cases names.
