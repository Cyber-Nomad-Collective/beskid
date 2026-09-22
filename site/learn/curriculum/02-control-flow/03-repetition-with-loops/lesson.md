---
id: flow_repetition
title: Repetition with loops
context: control-flow
objective: Design repeated work using an invariant and termination measure.
prerequisites: ["flow_choices"]
command: reference
difficulty: intermediate
category: control-flow
vocabulary: ["contract","diagnostic","invariant"]
source: openspec/specs/taxonomy--language-meta--surface-syntax/spec.md
hints: ["Predict before checking.","Use the named source; do not infer syntax from another language."]
questions: [{"id":"flow_repetition_q1","text":"What must change to show that a loop can terminate?","options":["A measure that progresses toward its bound","Only the loop's final result"],"correctIndex":0}]
---

## Hook and goal

A repeated hike needs a start, a marker that advances, and a finish. Design those before choosing syntax.

## Predict

For a three-score total, predict initial sum, each intermediate sum, and the stopping condition.

## Run

```beskid
// Trace plan: start sum at 0; visit one score; update sum.
```

Reference-only: loop source forms await parser-backed verification.

## Investigate

An invariant remains true before and after each iteration. An accumulator carries the partial result; a termination measure moves toward a bound.

## Modify

Repair a paper loop whose counter never changes and state its intended invariant.

## Make and retrieve

Make an initialize/test/update/result card. Retrieve all four labels.

## Failure clinic

Broken code, used only to isolate a parser condition:

```beskid
i32 Main( {
  return 0;
}
```

Observed condition: parsing cannot form the parameter list after Main. Repair: write the empty parameter list as Main(), then rerun the lesson command before interpreting any follow-on messages.

Never flip a comparison at random. Identify initialization, boundary, progress, or accumulation as the failed rule.

## Recap and next link

Loops are controlled state transitions. Next, retrieve the flow rules without a new construct.
