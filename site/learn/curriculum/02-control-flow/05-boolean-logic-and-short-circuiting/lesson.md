---
id: flow_booleans
context: control-flow
title: Boolean logic and short-circuiting
objective: Trace compound conditions and identify when a right-hand test is skipped.
prerequisites: ["flow_retrieval"]
command: reference
difficulty: intermediate
category: control-flow
vocabulary: ["Boolean","conjunction","short-circuit","guard"]
source: openspec/specs/language-meta--evaluation--control-flow/spec.md
hints: ["Predict a concrete state transition.","Keep unsupported syntax reference-only."]
questions: [{"id":"flow_booleans_q1","text":"When the left side of AND is false, what happens to the right side?","options":["It is skipped because the result is already false","It must run to find a new result"],"correctIndex":0}]
---

## Hook and goal

This lesson turns one hidden control decision into an explicit, reviewable rule.

## Predict

State what happens before running the example, including the value or control path that changes.

## Run

Reference-only: the active Learn compiler fixture is unavailable, so this source illustrates the cited contract rather than claiming interactive acceptance.

```beskid
if hasKey && doorIsLocked {
  return 0;
}
```

The left condition is evaluated first. The right condition can matter only if the left condition leaves an AND result possible. The body runs only for a true complete condition.

## Investigate

Read the cited normative source first. Identify the declaration or condition, the state it governs, and the boundary it protects.

## Modify

Make one semantic change to the scenario and explain which invariant or control path changes; do not merely rename an identifier.

## Make and retrieve

Write a one-sentence rule and apply it to a fresh quest-log scenario without looking back at this lesson.

## Failure clinic

Broken code:

```beskid
if chestIsUnlocked && chestExists {
  return 0;
}
```

Observed condition: The intended existence guard is evaluated too late.
Repair: Place chestExists first, then verify the exact operator grammar in the cited specification.

## Recap and next link

The rule is useful only when its trigger, affected state, and repair boundary are explicit.
