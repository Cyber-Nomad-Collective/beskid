---
id: data_collections
title: Arrays and collections
context: data-modeling
objective: Reason about ordered elements, indexes, and bounds.
prerequisites: ["data_match"]
command: reference
difficulty: intermediate
category: data-modeling
vocabulary: ["contract","diagnostic","invariant"]
source: openspec/specs/core-library--foundation-and-primitives--core-args/spec.md
hints: ["Predict before checking.","Use the named source; do not infer syntax from another language."]
questions: [{"id":"data_collections_q1","text":"What does an index identify in a collection?","options":["A position within its bounds","The value stored at every position"],"correctIndex":0}]
---

## Hook and goal

An array is a numbered shelf: ordered slots, finite length, and an edge you must not pretend is another slot.

## Predict

For a three-item shelf, list valid positions and the first invalid position.

## Run

```beskid
// The cited API models a missing indexed value explicitly.
Option<i32> score = quests.Get(3);
```

Reference-only until collection literals, indexing, and iteration forms are compiler-verified. The core indexed API documents `Get(i64 index) -> Option<T>` for ordinary absence.

## Investigate

A collection has an element type, order, and bounds. An index selects a position, not an element; safe access needs a documented absent-case policy.

## Modify

Trace a five-slot quest log and label length, valid positions, and one absent lookup.

## Make and retrieve

Make a bounds sentence: valid when ___; otherwise ___. Retrieve why zero is not a universal missing sentinel.

## Failure clinic

Broken code, used only to isolate a parser condition:

```beskid
i32 Main( {
  return 0;
}
```

Observed condition: parsing cannot form the parameter list after Main. Repair: write the empty parameter list as Main(), then rerun the lesson command before interpreting any follow-on messages.

Do not “fix” an out-of-range request by inventing a value. Preserve the difference between absent and present-zero.

## Recap and next link

Collections close this data-modeling context. Next, organize those models across modules and packages.
