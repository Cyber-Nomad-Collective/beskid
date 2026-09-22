---
id: corelib_collections
slug: practical-collections
title: Choose a shape for your data
context: core-library
objective: Choose arrays and optional presence without hidden sentinel conventions.
category: core-library
difficulty: intermediate
prerequisites: ["corelib_api_docs"]
command: reference
source: openspec/specs/language-meta--type-system--types/spec.md
vocabulary: ["boundary","contract","core","library"]
hints: ["Arrays, empty values, and Option-style absence are different states."]
questions: [{"id":"corelib_collections_q1","text":"Predict what information is lost when -1 means missing and is also a possible value.","options":["It follows the stated contract.","It is a timing or implementation guess."],"correctIndex":0}]
---

## Hook and goal

Choose arrays and optional presence without hidden sentinel conventions. Arrays, empty values, and Option-style absence are different states.

## Predict

Predict what information is lost when -1 means missing and is also a possible value.

## Run

Reference-only: this capability has no lesson-specific compiler proof in the current Learn runtime. Read the cited specification and do not present this package as an interactive acceptance exercise.

```beskid
// An array and an optional score describe different shapes.
i32[] scores = [3, 5, 8];
Option<i32> maybeScore = Option::None;
```

## Investigate

Normative-pending: establish package and compiler support before an interactive collection exercise. The type model has T[] and no null literal.

## Modify

Redesign FindQuest so success data and absence are represented separately.

## Make and retrieve

Make a three-row table for empty collection, empty string, and absence. Retrieve it.

## Failure clinic

```beskid
// Bad sentinel: -1 may be a valid score.
i32 FindScore(i32 questId) { return -1; }
```

Do not use empty text as a universal missing marker.

## Recap and next link

Data shapes keep absence visible. Next: make conversion and formatting boundaries explicit.
