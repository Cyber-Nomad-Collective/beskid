---
id: reliability_errors
slug: errors-as-data
title: Name the ways a plan can fail
context: reliability-and-abstraction
objective: Use error variants and payloads to make recovery decisions explicit.
category: reliability-and-abstraction
difficulty: intermediate
prerequisites: ["reliability_result"]
command: reference
source: openspec/specs/language-meta--type-system--enums-and-match/spec.md
vocabulary: ["boundary","contract","reliability","and"]
hints: ["Variants represent distinct outcomes; payloads preserve useful facts."]
questions: [{"id":"reliability_errors_q1","text":"Predict whether one vague message or distinct closed/cancelled cases offers better recovery.","options":["It follows the stated contract.","It is a timing or implementation guess."],"correctIndex":0}]
---

## Hook and goal

Use error variants and payloads to make recovery decisions explicit. Variants represent distinct outcomes; payloads preserve useful facts.

## Predict

Predict whether one vague message or distinct closed/cancelled cases offers better recovery.

## Run

Reference-only: this capability has no lesson-specific compiler proof in the current Learn runtime. Read the cited specification and do not present this package as an interactive acceptance exercise.

```beskid
enum QuestError {
  Missing(i32 questId),
  Cancelled(i64 reason),
}
```

## Investigate

Enums model a finite set of error shapes. Match handling makes each caller confront those shapes and their payloads.

## Modify

Turn DeliveryFailed into closed, cancelled, and invalid-address cases with one useful payload.

## Make and retrieve

Make a recovery table: variant, fact, next action. Retrieve why strings are weak protocols.

## Failure clinic

```beskid
// Bad design: callers cannot choose a repair from one undifferentiated case.
enum QuestError { Failed }
```

Do not discard every variant with a generic ignore branch.

## Recap and next link

Errors are domain data. Next: reuse behavior with generic contracts.
