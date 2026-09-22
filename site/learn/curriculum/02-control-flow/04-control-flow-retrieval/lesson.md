---
id: flow_retrieval
title: Control-flow retrieval
context: control-flow
objective: Consolidate functions, choices, and repetition through prediction.
prerequisites: ["flow_repetition"]
command: reference
difficulty: intermediate
category: control-flow
vocabulary: ["contract","diagnostic","invariant"]
source: openspec/specs/language-meta--type-system--types/spec.md
hints: ["Predict before checking.","Use the named source; do not infer syntax from another language."]
questions: [{"id":"flow_retrieval_q1","text":"What does a loop invariant connect?","options":["Carried state to the already visited work","A function name to its file path"],"correctIndex":0}]
---

## Hook and goal

A dungeon rehearsal works only if you can navigate without the map. Retrieve the control-flow rules before adding data structures.

## Predict

Predict a trace for a function that chooses then repeats; name the first three state changes.

## Run

```beskid
i32 choose(i32 score) {
  if score == 3 { return 0; }
  return 1;
}
```

Reference-only synthesis: use paper traces and the governing sources rather than unverified code.

## Investigate

Functions establish contracts, choices select a path, and loops repeat a transition under an invariant. A trace records values at each boundary and exposes missing paths or broken bounds.

## Modify

Create a quest-score algorithm with one helper, one condition, and one repetition plan.

## Make and retrieve

From memory, explain argument/parameter, true/false paths, and loop invariant to a teammate.

## Failure clinic

Broken code, used only to isolate a parser condition:

```beskid
i32 Main( {
  return 0;
}
```

Observed condition: parsing cannot form the parameter list after Main. Repair: write the empty parameter list as Main(), then rerun the lesson command before interpreting any follow-on messages.

When a trace fails, repair the earliest boundary where expected and observed state differ.

## Recap and next link

You can now control a computation. Next, model its data.
