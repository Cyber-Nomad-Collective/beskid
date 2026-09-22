---
id: data_events
context: data-modeling
title: Events and subscribers
objective: Describe an event trigger, owner, and subscriber responsibility without assuming delivery order.
prerequisites: ["data_collections"]
command: reference
difficulty: intermediate
category: data-modeling
vocabulary: ["event","subscriber","trigger","OnCancelled"]
source: openspec/specs/core-library--concurrency--concurrency-package/spec.md
hints: ["Predict a concrete state transition.","Keep unsupported syntax reference-only."]
questions: [{"id":"data_events_q1","text":"Who owns the OnCancelled event in the fiber model?","options":["The Fiber handle","An arbitrary spawn closure"],"correctIndex":0}]
---

## Hook and goal

This lesson turns one hidden control decision into an explicit, reviewable rule.

## Predict

State what happens before running the example, including the value or control path that changes.

## Run

Reference-only: the active Learn compiler fixture is unavailable, so this source illustrates the cited contract rather than claiming interactive acceptance.

```beskid
event OnCancelled();
// Fiber<T> owns the cancellation notification.
```

The event declaration belongs to the Fiber handle. The cited concurrency contract raises it on the child before parked operations unblock; it does not promise arbitrary subscriber timing.

## Investigate

Read the cited normative source first. Identify the declaration or condition, the state it governs, and the boundary it protects.

## Modify

Make one semantic change to the scenario and explain which invariant or control path changes; do not merely rename an identifier.

## Make and retrieve

Write a one-sentence rule and apply it to a fresh quest-log scenario without looking back at this lesson.

## Failure clinic

Broken code:

```beskid
event OnCancelled();
return 0;
```

Observed condition: An event declaration alone does not perform cancellation or deliver a result.
Repair: Specify the triggering state transition and handle cancellation through the documented Fiber API.

## Recap and next link

The rule is useful only when its trigger, affected state, and repair boundary are explicit.
