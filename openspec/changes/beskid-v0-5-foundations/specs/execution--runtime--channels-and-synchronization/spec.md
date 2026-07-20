## ADDED Requirements

### Requirement: Channels transport traced ABI values
`Channel<T>` SHALL store each queued value, parked sender value, and delivered receiver value in the canonical traced ABI-value representation. The runtime MUST apply the GC write barrier to every replacement or removal that can change a traced reference, and MUST NOT reduce generic values to scalar words. The representation MUST preserve scalar values, heap references, aggregates, and opaque resource handles.

**Stable ID:** `BSP-REQ-D00CFBE68D28`

#### Scenario: Aggregate value survives a collection
- **GIVEN** a `Channel<u8[]>` containing a queued array
- **WHEN** collection runs before a receiver dequeues it
- **THEN** the receiver obtains the original array value

#### Scenario: Opaque resource is transported once
- **GIVEN** a `Channel<OwnedResource>` containing one Foundation-local opaque disposable fixture
- **WHEN** one receiver dequeues the handle
- **THEN** exactly that receiver obtains the handle without implicit disposal or duplication

### Requirement: Channel send commit and cancellation transfer ownership
A send SHALL have a single commit point under the channel lock. Before commit, cancellation MUST retain ownership in the sender and return `ChannelError::Cancelled`; after commit, cancellation MUST return `ChannelError::Cancelled` while ownership remains with the channel until exactly one receive transfers it. A woken sender or receiver MUST recheck the commit state under the channel lock before completing.

**Stable ID:** `BSP-REQ-6D7DDA9E739B`

#### Scenario: Cancellation before send commit
- **GIVEN** a bounded full channel and a sender parked with a resource value
- **WHEN** cancellation wins before the sender commits
- **THEN** the sender receives `ChannelError::Cancelled` and retains the resource value

#### Scenario: Cancellation after send commit
- **GIVEN** a sender whose value has committed to the channel queue
- **WHEN** cancellation wins before that sender reports completion
- **THEN** the sender receives `ChannelError::Cancelled` and a later receive transfers the committed value exactly once

### Requirement: Channel close drains committed values
`Close` SHALL reject new sends with `ChannelError::Closed` without discarding committed values. Receives MUST continue to dequeue committed values in queue order; a receive on a closed and empty channel MUST return `ChannelError::Closed`. Channel close MUST NOT dispose a value or resource merely because it remains queued.

**Stable ID:** `BSP-REQ-3B24A87BD7B8`

#### Scenario: Close after enqueue
- **GIVEN** a channel containing two committed values
- **WHEN** the owner closes the channel
- **THEN** two receives succeed in queue order and the next receive returns `ChannelError::Closed`

### Requirement: Channel parking releases queue ownership
A sender or receiver that cannot proceed SHALL release the channel mutex before parking. After wake, it MUST reacquire the mutex and re-evaluate capacity, close, cancellation, and commit state before transferring a value or reporting completion.

**Stable ID:** `BSP-REQ-987344126476`

#### Scenario: Receiver frees bounded capacity
- **GIVEN** a bounded full channel with one sender waiting to enqueue
- **WHEN** a receiver removes one value
- **THEN** the sender can re-evaluate capacity and commit without mutex starvation
