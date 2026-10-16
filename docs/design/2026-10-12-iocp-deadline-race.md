# IOCP deadline/completion race

Status: implemented for 0.6.0, including the bounded cancel wait (2026-10-13).
Windows evidence: `cargo test --locked -p beskid_abi --test network_iocp_settle` in
the Woodpecker windows pipeline.
Scope: `compiler/crates/beskid_abi/assembly/x86_64-pc-windows-msvc/network_iocp.h`,
`compiler/crates/beskid_abi/assembly/common/network_settle.h`.

## Problem

0.5.3 made a completed transfer win over its deadline (`NetworkFinish` in
`compiler/runtime/beskid/src/Runtime/Network/Operations.bd`). When the Foundation
timer wins the one-winner wait, `NetworkFinish` calls `network_cancel` and then reads
the request status. Status 0 means the native operation completed, and the timeout
winner becomes READY. This relies on one contract: **after `network_cancel` returns,
the request status is final.**

The epoll/kqueue backend meets the contract, because the reactor performs the
system call and writes the status under the same lock that cancel takes.

The 0.5.3 IOCP backend did not meet it. `BeskidNetworkCancelLocked` wrote
`NET_CANCELLED`, detached the request, and called `CancelIoEx`. If the kernel had
already completed the operation and its packet was still in the completion port, the
packet was dequeued later with no request attached and was discarded:

- a stream read lost the received bytes (they were already removed from the socket),
- a datagram receive lost the datagram,
- an accept closed the accepted connection,
- a stream write reported `TimedOut` for bytes that the peer receives,
- a connect reported `TimedOut` for an established connection.

## Microsoft-documented IOCP semantics

