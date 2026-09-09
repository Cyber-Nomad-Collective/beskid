import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Fibers need cooperative cancellation without panics on join or parked channel ops.

## Decision

| Rule | Detail |
| --- | --- |
| Signal | `Fiber.Cancel()` sets runtime cancellation flag |
| Event | Each `` `Fiber<T>` `` declares ``event OnCancelled()``; runtime raises on **child** before unblocking parked ops |
| Join | ``Join`` → `` `Result<T, FiberError::Cancelled>` `` after cancellation observed |
| Channels | Parked **Send** / **Receive** → `ChannelError::Cancelled` |
| Ordering | **OnCancelled** runs **before** **Join** / channel errors; handlers **must not** block on **Join** of self |

## Consequences

Unhandled panic in **OnCancelled** aborts process in v1 (same as other unhandled event paths).

## Verification anchors

Corelib + runtime concurrency tests; cancel/join fixtures.
