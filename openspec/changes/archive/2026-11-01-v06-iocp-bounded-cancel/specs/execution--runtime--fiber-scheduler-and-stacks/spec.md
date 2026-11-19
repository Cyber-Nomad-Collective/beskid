## ADDED Requirements

### Requirement: Native reactor cancellation is bounded and keeps native storage alive
A runtime cancel of a pending native socket operation (a deadline, fiber cancellation, or runtime close winner) SHALL return to its caller within a bounded time on every reactor backend. When the cancel returns, the request status SHALL be final: either the operation completed and its transfer is delivered, or the operation is reported as cancelled and its caller observes the cancellation or deadline result.

A backend whose cancellation is a request to the kernel (IOCP) SHALL wait for the operation's completion for at most 250 milliseconds. When the completion does not arrive within that bound, the runtime SHALL report the operation as cancelled and SHALL keep the native operation storage (the OVERLAPPED structure, native buffers, and any accept socket) owned by the reactor until the kernel delivers its completion. The runtime SHALL NOT free or reuse that storage, and SHALL NOT write the caller's buffer, after the cancel returns. Until that completion arrives, a new operation in the same direction on that socket SHALL report `Busy`.

If that late completion shows that a stream transfer happened (bytes read or written) or that a stream connect completed, the runtime SHALL fail every later operation on that socket with `ConnectionAborted`. A late completion that shows an abort, a failure, or end of stream SHALL leave the socket usable.

Runtime shutdown SHALL close every native socket handle and then wait for outstanding completions for at most 2 seconds. Operations whose completions do not arrive within that bound SHALL be leaked with their reactor rather than freed.

#### Scenario: Completed transfer wins over its deadline within the bound
- **GIVEN** a TCP read on Windows whose data arrived in the kernel at the moment its read deadline expired
- **WHEN** the deadline wins the one-winner wait and the runtime cancels the operation
- **THEN** the completion is received within the bound and the read returns the bytes instead of `TimedOut`

#### Scenario: Withheld completion does not block the caller
- **GIVEN** a pending TCP read on Windows whose completion is not delivered after `CancelIoEx`
- **WHEN** its read deadline expires
- **THEN** the read returns `TimedOut` within the bound, a new read on that socket reports `Busy` until the completion arrives, and the operation storage is released only after it arrives

#### Scenario: Late stream transfer fails the socket closed
- **GIVEN** a TCP read on Windows that was reported as `TimedOut` after the bound expired
- **WHEN** its late completion shows that bytes were received
- **THEN** every later operation on that socket fails with `ConnectionAborted`

#### Scenario: Shutdown drain is bounded
- **GIVEN** a runtime with pending native socket operations
- **WHEN** the network runtime shuts down
- **THEN** every socket handle is closed and shutdown waits at most 2 seconds for the remaining completions
