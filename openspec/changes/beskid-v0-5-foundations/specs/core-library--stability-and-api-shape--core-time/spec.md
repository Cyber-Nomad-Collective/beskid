## ADDED Requirements

### Requirement: Core.Time exposes relative scheduler sleep
The `corelib_foundation` package's `Core.Time` hub SHALL expose `Sleep(Duration duration) -> Core.Results.Result<unit, TimerError>`. `TimerError` SHALL be a closed enum containing exactly the payload-free variants `InvalidDuration()`, `DeadlineOverflow()`, `Unavailable()`, and `Cancelled()`, distinct from civil-input `TimeError` and fiber lifecycle errors. Elapsed sleep SHALL be success, not a timeout error. The call SHALL require a scheduler-owned fiber for registration; an ordinary host entry with an otherwise valid request SHALL receive `Unavailable`, without a blocking-thread fallback or implicitly spawned helper. The API SHALL expose no timer handle, disposal obligation, or `Concurrency.Sleep` alias.

This change SHALL introduce only relative `Sleep(Duration)`. Public `SleepUntil(Instant)` SHALL remain deferred until a checked or opaque monotonic deadline domain can enforce the canonical Core.Time `Clock domain separation` requirement: the current untagged `Instant` cannot distinguish realtime input from monotonic input. Internal absolute scheduler deadlines remain the existing timer input.

**Stable ID:** `BSP-REQ-D613601481B2`

#### Scenario: Public timer result is closed
- **GIVEN** a caller imports `Core.Time` from `corelib_foundation`
- **WHEN** the caller typechecks `Sleep(Duration)` and exhaustively matches its error
- **THEN** the result SHALL be `Result<unit, TimerError>` with exactly the four declared payload-free error variants and no native handle or raw status payload

#### Scenario: Host entry has no scheduler fiber
- **GIVEN** an ordinary host-driven entry has no current scheduler-owned fiber and supplies a nonnegative duration with a representable monotonic deadline
- **WHEN** it calls `Sleep`
- **THEN** the call SHALL return `Error(TimerError::Unavailable())` without blocking the host thread or creating a helper fiber

#### Scenario: Absolute public sleep remains unavailable
- **GIVEN** an `Instant` whose representation has no enforceable clock-domain identity
- **WHEN** a caller attempts to use a public `Core.Time.SleepUntil(Instant)` API from this change
- **THEN** no such public API SHALL be provided

### Requirement: Sleep validates a checked monotonic deadline
`Sleep` SHALL reject `duration.nanos < 0` as `InvalidDuration` before reading the clock or registering a wait. For a nonnegative duration it SHALL read the monotonic clock once; a failed or negative sample SHALL return `Unavailable` before registration. For a nonnegative sample `now`, it SHALL check `duration.nanos > I64_MAX - now` before addition and return `DeadlineOverflow` if true. Only then SHALL it compute `now + duration.nanos` and submit that absolute deadline to the existing scheduler sleep entry. These rules validate the received Duration; they do not redefine or recover overflow in duration constructors before the call.

Zero duration SHALL follow the same registration/park path and cancellation observation as a positive duration; it SHALL NOT bypass cancellation with an immediate public success return. It SHALL NOT promise a yield or scheduler fairness. A successful sleep SHALL not complete before its computed monotonic deadline, but MAY resume later due to scheduling or platform clock/wake granularity. Nanosecond storage SHALL NOT imply nanosecond wake precision, exact wake time, or ordering among equal deadlines. The canonical clock-domain requirement and scheduler timer requirement `BSP-REQ-896BA6C917E9` remain authoritative for clock separation and generation-tagged monotonic timers.

**Stable ID:** `BSP-REQ-8851DD840BC2`

#### Scenario: Negative duration is rejected before admission
- **GIVEN** a Duration containing negative nanoseconds
- **WHEN** `Sleep` is called, including from an ordinary host entry
- **THEN** it SHALL return `Error(TimerError::InvalidDuration())` without reading the clock, registering a wait, or changing the active wait count

#### Scenario: Unavailable monotonic sample
- **GIVEN** a nonnegative duration and a monotonic clock read that fails or returns a negative sample
- **WHEN** `Sleep` validates the deadline
- **THEN** it SHALL return `Error(TimerError::Unavailable())` without registration

