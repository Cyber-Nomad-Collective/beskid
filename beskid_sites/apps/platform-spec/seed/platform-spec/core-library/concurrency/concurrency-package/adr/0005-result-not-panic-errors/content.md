import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Panics as control flow for expected failure modes break contracts and LSP stability.

## Decision

| Surface | Rule |
| --- | --- |
| Channel | **Send** / **Receive** → `Result`; **TrySend** / **TryReceive** → `Option` |
| Fiber | **Join** → `` `Result<T, FiberError>` ``; stack overflow → ``FiberError::StackOverflow`` at **Join** |
| Mutex | **Lock** → `` `Result<MutexGuard, MutexError>` ``; **TryLock** → ``Option`` (``None`` = would block) |

## Consequences

v1: **Lock** may return `Cancelled` when fiber cancelled—no .NET-style poison.

## Verification anchors

Corelib API signatures; runtime integration tests.
