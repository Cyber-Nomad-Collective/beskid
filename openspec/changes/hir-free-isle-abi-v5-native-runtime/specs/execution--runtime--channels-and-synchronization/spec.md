## ADDED Requirements

### Requirement: Canonical ABI-v5 synchronization runtime implementation

The channel, hub, mutex, and wait-group ABI surfaces SHALL be implemented by
the canonical Beskid runtime corpus and exported only through the
manifest-derived ABI-v5 runtime kit. Their observable contracts remain those
defined by this capability; implementation and test anchors SHALL NOT require
the Rust `beskid_runtime` crate.

#### Scenario: Synchronization builtin provenance

- **GIVEN** an exact ABI-v5 runtime kit
- **WHEN** a conformance test resolves a synchronization builtin
- **THEN** the artifact verifier finds canonical runtime and approved assembly
  provenance only, with no Rust runtime archive or bridge fallback

### Requirement: Canonical synchronization state has declared ownership

Canonical channel, mutex, waitgroup, hub, event, and callback state SHALL be
separately allocated, zero-initialized, and owned through a manifest-declared
runtime object or scheduler-owned state graph. These facilities MUST NOT derive
backing storage from an undeclared literal offset from `BeskidRuntimeState`, or
overlap another facility's state.

#### Scenario: Independent synchronization initialization preserves bounds

- **GIVEN** a runtime state surrounded by sentinel bytes and each canonical
  synchronization facility is initialized
- **WHEN** initialization is repeated
- **THEN** every facility reuses its own non-null owned state, no state aliases
  another facility, and no byte outside a manifest-declared object is modified

### Requirement: Canonical synchronization preserves cooperative wake semantics

Channel, mutex, waitgroup, hub, event, and callback operations SHALL park and
wake fibers through the one canonical scheduler state machine, preserve their
documented happens-before relationships, and make cancellation and teardown
observable without a lost wakeup. A blocking worker MUST NOT mutate canonical
synchronization state on behalf of generated Beskid code.

#### Scenario: Canonical synchronization lowers and runs without fallback state

- **GIVEN** a syntax-owned fixture that sends, receives, locks, signals, waits,
  cancels, and tears down canonical synchronization objects
- **WHEN** it lowers through `TypedProgram`, `CodegenInput`, ISLE, and CLIF verification
- **THEN** the fixture uses only manifest-authorized ABI calls, progresses via
  cooperative park/wake transitions, and contains no HIR, Rust-runtime, or
  undeclared runtime-state-offset fallback

### Requirement: Canonical mutex has owned contention state

A canonical mutex SHALL own a separately allocated, zero-initialized contention
state object through the scheduler-owned state graph. Lock, unlock, and
contention operations MUST NOT address storage derived from a literal offset
from `BeskidRuntimeState`. The initial safety slice SHALL preserve the existing
non-reentrant lock contract and make the owned mutex state distinct from Channel
state; cooperative parking and wake behavior remains required before full
conformance is claimed.

#### Scenario: Mutex initialization does not alias channel state

- **GIVEN** an initialized runtime scheduler and canonical Channel state
- **WHEN** a canonical mutex initializes and contends
- **THEN** its non-null owned state is distinct from the Channel state, remains
  stable on repeated initialization, and no write occurs outside declared state
  objects

### Requirement: Canonical wait groups own an exact waiter registry

A canonical wait group SHALL own separately allocated, zero-initialized state
through the scheduler-owned state graph. Its state SHALL record all registered
waiters without a hard-coded capacity that contradicts its public contract;
`add`, `done`, and `wait` SHALL preserve a non-negative count and wake each
registered waiting fiber exactly once when the count reaches zero. Wait-group
state MUST NOT be derived from a literal offset from `BeskidRuntimeState`.

#### Scenario: Wait group owns and wakes its registered waiters

- **GIVEN** an initialized scheduler, Channel state, Mutex state, and a wait group
- **WHEN** fibers register as waiters, the count is incremented and decremented to zero
- **THEN** the wait-group state is distinct from every other synchronization state,
  each registered waiter becomes runnable once, and no write occurs outside
  declared state objects
