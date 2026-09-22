# Core.IO lifecycle acceptance design

## Intent

Close the remaining v0.5 foundation acceptance gap for typed stream cleanup
without creating a second IO implementation. The normative source is
`BSP-REQ-F25A4DF4DEA0`: a `Closer` is idempotent, and `Core.IO` provides the
explicit `DisposeError -> IoError::CloseFailed()` cleanup conversion.

The user constraint is decisive: **do not repeat IO in `Core.IO`**. `Core.IO`
therefore remains the sole transfer-policy module, not a resource lifecycle
implementation.

## Current facts

| Area | Existing canonical path | Gap |
| --- | --- | --- |
| Partial transfer policy | The `Core.IO` module (`corelib/packages/foundation/src/Core/IO/IO.bd`) owns range validation, count validation, exact/all loops, EOF, and no-progress behavior. | None; implementation must not reproduce any of it. |
| Lexical cleanup | `beskid_queries/.../cleanup.rs` resolves exactly one `Disposable.Dispose`; `beskid_isle/.../cleanup.rs` emits the existing scope-stack cleanup path. | No `Core.IO` resource proves that path. |
| Cleanup conversion | `Core.IO.FromDisposeError` is the unique `CleanupConversion` for `IoError`. | No concrete IO resource reaches it. |
| Resource lifecycle | `Closer` and `Stream` publish only contracts. | No owning resource implements the one idempotent close state transition and delegates disposal to it. |
| Backend proof | `foundation_io_native.rs` already runs JIT, static AOT, and the shared native runtime kit. | Fixture lacks lifecycle and remaining boundary coverage. |

## Design

### Seams and ownership

`Reader`, `Writer`, `Closer`, and `Stream` remain interfaces. The only
lifecycle state machine belongs to a concrete owning resource. For this
release that resource is fixture-only `TestStream`; a future networking
resource such as `TcpStream` owns its own state machine at the same seam.

`TestStream` conforms to `Stream`, `Closer`, and `Disposable` with one
`Close` method. Its lifecycle state is `released`, `release_calls`, and
`fail_close`. The first `Close()` marks `released` and increments
`release_calls` before returning its configured `IoError` outcome. Every later
call returns the established idempotent result and cannot increment
`release_calls`, including after a first close failure. No helper in
`Core.IO` tracks lifecycle state because a contract has neither ownership nor
a default implementation mechanism.

`TestStream.Dispose()` is a thin adapter only: it invokes that exact `Close()`
transition on each disposal request and translates only its result to
`DisposeError::Failed()`. It does not repeat the physical release action or
maintain another flag. The existing
lexical cleanup lowering calls only `Dispose`; the existing
`Core.IO.FromDisposeError` conversion maps a scoped cleanup failure back to
`IoError::CloseFailed()` for callable results. This produces one lifecycle
implementation and one compiler cleanup path.

### Transfer policy remains singular

Concrete streams implement only partial `Read` and `Write`. They must not
perform `ReadExact`, `WriteAll`, range validation, retry, EOF, or no-progress
policy. Callers use `Core.IO.Read`, `Write`, `ReadExact`, and `WriteAll`, which
remain the one policy implementation. This preserves the deep `Core.IO`
module: callers learn the public transfer interface while all policy stays in
one place.

### Errors and precedence

The fixture demonstrates the normative close conversion without a general
coercion:

1. Explicit `Close()` exposes `IoError::CloseFailed()` directly.
2. Scoped cleanup invokes `Dispose()` through the existing lexical cleanup
   seam.
3. The existing `FromDisposeError` conversion maps that failure to
   `IoError::CloseFailed()`.
4. Existing cleanup precedence remains authoritative: cleanup drains all
   resources in reverse order and reports its established first failure rule.

No new cleanup lowering, conversion resolver, or IO-specific scope protocol is
introduced.

## Acceptance matrix

The existing `foundation_io.bd` fixture and `foundation_io_native.rs` harness
are extended rather than duplicated. Every listed case runs through source
lowering, JIT, static AOT, and the shared native kit.

| Requirement | Fixture proof |
| --- | --- |
| Contract dispatch and idempotent close | `TestStream: Stream, Closer, Disposable`; `CloseTwice(Closer)` and `Stream`-typed read/write calls prove both published contract seams. Repeated close releases once and has stable success behavior. |
| One lifecycle transition | Explicit `Close` followed by `use TestStream` causes `Dispose -> Close` but keeps `release_calls == 1`, including the configured-failure path. |
| Scoped exits | Fallthrough, `return`, postfix `?` propagation, and nested `use` prove the established reverse-order lexical cleanup path. |
| Close failure conversion | `Dispose -> Close` failure becomes `IoError::CloseFailed()` only via the existing conversion. |
| Transfer policy ownership | Partial stream behavior is exercised through `Core.IO` exact/all helpers; fixture contains no retry/range loop. |
| Base read/write boundaries | Invalid and empty ranges bypass implementation; provider negative/oversize counts map to typed errors; provider `Result::Error` values propagate; EOF leaves destination unchanged. |
| Exact/all boundaries | Partial EOF preserves the prefix; stalled write reports `NoProgress`; nonzero offsets preserve unaffected bytes. |

## Rejected alternatives

- **`Core.IO.Close(stream)` helper with a shared closed set:** violates
  ownership and duplicates lifecycle state outside the resource.
- **A new `ScopedStream` cleanup lowering path:** duplicates the existing
  `Disposable` semantic and ISLE path.
- **Concrete stream retry/range loops:** duplicates `Core.IO` transfer policy
  and lets implementations drift from the normative behavior.
- **A generic `DisposeError` coercion:** bypasses the explicit, unique
  `CleanupConversion` contract.

## Implementation boundaries

Expected implementation changes are limited to the existing native foundation
fixture and its harness, plus the release changelog/report. Production corelib
interfaces and compiler cleanup semantics are not broadened unless a fixture
exposes a genuine contract defect. A stale `IO.bd` F6 RED comment may be
corrected only when its referenced gate is reverified.
