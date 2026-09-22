---
id: fibers_control
slug: yield-cancel-and-detach
title: Manage a child’s lifecycle deliberately
context: fibers-and-channels
objective: Distinguish Yield, Cancel, and Detach and their responsibility boundaries.
category: fibers-and-channels
difficulty: intermediate
prerequisites: ["fibers_join","corelib_api_docs"]
command: reference
source: compiler/corelib/packages/concurrency/src/Concurrency.bd
vocabulary: ["boundary","contract","fibers","and"]
hints: ["Yield, Cancel, and Detach are distinct lifecycle choices."]
questions: [{"id":"fibers_control_q1","text":"Predict why cancellation does not already give the caller a final child result.","options":["It follows the stated contract.","It is a timing or implementation guess."],"correctIndex":0}]
---

## Hook and goal

Distinguish Yield, Cancel, and Detach and their responsibility boundaries. Yield, Cancel, and Detach are distinct lifecycle choices.

## Predict

Predict why cancellation does not already give the caller a final child result.

## Run

Reference-only: this capability has no lesson-specific compiler proof in the current Learn runtime. Read the cited specification and do not present this package as an interactive acceptance exercise.

```beskid
// Normative-pending lifecycle sketch; no next-runner claim is implied.
worker.Cancel(7);
// worker.Detach(); explicitly waives shutdown Join responsibility.
```

## Investigate

Normative-pending: no order or latency claim is made. Cancel is observed through the handle; Detach waives shutdown-join responsibility.

## Modify

For a map refresh, choose join or detach and name who owns failure observation.

## Make and retrieve

Make three lifecycle flashcards and retrieve the one that changes shutdown responsibility.

## Failure clinic

```beskid
// Bad ownership decision: detaching only to hide an unobserved child failure.
worker.Detach();
```

Do not detach merely to silence an inconvenient child error.

## Recap and next link

Lifecycle control is ownership. Next: move values through a channel.
