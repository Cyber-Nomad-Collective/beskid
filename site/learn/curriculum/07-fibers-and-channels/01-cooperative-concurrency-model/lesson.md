---
id: fibers_model
slug: cooperative-concurrency-model
title: Many tasks, explicit handoffs
context: fibers-and-channels
objective: Explain cooperative fibers without making timing or run-order promises.
category: fibers-and-channels
difficulty: intermediate
prerequisites: ["context_composition","corelib_discovery"]
command: reference
source: openspec/specs/language-meta--evaluation--fibers-and-spawn/spec.md
vocabulary: ["boundary","contract","fibers","and"]
hints: ["Fiber correctness coordinates observable facts, never a presumed schedule."]
questions: [{"id":"fibers_model_q1","text":"Predict why “the child will finish first” is not a valid rule after one convenient run.","options":["It follows the stated contract.","It is a timing or implementation guess."],"correctIndex":0}]
---

## Hook and goal

Explain cooperative fibers without making timing or run-order promises. Fiber correctness coordinates observable facts, never a presumed schedule.

## Predict

Predict why “the child will finish first” is not a valid rule after one convenient run.

## Run

Reference-only: this capability has no lesson-specific compiler proof in the current Learn runtime. Read the cited specification and do not present this package as an interactive acceptance exercise.

```beskid
// Normative-pending: this creates a handle, not a promised execution order.
Fiber<i32> worker = spawn DoWork(42);
```

## Investigate

Normative-pending: this curriculum has no CLI proof of scheduling behavior. A fiber is cooperative work with explicit communication and observation boundaries.

## Modify

Replace a fixed print-order assumption with a message or completed outcome.

## Make and retrieve

Make the rule “coordinate facts, not timing guesses,” then retrieve one explicit fact.

## Failure clinic

```beskid
// Bad requirement: logs do not establish a portable scheduling contract.
// Expect WorkerLog before MainLog
```

If a design works only under one observed order, add a result, channel, or coordination condition.

## Recap and next link

Fibers need explicit handoffs. Next: spawn a child and inspect its handle.
