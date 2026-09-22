---
id: context_composition
slug: composing-behaviour
title: Choose the right behavior boundary
context: functions-with-context
objective: Choose a named function, lambda, or contract-backed collaborator based on reuse and ownership.
category: functions-with-context
difficulty: intermediate
prerequisites: ["context_capture"]
command: reference
source: openspec/specs/language-meta--evaluation--lambdas-and-closures/spec.md
vocabulary: ["boundary","contract","functions","with"]
hints: ["Named, local, and supplied behavior solve different design needs."]
questions: [{"id":"context_composition_q1","text":"Predict which form serves a second caller better: inline rule, named function, or contract-backed service.","options":["It follows the stated contract.","It is a timing or implementation guess."],"correctIndex":0}]
---

## Hook and goal

Choose a named function, lambda, or contract-backed collaborator based on reuse and ownership. Named, local, and supplied behavior solve different design needs.

## Predict

Predict which form serves a second caller better: inline rule, named function, or contract-backed service.

## Run

Reference-only: this capability has no lesson-specific compiler proof in the current Learn runtime. Read the cited specification and do not present this package as an interactive acceptance exercise.

```beskid
i32 ClampScore(i32 score) {
  if score < 0 { return 0; }
  return score;
}
```

## Investigate

A named function suits stable reuse, a lambda suits concise local behavior, and a contract-backed collaborator suits interchangeable implementations or managed lifetimes.

## Modify

Refactor a quest-title formatter through all three forms and compare what each reveals.

## Make and retrieve

Make a three-question selector and retrieve the matching form.

## Failure clinic

```beskid
// Bad boundary: a hidden global makes the rule's dependency untestable.
i32 Score() { return GlobalRules.Clamp(0); }
```

Do not turn every callback into a contract or every function into a lambda.

## Recap and next link

Behavior boundaries should be honest and small. Next: start cooperative work with explicit handles.
