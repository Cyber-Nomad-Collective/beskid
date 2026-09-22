---
id: context_lambdas
slug: lambdas
title: Pack a small behavior
context: functions-with-context
objective: Recognize a lambda as a callable value whose type must be inferable or annotated.
category: functions-with-context
difficulty: intermediate
prerequisites: ["reliability_contracts"]
command: reference
source: openspec/specs/language-meta--evaluation--lambdas-and-closures/spec.md
vocabulary: ["boundary","contract","functions","with"]
hints: ["A lambda is callable data, not untyped code."]
questions: [{"id":"context_lambdas_q1","text":"Predict why `value => value` is ambiguous without an expected callable type.","options":["It follows the stated contract.","It is a timing or implementation guess."],"correctIndex":0}]
---

## Hook and goal

Recognize a lambda as a callable value whose type must be inferable or annotated. A lambda is callable data, not untyped code.

## Predict

Predict why `value => value` is ambiguous without an expected callable type.

## Run

Reference-only: this capability has no lesson-specific compiler proof in the current Learn runtime. Read the cited specification and do not present this package as an interactive acceptance exercise.

```beskid
// Normative-pending lambda syntax: parameter annotation supplies its type.
i32 doubled = ((i32 value) => value + value)(21);
```

## Investigate

Normative-pending: lambda syntax and inference require a verified compiler fixture before an interactive claim. The specification permits expression or block bodies.

## Modify

List input type, output type, and outside values for a proposed filter rule.

## Make and retrieve

Make a lambda review card and retrieve the four entries.

## Failure clinic

```beskid
// E1202 when no expected callable type can infer value's parameter type.
value => value
```

When inference fails, add type information at the boundary that owns the decision.

## Recap and next link

Lambdas package typed local behavior. Next: inspect what they capture.