1. `CancelIoEx` only marks I/O for cancellation. It "does not wait for all canceled
   operations to complete", and the operation completes with one of three statuses:
   it completed normally (the cancel was too late), it was cancelled
   (`ERROR_OPERATION_ABORTED`), or it failed with another error. "You must check the
   completion status to determine the completion state."
   ([CancelIoEx](https://learn.microsoft.com/en-us/windows/win32/fileio/cancelioex-func))
2. For a handle associated with a completion port, "for asynchronous operations still
   pending, the cancel operation will queue an I/O completion packet". When no
   request is found, `CancelIoEx` returns 0 with `ERROR_NOT_FOUND`: the operation
   already completed and its packet is already queued. (same page)
3. The application "must not free or reuse the OVERLAPPED structure associated with
   the canceled I/O operations until they have completed". Once the operation
   completes, "successfully or with a canceled status", the OVERLAPPED is no longer
   in use.
   ([CancelIoEx](https://learn.microsoft.com/en-us/windows/win32/fileio/cancelioex-func),
   [Canceling Pending I/O Operations](https://learn.microsoft.com/en-us/windows/win32/fileio/canceling-pending-i-o-operations))
4. Cancellation is not guaranteed. Microsoft's own cancelable-read example waits for
   the operation after `CancelIoEx`, because it "might complete with a cancellation
   status, or it might complete normally", and states that if the driver misbehaves
   it is better to stop responding there than to continue and mask the problem.
   ([Canceling Pending I/O Operations](https://learn.microsoft.com/en-us/windows/win32/fileio/canceling-pending-i-o-operations))
5. `GetQueuedCompletionStatus` returning FALSE with a non-NULL `lpOverlapped` means a
   packet for a failed operation was dequeued; `GetLastError` is its status and the
   byte count is valid.
   ([GetQueuedCompletionStatus](https://learn.microsoft.com/en-us/windows/win32/api/ioapiset/nf-ioapiset-getqueuedcompletionstatus))
6. Without `FILE_SKIP_COMPLETION_PORT_ON_SUCCESS`, an overlapped call that succeeds at
   once still queues its packet
   ([SetFileCompletionNotificationModes](https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setfilecompletionnotificationmodes)).
   Beskid does not set that mode, so every accepted operation has exactly one packet.

Consequence: on IOCP the final status of an operation exists only in its dequeued
packet. A cancel cannot know whether the operation completed until that packet is
dequeued.

## Design: settle on runtime cancel, orphan on native close

Each `BeskidNetworkOperation` has a state (`enum BeskidSettleState`):

| State | Request | Reactor action on the packet |
| --- | --- | --- |
| `IN_FLIGHT` | attached, in a socket slot | classify, write the request, post READY to the owner |
| `SETTLING` | attached, removed from the socket slot | classify, write the request, wake the settling cancel |
| `ORPHANED` | detached, socket closed | free the OVERLAPPED, buffer, and accepted socket only |
| `ABANDONED` | detached after the settle bound, still in its socket slot | decide stream poison, release the slot, free native storage |

**Runtime cancel settles** (`beskid_rt_v5_intrinsic_network_cancel` →
`BeskidNetworkSettleLocked`). It is used for deadline and fiber-cancellation winners in
`NetworkFinish`, for runtime close in `NetworkCloseLocked`, and for detached-fiber
cleanup in `NetworkShutdown`. It:

1. changes `IN_FLIGHT` to `SETTLING`; the operation stays in its socket slot,
2. calls `CancelIoEx(socket, &overlapped)`. Success or `ERROR_NOT_FOUND` both
   guarantee one queued packet (facts 2 and 6). Any other failure means the handle or
   OVERLAPPED is not the one the kernel holds; the runtime traps (code 10, the same
   class as a failed completion port), and does not wait forever on a packet that
   cannot arrive,
3. waits on `beskid_network_settled` with `SleepConditionVariableSRW`, which releases
   `beskid_network_lock`, until the reactor has delivered the packet
   (`request->native_state` is cleared), for at most `BESKID_SETTLE_WAIT_MS` (250 ms)
   measured with `GetTickCount64` (`BeskidSettleAwait`, see "Bounded cancel" below).

The reactor thread dequeues the packet, classifies it with the shared rules, copies
data into the request buffer (which the caller owns until `NetworkFinish` returns),
wraps an accepted socket, writes `count`/`status`, detaches, and wakes the settler. It
does not post READY to the owner for a settling operation: the waiter has already
resumed, and the cancel returns the final status directly.

When cancel returns, the request status is final, which is the contract that
`NetworkFinish` already uses. A completed operation (status 0) therefore wins over the
deadline on IOCP, exactly as on the readiness backends. No Beskid code changed, only
the comments in `Operations.bd` and `Runtime/Network/README.md`.

**Native close orphans** (`beskid_rt_v5_intrinsic_network_close` →
`BeskidNetworkOrphanLocked`). The close winner (`NET_CLOSED`) is already decided, so
the request is detached at once, `CancelIoEx` is issued, and the later packet only
releases native storage. An abandoned operation in the slot is orphaned the same way.
A settling operation only leaves the slot: its request belongs to the waiting cancel,
which receives the packet that `closesocket` forces. Close posts nothing for it.

## Bounded cancel

0.6.0 first shipped the settle wait with `INFINITE`. Microsoft's own example waits
without a bound after `CancelIoEx` (fact 4), and Go does the same per goroutine
(`internal/poll/fd_windows.go`: `CancelIoEx`, then `fd.pd.waitCanceled`). In Beskid the
settler holds the runtime network table lock, so an unbounded wait would stall every
network call of the process behind one withheld packet. The rule that matters is fact
3: the OVERLAPPED and buffers stay valid until the packet arrives. Waiting is only one
way to meet it. libuv (`uv__tcp_close`: `CancelIoEx`, then the handle closes only when
`reqs_pending` reaches zero) and mio (the `SockState` reference held for the kernel is
released only in `feed_event`) meet it by moving ownership to the event loop instead.
Beskid does both: it waits a short bound for the common case, where the packet holds
the final status, and moves ownership to the reactor when the bound expires.

**Settle bound.** `BeskidSettleAwait` (in `network_settle.h`) takes a clock, a
settled test, and a lock-releasing timed wait. It returns 1 when the packet was
delivered, 0 when `BESKID_SETTLE_WAIT_MS` expired. Spurious and unrelated wakes
(`WakeAllConditionVariable` wakes every settler) only shorten the next wait; no wait
exceeds the remaining time. The settled test runs under the lock before every
expiry check, so a packet delivered at the bound still settles.

**Abandoned operation.** When the bound expires, the settler, still under
`beskid_network_lock`, changes `SETTLING` to `ABANDONED`, writes `NET_CANCELLED` with
count 0 to the request, and detaches it. The reactor did not dequeue the packet (it
would have detached the request), so the operation is still allocated. Then:

- The OVERLAPPED, the native buffer, and the AcceptEx socket stay owned by the
  operation in the reactor's operation list until the packet is dequeued. They are
  never freed or reused before it (fact 3). Each submit allocates a new operation.
- The request buffer is never written again. The reactor copies into it only for an
  attached request, so `NetworkFinish` can release the request at once.
- The operation keeps its socket slot, so a new operation in that direction returns
  `NET_BUSY` until the packet arrives. That is exact: the kernel operation is still
  in flight. The other direction is unaffected.
- `NetworkFinish` sees status `NET_CANCELLED`: the deadline or cancellation winner
  stands, and the caller resumes after at most the bound.

**Late packet.** The reactor classifies the packet of an abandoned operation with the
same table, and `BeskidSettleAbandonedPoisons` decides whether the caller's view is
still true:

| Late packet | Effect |
| --- | --- |
| abort, failure, or zero-byte read (end of stream) | slot released, socket intact |
| stream read or write that moved bytes | socket poisoned |
| connect that completed | socket poisoned |
| datagram receive or send that completed | datagram lost or sent; within UDP semantics |
| accept that completed | accepted socket closed; the peer sees a reset; listener intact |

A poisoned socket rejects every later submit with `NET_CONNECTION_ABORTED`
(`ConnectionAborted`). Received bytes already left the socket and sent bytes already
reached the peer, so the stream no longer matches what the caller was told. Failing
closed is the only correct result; silently dropping the bytes is the 0.5.3 bug.

**Shutdown drain.** `beskid_rt_v5_intrinsic_network_reactor_destroy` closes every
socket handle, which cancels every pending operation on it (in flight, abandoned, or
settling) and forces its packet
([closesocket](https://learn.microsoft.com/en-us/windows/win32/api/winsock/nf-winsock-closesocket)).
Operations orphaned by an earlier close already have a closed handle. The function
then waits at most `BESKID_SETTLE_DRAIN_MS` (2 s) for the reactor thread, which exits
when no operation is pending. If a provider still withholds a packet, the reactor, its
port, its thread, and the pending operations are leaked by design: the thread keeps
running and frees each operation if its packet ever arrives. The leak is at most one
reactor and its pending operations per runtime shutdown. Freeing an OVERLAPPED that the
kernel can still write is never allowed.

### Packet classification (`BeskidSettleClassify`)

| Packet | Outcome | Runtime status |
| --- | --- | --- |
| success | TRANSFERRED, count = min(bytes, capacity) | 0 |
| receive with `WSAEMSGSIZE` / `ERROR_MORE_DATA` | TRUNCATED, count = capacity | 0, truncated |
| stream read/write with `ERROR_OPERATION_ABORTED` and bytes > 0 | TRANSFERRED | 0 |
| any other `ERROR_OPERATION_ABORTED` | ABORTED | `NET_CANCELLED` |
| any other error | FAILED | mapped by `BeskidNetworkCompletionError` |

The third row applies the rule "if bytes were transferred, the completion wins". The
bytes of a stream read are already removed from the socket, and the bytes of a stream
write already go to the peer. To discard them would corrupt the stream. Datagram,
accept, and connect operations are atomic. An aborted one did not transfer.

### Deadline verdict

`NetworkFinish` (unchanged): when the winner is TIMEOUT and the settled status is 0,
the winner becomes READY. Cancellation and close winners are unchanged. This matches
the readiness backends, where a completion that already happened before an explicit
cancellation is also not delivered.

## Liveness and locking

- Every runtime cancel returns within `BESKID_SETTLE_WAIT_MS` plus timer resolution
  (about 16 ms for `GetTickCount64`). Winsock (AFD) completes a cancelled receive,
  send, AcceptEx, or ConnectEx at once, so the bound is reached only when the reactor
  thread is starved or a layered provider withholds the packet. A failed completion
  port still traps in `BeskidNetworkReactorMain`.
- Shutdown returns within `BESKID_SETTLE_DRAIN_MS` after the sockets are closed.
- The only other wait is the reactor thread's own idle `GetQueuedCompletionStatus`,
  which a posted packet ends at shutdown.
- The settler holds the Beskid network table lock (taken by `NetworkFinish`,
  `NetworkCloseLocked`, and `NetworkShutdown`) for at most the settle bound and releases
  `beskid_network_lock` while it waits. The reactor thread takes only `beskid_network_lock` and, for in-flight
  packets, the Foundation owner lock. Neither path takes the table lock, so there is
  no lock-order cycle. The table lock also prevents a second cancel of the same
  request. If a second cancel occurs, it skips `CancelIoEx` and waits on the same
  condition.
- A settling or abandoned operation is pending, so the reactor thread does not exit
  before its packet. `reactor_destroy` frees the reactor only after the thread exits.
- The OVERLAPPED, the native buffer, and the AcceptEx socket stay in the operation
  until the reactor frees them after dequeue (fact 3). `CancelIoEx` and the classifier
  do not read freed memory. The settler compares only `request->native_state` after
  it wakes. The AcceptEx path uses the stored family, not the socket, because a
  close can unlink a settling operation from its socket. The reactor releases the
  slot (`BeskidNetworkUnslot`) for every dequeued packet before it frees the operation.
- No new platform imports: `SleepConditionVariableSRW`, `WakeAllConditionVariable`,
  `CancelIoEx`, `GetLastError`, `GetTickCount64`, and `WaitForSingleObject` are already
  in the closed Windows import manifest.
  `CONDITION_VARIABLE_INIT` needs no `InitializeConditionVariable` call.

## Tests

- `compiler/crates/beskid_abi/tests/fixtures/network_settle.c` (all native hosts):
  a pure state-machine replay of the orderings: packet queued when the deadline wins,
  idle cancel, delivery before cancel, native close orphan, repeated cancel, a
  `CancelIoEx` failure that fails closed, the classification table, and the verdict for
  a non-timeout winner. For the bounded cancel it drives `BeskidSettleAwait` with a
  fake clock and condition variable (delivery in time, through spurious wakes, at the
  bound, never; no wait longer than the bound) and replays the abandoned path: busy
  slot until the packet, aborted late packet, late stream read, partial write and
  connect that poison, datagram and accept that do not, and close of an abandoned
  operation.
- `compiler/crates/beskid_abi/tests/fixtures/network_settle_iocp.c` (Windows only):
  a real loopback TCP pair on a completion port. It shows that a receive that
  completed in the kernel makes `CancelIoEx` fail with `ERROR_NOT_FOUND`, and that its
  packet is still dequeued with the byte. It also shows that an idle receive is
  dequeued as `ERROR_OPERATION_ABORTED` with zero bytes and does not consume data
  sent afterwards. Case C runs the real bounded wait (`GetTickCount64` and an SRW
  condition variable) with no reactor: it expires within the bound, the packet is
  still queued afterwards with its transfer, and the transfer is classified as stream
  poison. Case D shows that `closesocket` forces the packet of a pending receive
  within the drain bound.
- `compiler/crates/beskid_abi/tests/network_iocp_settle.rs` runs both fixtures and
  checks that `network_iocp.h` routes runtime cancel to bounded settlement (no
  `INFINITE`, abandonment with `NET_CANCELLED`, no free in the settler), native close to
  orphaning, late packets through the poison rule, poisoned sockets to
  `NET_CONNECTION_ABORTED`, and the shutdown drain to `BESKID_SETTLE_DRAIN_MS`. On
  Windows: `cd compiler && cargo test --locked -p beskid_abi --test network_iocp_settle`.
- Existing end-to-end coverage in `NetworkNativeTests.bd` runs unchanged over the
  IOCP kit on Windows: `native_network_tcp_read_deadline_race_delivers_completed_bytes`,
  `native_network_udp_receive_deadline_race_delivers_completed_datagram`,
  `native_network_close_vs_accept_deadline_has_one_winner`, and
  `native_network_physical_readiness_close_deadline_has_no_leaks`. On IOCP the reactor
  thread usually dequeues the packet before the cancel, so these rounds do not by
  themselves force the queued-packet order; the Windows fixture does.
