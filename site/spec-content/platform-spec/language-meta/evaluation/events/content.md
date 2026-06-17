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
<!-- spec:generate:adr-index -->
No ADRs published under **`adr/`** yet.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Events - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Events - Design model](./articles/design-model/)
- [Events - Examples](./articles/examples/)
- [Events - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Events - Flow and algorithm](./articles/flow-and-algorithm/)
- [Events - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
