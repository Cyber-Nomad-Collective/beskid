---
title: Events
description: Multicast events, subscription lifetime, and thread affinity
  assumptions. UI stacks build on these primitives.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-21
---

## Normative specification

### Scope

Defines **`event` fields** on types and their **raise/subscribe** surface. Fiber cancellation events are specified in [Fibers and spawn](/platform-spec/language-meta/evaluation/fibers-and-spawn/) and the concurrency package.

### Declaration

- **`event Name(params);`** on a `type` declares a multicast callback slot.
- Optional **`event {N} Name`** sets a capacity hint (`EventCapacity`); runtime **may** use this for bounded subscriber lists.
- Event fields are **not** ordinary value fields; they **must not** be read like variables.

### Static rules

- Raising or subscribing **must** target an in-scope event member on a value or `this`-equivalent receiver.
- Event signatures **must** use parameter lists compatible with delegate lowering (value parameters only in v0.1).

### Dynamic semantics

- **Multicast:** Multiple subscribers **may** be registered; raise **must** invoke subscribers in registration order unless a host profile defines fairness.
- **Synchrony:** Unless a host documents otherwise, event handlers run on the **raising fiber** and **must not** block on `Join` of self.
- **Lifetime:** Subscriptions **should** be detached when the owning object is disposed; leaks are host-defined (corelib hosts document behavior).

### Diagnostics

Event misuse **must** surface as member/type errors (**E1213** family) until a dedicated event band is allocated.

### Conformance

Types with `event` fields **must** lower to the same calling convention in AOT and JIT for a given target.

## Decisions

- **D-LM-EVT-001 — Language `event` keyword:** Events are fields, not separate delegate types in user syntax.
- **D-LM-EVT-002 — Fiber OnCancelled:** Cancellation uses the same `event` mechanism on `Fiber<T>` per concurrency decisions record.
- **D-LM-EVT-003 — Synchronous default:** Handlers run on the raising fiber unless a host profile says otherwise.
- **D-LM-EVT-004 — Not `Option`:** Subscription state is host-managed; absence of subscribers is not `Option<T>` at the language surface.

## Implementation anchors
- `compiler/crates/beskid_analysis/src/types/` — `event` field declaration and subscription type-checking
- `compiler/crates/beskid_codegen/src/` — event handler call generation and calling convention

## Platform view

Multicast events, subscription lifetime, and thread affinity assumptions. UI stacks build on these primitives.
