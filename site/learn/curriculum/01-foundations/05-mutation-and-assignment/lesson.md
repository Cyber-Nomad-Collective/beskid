---
id: foundations_mutation
context: foundations
title: Mutation and assignment
objective: Reassign a local only when its binding explicitly permits mutation.
prerequisites: ["foundations_expressions"]
command: reference
difficulty: intermediate
category: foundations
vocabulary: ["mut","assignment","immutable binding","E1214"]
source: openspec/specs/language-meta--memory-model--memory-and-references/spec.md
hints: ["Predict a concrete state transition.","Keep unsupported syntax reference-only."]
questions: [{"id":"foundations_mutation_q1","text":"Which declaration permits later reassignment of total?","options":["let mut total = 0","let total = 0"],"correctIndex":0}]
---

## Hook and goal

This lesson turns one hidden control decision into an explicit, reviewable rule.

## Predict

State what happens before running the example, including the value or control path that changes.

## Run

Reference-only: the active Learn compiler fixture is unavailable, so this source illustrates the cited contract rather than claiming interactive acceptance.

```beskid
let mut total = 0;
total = total + 5;
```

The first line declares a mutable inferred binding. The second computes a replacement value and assigns it to that binding.

## Investigate

Read the cited normative source first. Identify the declaration or condition, the state it governs, and the boundary it protects.

## Modify

Make one semantic change to the scenario and explain which invariant or control path changes; do not merely rename an identifier.

## Make and retrieve

Write a one-sentence rule and apply it to a fresh quest-log scenario without looking back at this lesson.

## Failure clinic

Broken code:

```beskid
let total = 0;
total = total + 1;
```

Observed condition: E1214: assignment targets an immutable binding.
Repair: Declare let mut total only when replacement is intentional; otherwise bind a new value.

## Recap and next link

The rule is useful only when its trigger, affected state, and repair boundary are explicit.
