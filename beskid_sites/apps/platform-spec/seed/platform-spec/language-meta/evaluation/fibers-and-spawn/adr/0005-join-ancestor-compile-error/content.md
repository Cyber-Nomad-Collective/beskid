import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Waiting on an ancestor handle while the ancestor may wait on descendants creates predictable deadlocks.

## Decision

**Join** on a parent or ancestor `Fiber<T>` handle **must** be a compile error (**`JoinWouldDeadlock`**). Normative ordering for cancel + Join aligns with [D-CORE-CONC-0014](/platform-spec/core-library/concurrency/concurrency-package/adr/0014-join-ancestor-forbidden/).

## Consequences

Structured concurrency stays acyclic on the join graph; runtime need not recover ancestor joins.

## Verification anchors

`compiler/crates/beskid_analysis/`; [D-CORE-CONC-0014](/platform-spec/core-library/concurrency/concurrency-package/adr/0014-join-ancestor-forbidden/).
