---
id: flow_loop_exits
context: control-flow
title: Break and continue make loop exits visible
objective: Predict whether a loop stops or skips the remaining work of one iteration.
prerequisites: ["flow_booleans"]
command: reference
difficulty: intermediate
category: control-flow
vocabulary: ["break","continue","iteration","loop body"]
source: openspec/specs/language-meta--evaluation--control-flow/spec.md
hints: ["Predict a concrete state transition.","Keep unsupported syntax reference-only."]
questions: [{"id":"flow_loop_exits_q1","text":"What remains after continue executes?","options":["The rest of this iteration is skipped","The whole loop ends"],"correctIndex":0}]
---

## Hook and goal

This lesson turns one hidden control decision into an explicit, reviewable rule.

## Predict

State what happens before running the example, including the value or control path that changes.

## Run

Reference-only: the active Learn compiler fixture is unavailable, so this source illustrates the cited contract rather than claiming interactive acceptance.

```beskid
if entryIsDamaged {
  continue;
}
if entryIsTreasure {
  break;
}
```

The first branch skips only the remaining current body. The second abandons the enclosing loop. Neither replaces a loop's ordinary termination condition.

## Investigate

Read the cited normative source first. Identify the declaration or condition, the state it governs, and the boundary it protects.

## Modify

Make one semantic change to the scenario and explain which invariant or control path changes; do not merely rename an identifier.

## Make and retrieve

Write a one-sentence rule and apply it to a fresh quest-log scenario without looking back at this lesson.

## Failure clinic

Broken code:

```beskid
if entryIsTreasure {
  continue;
}
return foundTreasure;
```

Observed condition: Continue skips the return on the treasure iteration.
Repair: Record the treasure and break when finding it should end the search.

## Recap and next link

The rule is useful only when its trigger, affected state, and repair boundary are explicit.
