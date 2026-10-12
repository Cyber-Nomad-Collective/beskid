# IOCP deadline/completion race

Status: implemented for 0.6.0 (Windows run pending).
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
| `ORPHANED` | detached | free the OVERLAPPED, buffer, and accepted socket only |

**Runtime cancel settles** (`beskid_rt_v5_intrinsic_network_cancel` →
`BeskidNetworkSettleLocked`). It is used for deadline and fiber-cancellation winners in
`NetworkFinish`, for runtime close in `NetworkCloseLocked`, and for detached-fiber
cleanup in `NetworkShutdown`. It:

1. changes `IN_FLIGHT` to `SETTLING` and removes the operation from its socket slots,
2. calls `CancelIoEx(socket, &overlapped)`. Success or `ERROR_NOT_FOUND` both
   guarantee one queued packet (facts 2 and 6). Any other failure means the handle or
   OVERLAPPED is not the one the kernel holds; the runtime traps (code 10, the same
   class as a failed completion port), and does not wait forever on a packet that
   cannot arrive,
3. waits on `beskid_network_settled` with `SleepConditionVariableSRW`, which releases
   `beskid_network_lock`, until the reactor has delivered the packet
   (`request->native_state` is cleared).

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
releases native storage. A settling operation is no longer in a socket slot, so close
cannot orphan it.

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

- The wait is bounded by the time that Winsock (AFD) takes to complete a cancelled
  operation, which is immediate for pending receive, send, AcceptEx, and ConnectEx.
  The documented recommendation (fact 4) is to wait, not to continue with an unknown
  state. A failed completion port already traps in `BeskidNetworkReactorMain`, so
  the settler cannot wait on a dead reactor without a trap.
- The settler holds the Beskid network table lock (taken by `NetworkFinish`,
  `NetworkCloseLocked`, and `NetworkShutdown`) and releases `beskid_network_lock` while
  it waits. The reactor thread takes only `beskid_network_lock` and, for in-flight
  packets, the Foundation owner lock. Neither path takes the table lock, so there is
  no lock-order cycle. The table lock also prevents a second cancel of the same
  request. If a second cancel occurs, it skips `CancelIoEx` and waits on the same
  condition.
- `reactor_destroy` waits for `pending == 0`, and a settling operation is pending, so
  the reactor thread outlives every settler.
- The OVERLAPPED, the native buffer, and the AcceptEx socket stay in the operation
  until the reactor frees them after dequeue (fact 3). `CancelIoEx` and the classifier
  do not read freed memory. The settler compares only `request->native_state` after
  it wakes. The AcceptEx path uses the stored family, not the socket, because a
  settling operation is no longer linked to its socket.
- No new platform imports: `SleepConditionVariableSRW`, `WakeAllConditionVariable`,
  `CancelIoEx`, and `GetLastError` are already in the closed Windows import manifest.
  `CONDITION_VARIABLE_INIT` needs no `InitializeConditionVariable` call.

## Tests

- `compiler/crates/beskid_abi/tests/fixtures/network_settle.c` (all native hosts):
  a pure state-machine replay of the orderings: packet queued when the deadline wins,
  idle cancel, delivery before cancel, native close orphan, repeated cancel, a
  `CancelIoEx` failure that fails closed, the classification table, and the verdict for
  a non-timeout winner.
- `compiler/crates/beskid_abi/tests/fixtures/network_settle_iocp.c` (Windows only):
  a real loopback TCP pair on a completion port. It shows that a receive that
  completed in the kernel makes `CancelIoEx` fail with `ERROR_NOT_FOUND`, and that its
  packet is still dequeued with the byte. It also shows that an idle receive is
  dequeued as `ERROR_OPERATION_ABORTED` with zero bytes and does not consume data
  sent afterwards.
- `compiler/crates/beskid_abi/tests/network_iocp_settle.rs` runs both fixtures and
  checks that `network_iocp.h` routes runtime cancel to settlement and native close to
  orphaning.
- Existing end-to-end coverage in `NetworkNativeTests.bd` runs unchanged over the
  IOCP kit on Windows: `native_network_tcp_read_deadline_race_delivers_completed_bytes`,
  `native_network_udp_receive_deadline_race_delivers_completed_datagram`,
  `native_network_close_vs_accept_deadline_has_one_winner`, and
  `native_network_physical_readiness_close_deadline_has_no_leaks`. On IOCP the reactor
  thread usually dequeues the packet before the cancel, so these rounds do not by
  themselves force the queued-packet order; the Windows fixture does.
