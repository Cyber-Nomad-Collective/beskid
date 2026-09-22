---
id: reliability_option
slug: option-and-absence
title: Option: say when a value is absent
context: reliability-and-abstraction
objective: Model a value that may be absent without using null or a sentinel value.
category: reliability-and-abstraction
difficulty: intermediate
prerequisites: ["corelib_discovery","data_enums"]
command: reference
source: openspec/specs/language-meta--type-system--types/spec.md
vocabulary: ["Option","Some","None","absence","sentinel"]
hints: ["Absence belongs in the result type.","A valid zero is not automatically a missing value."]
questions: [{"id":"reliability_option_q1","text":"Why is Option<i32> clearer than returning -1 for a missing score?","options":["It separates absence from every valid i32 value","It makes every missing score equal to zero"],"correctIndex":0}]
---

## Hook and goal

A quest with score `0` is not the same as a quest that has never been scored. Your goal is to make that distinction visible in the return type instead of hiding it in a magic number.

## Predict

If `FindScore` returns `Option<i32>`, predict what its caller must handle before it can add the score to a total.

## Run

This is **reference-only** until the selected corelib package/import fixture is proven in Learn. The language rule is concrete: Beskid has no null literal or nullable type syntax; optional presence uses `Option<T>` or an explicit enum.

```beskid
// Normative-pending corelib sketch: the result carries either a score or absence.
Option<i32> FindScore(i32 questId) {
    return Option::None;
}
```

## Investigate

`Option<T>` models two states: present with a `T`, or absent. That forces the caller to choose behavior for each state, usually by matching the result. It is appropriate when “not found” is an expected outcome, not an exceptional operational failure that needs an error reason.

## Modify

Redesign a paper `FindScore` that returns `-1` when no record exists. List one valid negative score policy, one absence policy, and the exact caller action for each Option shape.

## Make and retrieve

Make a three-row comparison: empty string, empty array, and `Option::None`. Retrieve why these states cannot be collapsed into one generic “empty” value.

## Failure clinic

```beskid
// Bad design: -1 may be a valid score, so this loses information.
i32 FindScore(i32 questId) {
    return -1;
}
```

The causal problem is not syntax: the signature claims every call produces an `i32`, while the implementation is encoding a second state in a value. Repair by returning `Option<i32>` for ordinary absence, or `Result<i32, QuestError>` when callers need a reason for failure.

## Recap and next link

`Option<T>` makes absence part of the API contract. Next, use `Result<T, E>` when a caller needs the reason an otherwise expected operation did not succeed.
