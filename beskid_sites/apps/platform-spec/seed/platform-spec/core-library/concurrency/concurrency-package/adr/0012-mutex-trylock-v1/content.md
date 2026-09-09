import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

TryLock supports non-blocking attempts; Lock parks with cancel path.

## Decision

| Rule | Detail |
| --- | --- |
| TryLock | **In v1** — returns `` `Option<MutexGuard>` `` |
| Lock | Parks until acquired or **Cancelled** |

## Consequences

No poison semantics in v1.

## Verification anchors

Mutex corelib tests.
