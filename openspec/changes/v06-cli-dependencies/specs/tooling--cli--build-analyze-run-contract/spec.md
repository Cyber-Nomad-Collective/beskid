## MODIFIED Requirements

### Requirement: Line-oriented command progress
Pipeline commands SHALL report bounded progress and readable phase trees without alternate-screen or raw input. TTY in-place bars SHALL leave readable final summaries and return without keypress. Non-TTY and --plain streams SHALL be deterministic newline-delimited output without cursor controls. Only explicit dev project graph --tui SHALL permit full-screen interaction.

#### Scenario: Interactive build returns after completion
- **GIVEN** interactive project build
- **WHEN** build finishes
- **THEN** control returns with readable summary without keypress

#### Scenario: Plain build is machine-readable
- **GIVEN** redirected project build
- **WHEN** build finishes
- **THEN** progress has no cursor controls and is emitted to stderr

## ADDED Requirements

### Requirement: Check and manifest validation
Check SHALL perform semantic checking through shared generation-bound analysis without producing a linked executable. Check/build/run/test SHALL validate selected manifests and fail required unresolved dependencies before executable lowering; they SHALL NOT silently upgrade valid pins.

#### Scenario: Semantic check
- **GIVEN** a project with a semantic error
- **WHEN** check runs
- **THEN** a shared diagnostic is emitted with status 1 and no linked executable

#### Scenario: Unresolved project
- **GIVEN** a required dependency cannot resolve
- **WHEN** build/run/test/check runs
- **THEN** the operation fails before executable lowering rather than succeeding with a warning

### Requirement: Program arguments streams and outcome
Run SHALL accept trailing -- arguments preserving OsString argument boundaries, including empty values, spaces, Unicode and leading dashes. It SHALL inherit stdin and preserve independent child stdout/stderr bytes without mixing progress into stdout. It SHALL forward cancellation, reap the child and propagate numeric child status; Unix signal termination SHALL map to 128+signal and Windows cancellation to 130. Successful ordinary execution SHALL NOT impose an undocumented unconditional 60-second timeout. Captured internal execution SHALL drain both pipes concurrently. Linker, subprocess and interrupted test failures SHALL NOT report success.

#### Scenario: CLI06-03 Boundaries and status
- **GIVEN** a program reading stdin and argv and exiting 7
- **WHEN** run -- passes empty, spaced and leading-dash arguments
- **THEN** arguments/stdin arrive unchanged, streams remain separate and CLI exits 7

#### Scenario: CLI06-03 Large output
- **GIVEN** a child writes more than pipe capacity to both streams
- **WHEN** run executes it
- **THEN** both outputs complete without deadlock or dropped bytes

#### Scenario: CLI06-03 Cancellation
- **GIVEN** a running child
- **WHEN** the user interrupts run
- **THEN** the child is interrupted and reaped and CLI returns the specified nonzero cancellation status


### Requirement: Native test execution shares one compiled selected closure
Test SHALL execute through AOT native objects and the exact verified ABI-v5 runtime kit. For each target it SHALL lower the union of selected, non-skipped test entrypoints once and compile shared reachable functions once into one common object. Unselected unreachable tests SHALL NOT acquire execution authority. Each test SHALL run in a fresh process with canonical runtime initialization and termination. Assertion or panic failure SHALL be captured without preventing subsequent selected tests. Target and matrix timeout or cancellation SHALL terminate and reap the active child and report remaining unexecuted tests distinctly. Test execution SHALL NOT initialize a JIT engine or rebuild a compilation database per test.

#### Scenario: CLI06-NATIVE-TEST-UNION Shared reachable helper
- **GIVEN** two selected tests sharing a helper and an unreachable unselected function
- **WHEN** the target is prepared and executed
- **THEN** one common object contains both selected entries and one helper compilation, omits the unreachable function, and each selected entry runs exactly once

#### Scenario: CLI06-NATIVE-TEST-FAILURE Failure isolation
- **GIVEN** a failing assertion followed by a passing selected test
- **WHEN** native tests execute
- **THEN** the first process failure is reported and the second test runs in a fresh runtime process

#### Scenario: CLI06-NATIVE-TEST-BUDGET Active child budget
- **GIVEN** a selected test exceeding the execution budget
- **WHEN** the budget expires or execution is cancelled
- **THEN** the child is terminated and reaped and remaining tests are reported as unexecuted because of budget or cancellation

### Requirement: Native preparation deadlines cover contained tool processes
Selected native test compilation, object emission, bootstrap compilation, linking and execution SHALL share one absolute target/matrix deadline and cancellation state. Each spawned native tool or test SHALL belong to a descendant containment boundary established before it executes; deadline, cancellation, error and leader exit SHALL terminate that boundary and reap the direct child before returning. Unix process groups and Windows suspended-spawn job assignment SHALL implement this boundary without a direct-child-only fallback. Preparation SHALL report existing pipeline progress. Synchronous compiler work that cannot be preempted SHALL retain checks before and after the serviced call and SHALL NOT be described as a hard interruptible phase.

#### Scenario: CLI06-NATIVE-TREE Native descendant deadline
- **GIVEN** a native tool or test that spawns a sleeping descendant
- **WHEN** its shared absolute deadline expires
- **THEN** its containment boundary terminates the descendant and reaps the direct child before the phase returns

#### Scenario: CLI06-NATIVE-CANCEL Shared cancellation
- **GIVEN** an active native preparation phase and the shared cancellation state
- **WHEN** cancellation is requested
- **THEN** the phase terminates its process tree and returns a cancellation diagnostic without resetting the deadline for a later phase

#### Scenario: CLI06-NATIVE-PROGRESS Union compilation
- **GIVEN** selected tests with a shared callee
- **WHEN** their reachable union is compiled
- **THEN** one existing pipeline progress observer reports the union preparation and shared object emission

### Requirement: Matrix supervision cancels active native descendants before worker termination
The matrix supervisor SHALL own a private cancellation channel for its worker. Deadline, supervision error or supervisor-channel closure SHALL request the worker's shared cancellation state so an active native containment boundary can terminate and reap its child before worker exit. Supervisor cleanup SHALL provide a bounded grace interval and SHALL reap the worker on every return path. A hard stop after that grace SHALL remain available for synchronous compiler work that cannot service cancellation; it SHALL NOT substitute for cleanup of an active native test process.

#### Scenario: CLI06-MATRIX-NATIVE-CANCEL Parent deadline precedes target deadline
- **GIVEN** a matrix worker executing an observed endless native test and a matrix deadline earlier than its target deadline
- **WHEN** the supervisor reaches the matrix deadline
- **THEN** it signals shared cancellation, waits only the bounded cleanup grace, reaps the worker and leaves no running native test process

#### Scenario: CLI06-MATRIX-PARENT-EXIT Parent channel closes
- **GIVEN** a matrix worker and its private supervisor channel
- **WHEN** the supervisor exits or an error closes the channel
- **THEN** the worker receives cancellation without a signal handler or a second deadline reset
