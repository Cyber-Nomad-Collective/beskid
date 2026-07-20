## ADDED Requirements

### Requirement: External completion is routed to the owning scheduler
Every scheduler SHALL have a stable scheduler identifier, a thread-safe inbound command queue, and an owner wake primitive. A syscall-pool worker or other external source MUST enqueue completion only to the scheduler that owns the waiting fiber and MUST wake that owner; completion MUST NOT depend on the external worker's thread-local wake queue.

**Stable ID:** `BSP-REQ-B206035816D3`

#### Scenario: Syscall worker completes an owner wait
- **GIVEN** a fiber parked on scheduler A for a syscall performed by a worker thread
- **WHEN** the worker completes the syscall
- **THEN** scheduler A is woken and resumes only its owned fiber

### Requirement: External waits suppress false deadlock
The scheduler SHALL maintain an active-external-wait count from external-work submission through that work's terminal completion or cancellation cleanup. Deadlock detection MUST report deadlock only when no runnable fibers exist, all remaining fibers are parked, and the active-external-wait count is zero.

**Stable ID:** `BSP-REQ-6CF93216D4C9`

#### Scenario: Pending syscall is not deadlock
- **GIVEN** no fiber is runnable and one fiber is parked for submitted external work
- **WHEN** the scheduler evaluates deadlock
- **THEN** it does not report deadlock while the external wait is active

### Requirement: External waits block their fiber, not the scheduler
Submitting an external wait SHALL park only the submitting fiber. The owner scheduler MUST continue to execute every other runnable fiber while the external source is pending, and the external source MUST NOT occupy a scheduler worker thread or block the scheduler run loop.

**Stable ID:** `BSP-REQ-52284EABE5E1`

#### Scenario: A second fiber runs during an external wait
- **GIVEN** fiber A is parked for an active external wait and fiber B is runnable on the same owner scheduler
- **WHEN** the scheduler selects its next runnable fiber
- **THEN** it executes fiber B before the external wait for fiber A completes

### Requirement: Monotonic timers use generation-tagged registrations
`Sleep`, timeout, and deadline waits SHALL use monotonic absolute deadlines. Every timer registration and cancellation MUST carry a generation that makes an obsolete fire harmless; wall-clock changes MUST NOT advance, delay, or reclassify a monotonic deadline.

**Stable ID:** `BSP-REQ-896BA6C917E9`

#### Scenario: Cancelled timer fires late
- **GIVEN** a timer registration is cancelled and its slot is reused with a new generation
- **WHEN** an event for the cancelled generation arrives
- **THEN** it does not wake or complete the new registration

### Requirement: Each wait has exactly one winner
Every wait operation SHALL centralize completion in one atomic winner transition shared by readiness, close, cancellation, timeout, and duplicate-wake paths. The winning transition MUST resume the fiber once and schedule idempotent cleanup; every losing transition MUST perform no user-visible completion.

**Stable ID:** `BSP-REQ-A371B8519429`

#### Scenario: Timeout races readiness
- **GIVEN** readiness and timeout are delivered for the same wait
- **WHEN** they race to complete it
- **THEN** exactly one terminal outcome resumes the fiber and the other outcome performs no second resume
