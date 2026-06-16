---
title: Memory and references - FAQ and troubleshooting
description: Common issues, troubleshooting, and locked decisions for Beskid
  memory and references.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Proposed
lastReviewed: 2026-06-05
---

## Locked decisions

| Decision | ID | Summary |
| --- | --- | --- |
| Channel-only fiber sharing | D-LM-MEM-001 | No ad hoc shared mutable globals |
| Fat-pointer arrays | D-LM-MEM-002 | Single ABI representation per target |
| GC by default | D-LM-MEM-003 | Heap objects collector-managed |
| No `null` addresses | D-LM-MEM-004 | `Option<T>` models absence |

## FAQ

### Can I use pointers?

No. User code must not expose manual `free` or untracked pointers in v0.1.

### How do I declare a mutable local?

Use prefix `mut` before the type (`mut i64 acc = 0`) or `let mut name = expr` when the type is inferred.

### How do I share data between fibers?

Use `Channel<T>` for safe cross-fiber communication. Direct alias sharing is forbidden.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| **E1214** | Assigning to an immutable binding |
| **E1225** | Stack reference captured in a `spawn` closure |
| Bounds check failure | Array index out of range |
| GC pause | Normal behavior for concurrent mark-sweep |
