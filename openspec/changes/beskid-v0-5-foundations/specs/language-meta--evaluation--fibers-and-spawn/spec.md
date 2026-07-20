## ADDED Requirements

### Requirement: Bindable spawn produces a rooted Fiber<T>
`spawn` SHALL be an expression whose type is `Fiber<T>`, where `T` is the resolved return type of its callable or block. The compiler and runtime MUST preserve the callable result slot and every capture root until the fiber reaches a terminal state. A discarded `spawn` expression MUST produce a diagnostic unless the source explicitly calls `Detach` on the resulting handle.

**Stable ID:** `BSP-REQ-075328D8F9ED`

#### Scenario: Aggregate child result is joined
- **GIVEN** `Fiber<i64[]> child = spawn BuildValues();`
- **WHEN** `child.Join()` completes successfully after a collection cycle
- **THEN** it returns the complete `i64[]` result as `Result<i64[], FiberError>`

#### Scenario: Non-detached handle is discarded
- **GIVEN** a statement-form `spawn BuildValues();` whose result is not explicitly detached
- **WHEN** semantic analysis completes
- **THEN** the compiler reports a diagnostic for the discarded non-detached `Fiber<T>` handle

### Requirement: Spawn captures require transferable roots
A spawned closure SHALL capture only values represented by a transferable ABI value or a heap-rooted capture environment. The compiler MUST reject a capture that transfers a stack reference with `StackReferenceEscapesSpawn`; the runtime MUST enumerate every accepted capture environment and result slot as GC roots for the full fiber lifetime.

**Stable ID:** `BSP-REQ-EBF704693274`

#### Scenario: Heap capture survives collection
- **GIVEN** a spawned closure capturing a heap `u8[]`
- **WHEN** collection runs before the closure reads the capture
- **THEN** the closure receives the original array value

#### Scenario: Stack reference capture is rejected
- **GIVEN** a spawned closure that captures a reference to a caller stack local
- **WHEN** the closure is type-checked
- **THEN** compilation fails with `StackReferenceEscapesSpawn`

### Requirement: Fiber terminal operations consume one handle state
`Join`, `Detach`, and `Cancel` SHALL operate on one move-only fiber-handle state machine. `Join` MUST consume the handle and return exactly one terminal `Result<T, FiberError>`; a second `Join` or a `Join` after `Detach` MUST be rejected by semantic use-after-move analysis. `Detach` MUST consume the handle and return `unit`. `Cancel` MUST return `unit`, remain idempotent, request cancellation without consuming the handle, and cause a later successful `Join` to return `FiberError::Cancelled()` when cancellation wins before normal completion. The child-panic terminal status is the exact `i64` value `2`; a child panic MUST cause `Join` to return `FiberError::Panicked(2)`.

**Stable ID:** `BSP-REQ-8CE166C9D003`

#### Scenario: Join consumes the join capability
- **GIVEN** a completed non-detached `Fiber<i64>`
- **WHEN** its owner invokes `Join` twice
- **THEN** the first call returns its terminal result and semantic analysis rejects the second use of the consumed handle

#### Scenario: Cancel wins before completion
- **GIVEN** a running `Fiber<unit>` that observes cancellation before producing a result
- **WHEN** its owner calls `Cancel` and then `Join`
- **THEN** `Join` returns `FiberError::Cancelled()`

#### Scenario: Join after detach is rejected
- **GIVEN** a `Fiber<i64>` whose owner has successfully invoked `Detach`
- **WHEN** the owner invokes `Join`
- **THEN** semantic analysis rejects the use of the detached, consumed handle

#### Scenario: Child panic has a typed terminal outcome
- **GIVEN** a child fiber that terminates by panic
- **WHEN** its owner invokes `Join`
- **THEN** `Join` returns `FiberError::Panicked(2)`

### Requirement: Non-detached children complete during main shutdown
When `main` returns, the runtime SHALL join every child fiber of `main` that has not been detached before stopping scheduler workers. A detached child MUST NOT delay shutdown, and an unjoined detached-child panic MUST abort the process.

**Stable ID:** `BSP-REQ-14D405F2C1C7`

#### Scenario: Main waits for an owned child
- **GIVEN** `main` has spawned a non-detached child that has not completed
- **WHEN** `main` returns
- **THEN** scheduler shutdown waits for that child to reach a terminal state before worker shutdown
