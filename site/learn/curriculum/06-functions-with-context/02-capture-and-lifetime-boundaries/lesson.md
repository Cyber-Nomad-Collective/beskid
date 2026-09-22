---
id: context_capture
slug: capture-and-lifetime-boundaries
title: Know what the closure carries
context: functions-with-context
objective: Explain capture, definite assignment, and lifetime boundaries for closures.
category: functions-with-context
difficulty: intermediate
prerequisites: ["context_lambdas"]
command: reference
source: openspec/specs/language-meta--evaluation--lambdas-and-closures/spec.md
vocabulary: ["boundary","contract","functions","with"]
hints: ["Captured storage must remain valid for the closure’s life."]
questions: [{"id":"context_capture_q1","text":"Predict why a local that has not been assigned cannot provide dependable captured data.","options":["It follows the stated contract.","It is a timing or implementation guess."],"correctIndex":0}]
---

## Hook and goal

Explain capture, definite assignment, and lifetime boundaries for closures. Captured storage must remain valid for the closure’s life.

## Predict

Predict why a local that has not been assigned cannot provide dependable captured data.

## Run

Reference-only: this capability has no lesson-specific compiler proof in the current Learn runtime. Read the cited specification and do not present this package as an interactive acceptance exercise.

```beskid
i32 bonus = 5;
// bonus is captured; score is a parameter.
(i32 score) => score + bonus
```

## Investigate

Normative-pending: capture diagnostics and lifetime behavior need compiler evidence. Captured locals must be definitely assigned; mutable capture may be rejected.

## Modify

Separate a discount closure’s parameters from its immutable shop-policy capture.

## Make and retrieve

Make a capture audit: value, owner, mutability, required lifetime. Retrieve it.

## Failure clinic

```beskid
// Bad: bonus is not definitely assigned before the closure captures it.
i32 bonus;
(i32 score) => score + bonus
```

Do not fix a capture complaint by smuggling state into a global.

## Recap and next link

Closures carry valid luggage. Next: choose an appropriate behavior boundary.
