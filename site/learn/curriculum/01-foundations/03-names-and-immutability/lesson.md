---
id: foundations_bindings
title: Names and immutability
context: foundations
objective: Trace a typed binding from declaration to use.
prerequisites: ["foundations_values"]
command: analyze
difficulty: beginner
category: foundations
vocabulary: ["contract","diagnostic","invariant"]
source: openspec/specs/language-meta--type-system--types/spec.md
hints: ["Predict before checking.","Use the named source; do not infer syntax from another language."]
questions: [{"id":"foundations_bindings_q1","text":"What must exist before score can be used in a condition?","options":["A declaration of score in scope","A second return statement"],"correctIndex":0}]
---

## Hook and goal

Names are labels on boxes, not the values inside. Track where a value enters view and where it may be used.

## Predict

Predict whether `return score` returns the spelling `score` or the value bound to that name.

## Run

```beskid
i32 Main() {
  let score = 4;
  return score;
}
```

Reference-only until a compiler fixture confirms the exact binding and mutability forms.

## Investigate

A declaration introduces an identifier and a type. Scope bounds where the identifier resolves. Immutability makes each use easier to reason from its declaration.

## Modify

Draw declaration → use → return for a quest score; mark the scope boundary.

## Make and retrieve

Make a name trail. From memory, name the three checks for an unknown identifier: spelling, scope, declaration.

## Failure clinic

Broken code, used only to isolate a parser condition:

```beskid
i32 Main( {
  return 0;
}
```

Observed condition: parsing cannot form the parameter list after Main. Repair: write the empty parameter list as Main(), then rerun the lesson command before interpreting any follow-on messages.

Do not change annotations for an unknown name. Resolution needs a declaration in scope.

## Recap and next link

Bindings make data readable. Next, compute with expressions.
