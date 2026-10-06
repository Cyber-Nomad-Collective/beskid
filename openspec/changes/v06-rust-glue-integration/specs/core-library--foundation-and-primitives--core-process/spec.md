## ADDED Requirements

### Requirement: Streaming child process control
Core.Process SHALL expose typed Spawn(ProcessStartInfo), ChildProcess stdin Writer/stdout Reader/stderr Reader, cooperative Wait, Terminate and idempotent Close. ProcessStartInfo SHALL supply explicit executable, argv, environment policy and cwd without shell interpolation. Partial IO SHALL follow Core.IO Reader/Writer range/empty/EOF/zero-progress contracts. Process failures SHALL be typed values. Wait/cancellation SHALL use existing fiber/runtime wait ownership; separate stderr draining SHALL prevent pipe deadlock. Setup failure SHALL close partial pipes/handles and reap any created child; close/terminate/cancel/exit races SHALL settle once without retained child/fd/handle resources.

#### Scenario: Binary pipes and stderr flood
- **GIVEN** a child receives Unicode/space argv and NUL bytes while flooding stderr
- **WHEN** stdin/stdout/stderr and wait are exercised
- **THEN** argv is intact, binary bytes match, stderr is drained separately and no pipe deadlock occurs (R4-PROC-01..03)

#### Scenario: Failure and cancellation cleanup
- **GIVEN** partial spawn setup fails or wait is cancelled while child exits
- **WHEN** cleanup runs
- **THEN** typed terminal result occurs once and child/resources are closed/reaped (R4-PROC-04..06)

### Requirement: Bounded child session lifetime
ChildProcess and its pipe implementations SHALL be source-issued sealed capabilities, not user-constructible native tokens. Spawn SHALL copy and validate executable, argument, environment and working-directory UTF-8 before effects, reject interior NUL and invalid environment keys, and pass each argument independently without shell evaluation. Inherit, Replace and Extend environment policies SHALL have explicit distinct behavior. A failed setup SHALL release every partially created resource and terminate and reap any child already created.

Wait and partial pipe operations SHALL use the existing cooperative runtime external-wait cancellation authority and retain one absolute monotonic deadline across readiness retries. Cancellation and deadline expiry SHALL be distinct typed results. Native readiness probes SHALL be nonblocking, SHALL NOT retain managed pointers, and SHALL NOT create a second scheduler. Empty valid transfers SHALL bypass native effects and invalid ranges SHALL fail before effects.

Close SHALL first invalidate further pipe/session operations, close stdin and request contained process-tree termination when necessary, then reap and release native resources under a single absolute deadline no later than five seconds after Close begins. Repeated Close and pipe Close through aliases SHALL settle idempotently. Failure to establish containment or complete cleanup SHALL return a typed failure and SHALL NOT report successful closure. Process exit, cancellation, Close and readiness races SHALL settle each native ownership obligation once. Output pipes SHALL remain separately drainable without requiring stdout consumption to advance stderr.

#### Scenario: Exact invocation without shell expansion
- **GIVEN** an executable with spaces and Unicode in its argument vector, explicit cwd and Replace environment policy
- **WHEN** Spawn starts the child
- **THEN** the child receives the exact argument boundaries, cwd and replacement environment, and shell metacharacters are ordinary argument bytes (R4-PROC-07)

#### Scenario: Timeout and cancellation preserve absolute bounds
- **GIVEN** a child with a pending pipe transfer and Wait under an absolute deadline
- **WHEN** readiness repeatedly reports pending or the calling fiber is cancelled
- **THEN** retries do not extend the deadline and the result distinguishes TimedOut from Cancelled without publishing a stale transfer (R4-PROC-08)

#### Scenario: Descendant termination and alias close
- **GIVEN** a child whose descendant retains inherited pipe ends and aliases of its session and pipes
- **WHEN** Close executes and is repeated through the aliases
- **THEN** the contained process tree is terminated, the child is reaped, every native pipe and containment handle is released once, and completion or typed cleanup failure occurs within five seconds (R4-PROC-09)

#### Scenario: Construction cannot forge a native session
- **GIVEN** ordinary source attempting to initialize a ChildProcess or ProcessReader token directly
- **WHEN** its source is checked
- **THEN** the compiler rejects construction outside the exact prepared canonical capability issuer (R4-PROC-10)

### Requirement: Structured capture shares child authority
Run(command, args) SHALL use the same source-issued child and pipe authority as Spawn, without shell interpolation or a second native capture codec. Run SHALL drain stdout and stderr independently while waiting for exit, return ProcessOutput on zero exit, and return the declared ExitCode error with captured stderr on nonzero exit. Capture SHALL admit at most 16 MiB combined stdout/stderr bytes, return a typed IOError on invalid UTF-8 or budget exhaustion, and complete contained cleanup on every error or cancellation. Binary clients SHALL use streaming Reader/Writer without UTF-8 coercion.

#### Scenario: Capture with a stderr flood
- **GIVEN** a child whose stderr fills its pipe before it produces stdout
- **WHEN** Run captures the child
- **THEN** both pipes advance, bounded valid UTF-8 output is retained and the child is reaped (R4-PROC-11)

#### Scenario: Invalid text and bounded capture
- **GIVEN** a child producing invalid UTF-8 or more than the combined capture byte budget
- **WHEN** Run captures output
- **THEN** it returns typed IOError and completes child cleanup while binary streaming remains lossless (R4-PROC-12)

