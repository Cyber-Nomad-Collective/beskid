---
id: fibers_spawn
slug: spawn-and-fiber-handles
title: Start work; keep the receipt
context: fibers-and-channels
objective: Explain that spawn returns Fiber<T>, not the child value T.
category: fibers-and-channels
difficulty: intermediate
prerequisites: ["fibers_model","corelib_api_docs"]
command: reference
source: openspec/specs/language-meta--evaluation--fibers-and-spawn/spec.md
vocabulary: ["boundary","contract","fibers","and"]
hints: ["spawn CallableReturning<T> produces a Fiber<T> handle."]
questions: [{"id":"fibers_spawn_q1","text":"Predict the handle type when a callable returns i32.","options":["It follows the stated contract.","It is a timing or implementation guess."],"correctIndex":0}]
---

## Hook and goal

Explain that spawn returns Fiber<T>, not the child value T. spawn CallableReturning<T> produces a Fiber<T> handle.

## Predict

Predict the handle type when a callable returns i32.

## Run

Reference-only: this capability has no lesson-specific compiler proof in the current Learn runtime. Read the cited specification and do not present this package as an interactive acceptance exercise.

```beskid
// Normative-pending API sketch: T comes from DoWork's result.
i32 DoWork(i32 input) { return input + 1; }
Fiber<i32> worker = spawn DoWork(41);
```

## Investigate

Normative-pending: target compatibility and spawn lowering require active runtime proof. The handle, not the entry callable, exposes lifecycle operations.

## Modify

Label a worker’s child return type separately from the parent’s immediate handle type.

## Make and retrieve

Make the spawn equation and retrieve it.

## Failure clinic

```beskid
// Bad: spawn returns a Fiber<i32> handle, not an immediate i32.
i32 worker = spawn DoWork(41);
```

Do not treat a Fiber<T> handle as its T value; choose a later observation.

## Recap and next link

Spawn returns a receipt for work. Next: collect its outcome with Join.
