---
id: flow_functions
title: Functions and contracts
context: control-flow
objective: Read a function as an explicit input-output promise.
prerequisites: ["foundations_expressions"]
command: analyze
difficulty: intermediate
category: control-flow
vocabulary: ["contract","diagnostic","invariant"]
source: openspec/specs/language-meta--type-system--types/spec.md
hints: ["Predict before checking.","Use the named source; do not infer syntax from another language."]
questions: [{"id":"flow_functions_q1","text":"Which names belong to the Add function body rather than the caller?","options":["Parameters a and b","Arguments 1 and 2"],"correctIndex":0}]
---

## Hook and goal

A function is a trailhead sign: it says what supplies you bring and what outcome comes back.

## Predict

Predict how arguments at a call correspond to parameters in a two-input function.

## Run

```beskid
i32 Add(i32 a, i32 b) {
  return a + b;
}
```

Reference-only until this package has a current verified function fixture.

## Investigate

Parameters are inputs owned by a function body; arguments are values supplied by a caller. The signature publishes input and output shapes, and each reachable return must honor the output promise.

## Modify

Write a one-responsibility contract for `ScoreBonus`: inputs, output, and one invariant.

## Make and retrieve

Make a function card. From memory, distinguish a parameter from an argument.

## Failure clinic

Broken code, used only to isolate a parser condition:

```beskid
i32 Main( {
  return 0;
}
```

Observed condition: parsing cannot form the parameter list after Main. Repair: write the empty parameter list as Main(), then rerun the lesson command before interpreting any follow-on messages.

For an arity error, count positions. For a type error, align each argument with its corresponding parameter.

## Recap and next link

Functions package a computation. Next, select behavior with a Boolean choice.