**Planned executable evidence:** F4-V in [the design](../../design.md#f4-planned-evidence-anchors-and-execution-gates), `source_timer_sleep_deadline_validation_uses_production_helpers`, selects and invokes the unchanged private `SleepDeadlineFromSample` helper emitted from canonical Core.Time source; this does not require host clock failure, source mutation, or a replacement timer service.

#### Scenario: Deadline overflow is checked before addition
- **GIVEN** a nonnegative clock sample `now` and `duration.nanos > I64_MAX - now`
- **WHEN** `Sleep` validates the deadline
- **THEN** it SHALL return `Error(TimerError::DeadlineOverflow())` without performing the overflowing addition or registering a wait

**Planned executable evidence:** F4-V, `source_timer_sleep_deadline_validation_uses_production_helpers`, executes production `SleepDeadlineFromSample` with `now = 17` and `duration.nanos = I64_MAX - 16`, and with `now = I64_MAX` and `duration.nanos = 1`.

#### Scenario: Representable deadline boundary is admitted
- **GIVEN** a nonnegative clock sample `now` and `duration.nanos == I64_MAX - now`
- **WHEN** `Sleep` validates the deadline
- **THEN** it SHALL submit `I64_MAX` to the existing scheduler entry without classifying the request as overflow

**Planned executable evidence:** F4-V, `source_timer_sleep_deadline_validation_uses_production_helpers`, executes production `SleepDeadlineFromSample` with `now = 17` and `duration.nanos = I64_MAX - 17` and observes the exact successful deadline `I64_MAX` without parking until that deadline. Public submission and registration remain F4-S/F4-R obligations.

#### Scenario: Zero sleep observes pending cancellation
- **GIVEN** a scheduler-owned fiber with cancellation already requested and an available registration slot
- **WHEN** the fiber calls `Sleep` with zero nanoseconds
- **THEN** the registration/park path SHALL observe cancellation and return `Error(TimerError::Cancelled())` without requiring a stack switch or promising a yield

#### Scenario: Positive sleep permits scheduler delay
- **GIVEN** a valid positive duration admitted by a scheduler-owned fiber with no winning cancellation
- **WHEN** the timer completes successfully
- **THEN** completion SHALL be no earlier than its computed deadline; later resumption SHALL be permitted without an exact wake-time or equal-deadline ordering guarantee

### Requirement: Sleep maps only valid scheduler outcomes
The public facade SHALL use one manifest-owned source builtin bound to the existing `beskid_rt_v5_external_sleep_until(i64) -> usize` export and preserve its word-sized result ABI. Runtime status `4` (deadline elapsed) SHALL map to `Ok(unit)`, status `3` (cancellation winner) SHALL map to `Error(TimerError::Cancelled())`, and status `0` (unavailable admission) SHALL map to `Error(TimerError::Unavailable())`. `Unavailable` reports an admission failure without exposing its internal cause; under the derived legal-capacity invariant in `BSP-REQ-A0D58F1B3E21`, a current scheduler-owned fiber has one admissible private registration, so shared-capacity exhaustion is not a normal public outcome. Readiness/close statuses `1` and `2`, or any unknown status, SHALL be reported as an invariant failure and SHALL NOT be treated as success or a recoverable TimerError.

The facade SHALL preserve the winner chosen under scheduler requirement `BSP-REQ-A371B8519429`; a cancellation observed after a timer has already won SHALL NOT replace that operation's successful result. Fiber lifecycle cancellation remains a separate outcome under the existing Fiber contract.

**Stable ID:** `BSP-REQ-CB2C00464517`

#### Scenario: Every legal fiber can obtain its private registration
- **GIVEN** every live valid fiber has one active external wait
- **WHEN** another registration is attempted for one of those same fibers
- **THEN** it SHALL be rejected as a duplicate without publishing a partial registration or changing active accounting; a new valid fiber becomes admissible only after a terminal release makes its one registration available

#### Scenario: Deadline and cancellation winners map to typed results
- **GIVEN** a private sleep registration with one terminal winner
- **WHEN** the runtime returns status `4` or status `3`
- **THEN** the facade SHALL return `Ok(unit)` for `4` and `Error(TimerError::Cancelled())` for `3`

#### Scenario: An impossible winner fails closed
- **GIVEN** the sleep binding returns status `1`, `2`, or a value outside `0`, `3`, and `4`
- **WHEN** the facade validates the result
- **THEN** it SHALL report an invariant failure without returning success or inventing another TimerError variant

**Planned executable evidence:** F4-V, `source_timer_sleep_invalid_runtime_status_fails_closed`, selects and invokes the unchanged production `SleepResultFromStatus` helper with statuses `1`, `2`, `5`, and the maximum word-sized value in isolated child processes. Each case must observe the intended invariant diagnostic and unsuccessful termination, not merely any process failure.

#### Scenario: Timer wins before cancellation is processed
- **GIVEN** the deadline has already won a sleep registration and cancellation is processed before the fiber resumes
- **WHEN** the suspended call receives its terminal operation result
- **THEN** it SHALL retain `Ok(unit)` with no second resume or replacement winner, while a subsequent fiber cancellation point MAY independently produce the Fiber cancellation outcome

### Requirement: Sleep owns one private registration and preserves cancellation
Each admitted `Sleep` invocation SHALL own exactly one private registration in the existing owner scheduler's external-wait/timer service. Registration SHALL fully initialize owner, fiber, generation, and operation before publication or active accounting. Admission failure SHALL leave no active wait, occupied slot, or timer heap entry. The owner scheduler SHALL retain authority over mutable registration and heap state; callers SHALL receive no timer resource to clone, reset, detach, transfer, or dispose.

The existing scheduler requirements remain authoritative: owner routing `BSP-REQ-B206035816D3`, external-wait accounting `BSP-REQ-6CF93216D4C9`, sibling progress `BSP-REQ-52284EABE5E1`, timer generations `BSP-REQ-896BA6C917E9`, and one-winner completion `BSP-REQ-A371B8519429`, all in [the scheduler delta](../execution--runtime--fiber-scheduler-and-stacks/spec.md). The facade SHALL use that single register/park/release path without introducing a second timer owner, heap, worker-thread sleep, or completion loop.

Terminal completion and registration storage release SHALL remain distinct: only the winning transition removes the matching timer and decrements active accounting; the resumed call SHALL release its terminal slot before returning either success or cancellation. Runtime shutdown SHALL release surviving registrations for detached frames that will not resume, without promising user code execution or lexical disposal on abandoned stacks. Any separate scoped `Disposable` remains subject to the existing lexical cleanup contract, not timer registration cleanup.

Returning `TimerError::Cancelled()` SHALL NOT clear the fiber's sticky cancellation state or consume its `Fiber<T>` handle. Subsequent admissible waits on that fiber SHALL continue observing cancellation. The existing Join cancellation contract SHALL remain independent; a test SHALL observe a cancelled Sleep's result inside its own frame, not through the cancelled child's return value.

**Stable ID:** `BSP-REQ-75347DC0B10F`

#### Scenario: Success and cancellation release storage
- **GIVEN** a sleep reaches either its deadline winner or cancellation winner
- **WHEN** the call returns its typed result
- **THEN** its active contribution SHALL be zero and its terminal slot and timer heap entry SHALL have been released, permitting repeated calls beyond the shared table's capacity over time

#### Scenario: Cancellation remains sticky across waits
- **GIVEN** a child observes `Error(TimerError::Cancelled())` locally from an admitted Sleep
- **WHEN** it attempts another admissible Sleep and subsequently reaches a fiber cancellation point
- **THEN** the second Sleep SHALL again observe cancellation and the parent SHALL observe the existing independent Join cancellation outcome

#### Scenario: Reused registration rejects a stale cancellation
- **GIVEN** a cancelled sleep releases a slot that is reused for a fresh fiber with a new generation
- **WHEN** a late event carrying the former generation arrives
- **THEN** the new sleep SHALL remain governed by its own winner and SHALL be able to complete normally, as required by `BSP-REQ-896BA6C917E9`

#### Scenario: Runnable sibling progresses during sleep
- **GIVEN** an admitted positive sleep is pending and a sibling fiber is runnable on its owner scheduler
- **WHEN** the scheduler selects runnable work
- **THEN** the sibling SHALL run while the timer remains active, as required by `BSP-REQ-52284EABE5E1`

#### Scenario: Shutdown releases an abandoned detached timer
- **GIVEN** shutdown abandons a detached sleeping frame under the existing fiber shutdown policy
- **WHEN** the runtime cleans surviving registrations
- **THEN** it SHALL release the timer's registration and accounting without promising that the abandoned frame resumes or its unrelated lexical cleanup executes