### Requirement: Nonblocking pump and scoped cleanup
ProcessReader.TryRead and ProcessWriter.TryWrite SHALL return typed Option transfer counts, with None for pending readiness and Some(0) for a valid empty transfer or reader EOF as specified by Core.IO. They SHALL validate ranges before effects. A pending write SHALL retain only copied native bytes and SHALL reject a different retry prefix with Busy without altering the existing operation. WaitReady SHALL use the same absolute Deadline and existing cooperative cancellation authority. ChildProcess and its pipes SHALL implement Disposable through their respective idempotent Close operations; cleanup failure SHALL be translated through explicit Result cleanup conversion.

#### Scenario: Framing pump waits without a second scheduler
- **GIVEN** a framing pump whose read or write reports pending
- **WHEN** it retries after WaitReady under the original Deadline
- **THEN** partial transfer counts and exact byte ordering are retained, cancellation remains typed and no scheduler or codec is created by Core.Process (R4-PROC-13)

#### Scenario: A competing write does not replace pending bytes
- **GIVEN** an admitted native write with retained bytes and another retry prefix
- **WHEN** the second prefix is attempted
- **THEN** Busy is returned without replacing, cancelling or attributing the first operation's completion to the second prefix (R4-PROC-14)

#### Scenario: Scoped child cleanup propagates failure
- **GIVEN** a scoped ChildProcess or pipe
- **WHEN** scope exit invokes Dispose
- **THEN** its exact Close obligation executes idempotently and cleanup failure propagates through the explicit typed conversion (R4-PROC-15)

### Requirement: Cooperative spawn settlement
SpawnUntil(ProcessStartInfo, Deadline) SHALL use the caller's absolute checked monotonic deadline and the existing cancellation authority throughout setup settlement. Spawn(ProcessStartInfo) SHALL select a checked five-second setup deadline. POSIX exec confirmation SHALL use nonblocking probes and cooperative waits; pending confirmation SHALL NOT block a fiber on the error pipe or create a scheduler. Timeout or cancellation SHALL close, terminate and reap any started child before relinquishing ownership. Synchronous platform process-creation calls SHALL be identified as nonpreemptible native-call boundaries; the setup deadline SHALL be checked before and after their settlement rather than falsely claiming interruption inside the OS call.

#### Scenario: Pending exec confirmation remains cooperative
- **GIVEN** a child whose POSIX exec confirmation is pending
- **WHEN** SpawnUntil waits under its original Deadline
- **THEN** other fibers may progress and cancellation or expiry triggers contained cleanup without resetting the deadline (R4-PROC-18)

#### Scenario: Convenience spawn has finite settlement policy
- **GIVEN** a caller uses Spawn without supplying a Deadline
- **WHEN** setup confirmation remains pending
- **THEN** the checked five-second deadline applies and its expiry is reported distinctly after cleanup (R4-PROC-19)

## MODIFIED Requirements

### Requirement: Process execution contract: Decision [D-CORE-PRIM-0180]
The Beskid standard SHALL enforce the following process execution contract. Run(string command, string[] args) SHALL return Result<ProcessOutput, ProcessError> and SHALL delegate to the same source-issued Spawn, streaming pipe, wait and contained cleanup authority. It SHALL NOT introduce or retain a separate __process_run dispatcher or native capture codec. ProcessOutput SHALL contain exitCode:i64, stdout:string and stderr:string. ProcessError SHALL retain NotFound(string), PermissionDenied(string), ExitCode(i64,string) and IOError(string), and SHALL additionally distinguish invalid input, cancellation, deadline expiry, closed capabilities, busy operations, cleanup failure and unavailable cooperative execution. Run SHALL return ProcessOutput for zero exit and ExitCode with captured stderr for nonzero exit. Its environment policy SHALL inherit, its argument vector SHALL preserve argument boundaries without shell expansion, and capture SHALL obey the structured capture requirement.

**Stable ID:** BSP-REQ-4A7C91E2D6F308B5

#### Scenario: Structured command execution shares streaming ownership
- **GIVEN** a caller invokes Run with an executable and an argument vector
- **WHEN** the child starts, emits output and terminates
- **THEN** the same canonical child authority used by Spawn captures both streams and reaps the child without a parallel dispatcher (R4-PROC-16)

#### Scenario: Execution failures remain typed
- **GIVEN** a missing or forbidden executable, nonzero exit, cancellation or cleanup failure
- **WHEN** Run executes
- **THEN** the corresponding ProcessError result is returned and the child ownership obligation is not reported as successfully closed before cleanup completes (R4-PROC-17)

### Requirement: Issued absolute shutdown deadlines
The deadline module SHALL provide Earlier and Reserve operations that retain the issued monotonic clock domain and SHALL report unavailable clock sampling through IsExpired. Reserve SHALL subtract a nonnegative duration with saturation at zero and SHALL reject negative durations. ChildProcess.CloseUntil SHALL share the supplied absolute deadline across termination and reap, clamp cleanup to at most five seconds from admission, and attempt immediate cleanup even when the deadline has expired. Pending cleanup at expiry SHALL return CleanupFailed without claiming the process is reaped or discarding its retained capability.

#### Scenario: Protocol grace shares the cleanup cap
- **GIVEN** an issued overall deadline and a one-second reserved cleanup interval
- **WHEN** a session derives its acknowledgment deadline with Reserve and calls CloseUntil with the original overall deadline
- **THEN** acknowledgment and cleanup SHALL consume one absolute budget without restarting the cleanup interval.

#### Scenario: Expired deadline still attempts cleanup
- **GIVEN** a live contained child and an expired issued deadline
- **WHEN** CloseUntil is invoked
- **THEN** it SHALL perform one immediate termination and reap probe and SHALL return explicit cleanup failure if the child remains pending.
