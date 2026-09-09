import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

v1 write helpers are infallible at the type level; read paths need explicit error handling.

## Decision

| Rule | Detail |
| --- | --- |
| Write | `Write` / `WriteLine` **must** panic on `WriteWith` failure |
| Read | `Read` / `ReadLine` return `` `Result<string, SyscallError>` `` |

## Consequences

Diagnostics for write failures use fixed panic strings; callers cannot catch write errors in Beskid v1.

## Verification anchors

Corelib stream tests; syscall integration in `beskid_runtime`.
