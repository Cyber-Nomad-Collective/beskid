---
id: data_enums
title: Enums for states
context: data-modeling
objective: Model a finite state space with named alternatives.
prerequisites: ["data_methods"]
command: reference
difficulty: intermediate
category: data-modeling
vocabulary: ["contract","diagnostic","invariant"]
source: openspec/specs/core-library--foundation-and-primitives--core-results/spec.md
hints: ["Predict before checking.","Use the named source; do not infer syntax from another language."]
questions: [{"id":"data_enums_q1","text":"Why use enum variants instead of two independent state flags?","options":["Variants make mutually exclusive states explicit","Flags automatically carry error details"],"correctIndex":0}]
---

## Hook and goal

A quest cannot be simultaneously not started and completed in one well-formed state. Name the alternatives.

## Predict

Compare two Boolean flags with three named states; predict which permits contradiction.

## Run

```beskid
// Canonical Result variants from the cited core specification.
Result<i32, string> outcome = Ok(7);
```

Reference-only while enum construction syntax receives an active compiler fixture. `Result<T,E>` is a normative enum with `Ok(T)` and `Error(E)`.

## Investigate

An enum selects one variant from a finite set. A variant may carry only data relevant to that state, making invalid combinations harder to express.

## Modify

Model delivery as named states and choose the smallest useful payload for each.

## Make and retrieve

Make a state table: variant, data, transition in/out. Retrieve why Boolean flags drift.

## Failure clinic

Broken code, used only to isolate a parser condition:

```beskid
i32 Main( {
  return 0;
}
```

Observed condition: parsing cannot form the parameter list after Main. Repair: write the empty parameter list as Main(), then rerun the lesson command before interpreting any follow-on messages.

Do not add a vague catch-all state to avoid modeling a real case; describe the information it carries.

## Recap and next link

Enums name possibilities. Next, handle every possibility deliberately.
