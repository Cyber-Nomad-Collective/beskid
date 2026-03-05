---
title: "Collections.Queue"
---


## Purpose
FIFO collection for producer/consumer style workflows.

## Candidate surface
- `Queue<T>.Enqueue(T value) -> unit`
- `Queue<T>.TryDequeue() -> Result<T, QueueError>`
- `Queue<T>.Count() -> i64`

## Notes
- Capacity and growth strategy should be explicit.
- Blocking behavior belongs to runtime/threading APIs, not base queue APIs.
