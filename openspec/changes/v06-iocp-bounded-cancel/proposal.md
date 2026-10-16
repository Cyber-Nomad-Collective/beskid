## Why

0.6.0 made a Windows network completion that races its deadline keep its data: a runtime cancel issues `CancelIoEx` and waits for the operation's completion packet, because only that packet holds the final status. That wait had no timeout. The cancelling call holds the runtime network table lock, so one withheld packet (a starved reactor thread or a misbehaving layered provider) could stall every network call of the process. The 0.6.0 release notes listed this as a known limitation.

## What Changes

- A runtime cancel on IOCP waits for the completion packet for at most 250 ms. When the packet arrives in time, its status is final, as before (a completed transfer wins over the deadline).
- When the bound expires first, the operation is abandoned: the caller gets the cancellation or deadline result at once, and the native operation (OVERLAPPED, native buffer, accept socket) stays owned by the reactor in its socket slot until its packet arrives. It is never freed or reused before that packet. A new operation in that direction reports `Busy` meanwhile.
- A late packet that shows a transfer on a stream (bytes read or written, or a connect that completed) poisons the socket: every later operation on it fails with `ConnectionAborted`. A late abort, failure, or end of stream releases the slot and leaves the socket intact.
- Runtime shutdown closes every socket handle, which forces the remaining packets, and waits at most 2 s for the reactor thread. Past that, the reactor and its pending operations are leaked by design.
- The Windows limitation is removed from the 0.6.0 release notes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `execution--runtime--fiber-scheduler-and-stacks`: native reactor cancellation is bounded and keeps native operation storage alive until its completion.

## Impact

Native host: `compiler/crates/beskid_abi/assembly/common/network_settle.h` and `assembly/x86_64-pc-windows-msvc/network_iocp.h`. No Beskid runtime source, ABI layout, or platform import changes. Tests: `compiler/crates/beskid_abi/tests/fixtures/network_settle.c` (every host), `tests/fixtures/network_settle_iocp.c` (Windows), `tests/network_iocp_settle.rs`. Design: `docs/design/2026-10-12-iocp-deadline-race.md`.
