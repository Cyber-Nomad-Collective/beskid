---
id: flow_choices
title: Choices with if
context: control-flow
objective: Trace both Boolean paths and account for every return.
prerequisites: ["flow_functions"]
command: analyze
difficulty: intermediate
category: control-flow
vocabulary: ["contract","diagnostic","invariant"]
source: openspec/specs/language-meta--type-system--types/spec.md
hints: ["Predict before checking.","Use the named source; do not infer syntax from another language."]
questions: [{"id":"flow_choices_q1","text":"Which input reaches the true branch of n % 2 == 0?","options":["An even integer such as 4","An odd integer such as 3"],"correctIndex":0}]
---

## Hook and goal

At a trail fork, a condition chooses one route. Understand both routes before walking either.

## Predict

Predict the return for one true input and one false input.

## Run

```beskid
i32 IsEven(i32 n) {
  if n % 2 == 0 { return 1; }
  return 0;
}
```

Reference-only while the current `if` grammar and diagnostics are captured for this package.

## Investigate

A Boolean condition selects a branch. A typed function still promises one compatible result for every reachable route; one happy-path test does not explain the false path.

## Modify

Make a two-row branch table: condition outcome and resulting action.

## Make and retrieve

Explain from memory why testing both rows matters.

## Failure clinic

Broken code, used only to isolate a parser condition:

```beskid
i32 Main( {
  return 0;
}
```

Observed condition: parsing cannot form the parameter list after Main. Repair: write the empty parameter list as Main(), then rerun the lesson command before interpreting any follow-on messages.

Do not add a branch just to silence a missing-return error; decide the intended behavior for the unaccounted route.

## Recap and next link

Choices make paths visible. Next, repeat a path only with an invariant.
