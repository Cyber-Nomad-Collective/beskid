---
id: fibers_join
slug: join-and-fiber-results
title: Collect a child outcome honestly
context: fibers-and-channels
objective: Explain Join as a fallible observation of a Fiber<T> outcome.
category: fibers-and-channels
difficulty: intermediate
prerequisites: ["fibers_spawn","corelib_api_docs"]
command: reference
source: compiler/corelib/packages/concurrency/src/Concurrency/Fiber.bd
vocabulary: ["boundary","contract","fibers","and"]
hints: ["Join returns the entry value or FiberError through Result."]
questions: [{"id":"fibers_join_q1","text":"Predict why a join needs an error case even when a child normally returns an integer.","options":["It follows the stated contract.","It is a timing or implementation guess."],"correctIndex":0}]
---

## Hook and goal

Explain Join as a fallible observation of a Fiber<T> outcome. Join returns the entry value or FiberError through Result.

## Predict

Predict why a join needs an error case even when a child normally returns an integer.

## Run

Reference-only: this capability has no lesson-specific compiler proof in the current Learn runtime. Read the cited specification and do not present this package as an interactive acceptance exercise.

```beskid
// Normative-pending Join shape: outcome may contain T or FiberError.
Fiber<i32> worker = spawn DoWork(41);
Core.Results.Result<i32, FiberError> outcome = worker.Join();
```

## Investigate

Normative-pending: no verified Learn execution proof exists for Join. The corelib contract specifies normal, cancelled, panicked, and stack-overflow outcomes.

## Modify

Make a response plan for success, cancellation, and failure.

## Make and retrieve

Make an outcome table and retrieve why joining an ancestor is forbidden.

## Failure clinic

```beskid
// Bad: joining an ancestor is rejected because it would create a wait cycle.
parent.Join();
```

Do not discard join errors because a local demo happened to end normally.

## Recap and next link

Join observes outcomes, not a timetable. Next: manage lifecycle intentionally.
