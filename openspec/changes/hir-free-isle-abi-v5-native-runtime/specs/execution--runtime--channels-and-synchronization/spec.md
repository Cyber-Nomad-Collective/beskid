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

### Requirement: Canonical hub owns a 256-registration registry

A canonical hub SHALL own separately allocated state through the scheduler-owned
state graph and support at least 256 registrations per hub. Registration SHALL
replace an existing registration for the same user index without duplicating
that index, and dispatch SHALL use a deterministic round-robin cursor across
the registered entries. Hub state MUST NOT be derived from a literal offset
from `BeskidRuntimeState` or silently truncate registrations below the
normative capacity.

#### Scenario: Hub replaces registrations at normative capacity

- **GIVEN** a canonical hub with 256 registered user indices
- **WHEN** one existing user index is registered with a replacement callback
- **THEN** the registry remains at 256 entries, dispatch observes the
  replacement through round-robin order, and the hub state does not alias any
  other scheduler-owned synchronization state

### Requirement: Canonical hub preserves ordered replacement and removal

A hub registration SHALL be identified by its user index. Registering an
already registered user index SHALL replace only that entry's callback in its
existing position; it SHALL NOT append a duplicate, change the registry
length, or reset the round-robin cursor. Removing a registration SHALL retain
the relative order of every remaining registration; swap removal is
non-conforming. Dispatch SHALL begin at the current cursor, visit each
registration at most once in circular registration order, and advance the
cursor to the entry after the final dispatched entry. An empty hub SHALL report
the canonical empty result without invoking a callback, and removal of an
absent user index SHALL report the canonical not-found result without mutating
the registry or cursor.

#### Scenario: Hub keeps stable round-robin order across replacement and removal

- **GIVEN** a hub whose user indices are registered in order `10`, `20`, and
  `30`, with its next dispatch beginning at `20`
- **WHEN** index `20` is replaced, index `10` is removed, and the hub is
  dispatched twice
- **THEN** the first dispatch visits the replacement for `20` then `30`, the
  second dispatch begins with `20`, no duplicate or reordered entry appears,
  and the cursor changes only according to completed dispatches

### Requirement: Canonical hub uses scheduler-owned result and wait state

Hub wait, receive-result, cancellation, and teardown state SHALL be owned by
the canonical scheduler state graph together with the hub's registry. A
blocking hub operation SHALL publish its result record before waking its fiber,
and the matching result accessors SHALL read that same record. Cancellation,
teardown, empty, and not-found outcomes SHALL be distinguishable canonical
results. The hub SHALL use the canonical cooperative park/wake transition and
MUST NOT poll channel receive state or execute a generated Beskid callback from
a blocking worker.

#### Scenario: Hub wake publishes a stable result

- **GIVEN** a fiber parked on a hub operation and a second fiber that completes
  that operation
- **WHEN** the completing fiber publishes a value and wakes the parked fiber
- **THEN** the resumed fiber observes the published result through the hub
  accessors exactly once, cancellation and teardown remain distinguishable,
  and no polling or worker-side callback execution occurs

### Requirement: Canonical events use field-owned ABI state

Canonical field-defined events SHALL lazily own their subscription state rather
than use a process-global runtime-state table. The field slot is the sole
identity and owner of its event state: separately allocated subscription state
SHALL be zero-initialized on first subscription, retained by that slot, and
remain distinct from every other event field and scheduler synchronization
object. `subscribe(field_slot, handler, capacity)` SHALL return the resulting
subscription length; its capacity is the field declaration's resolved capacity
contract, and a full field SHALL report the canonical capacity outcome without
overwriting or silently dropping a handler. `unsubscribe(field_slot, handler)`
SHALL remove the first matching handler and return `1` or return `0` when
absent; `len(state)` and `get(state,index)` SHALL expose the ordered
subscription state. Fixed global capacity, literal runtime-state-offset
addressing, and pop-last unsubscribe behavior are non-conforming.

#### Scenario: Event ABI preserves ordered subscriptions

- **GIVEN** a field-defined event with multiple handlers including duplicates
- **WHEN** handlers are subscribed, one matching handler is unsubscribed, and
  the event state is lowered through syntax, ISLE, and verified CLIF
- **THEN** only the first matching handler is removed, length and indexed lookup
  preserve order, and no global literal-offset backing state is accessed

### Requirement: Canonical events preserve field order and raising-fiber execution

Event subscription order SHALL be the order in which handlers were successfully
subscribed to that field, after the stable first-match removal rule. Raising a
field event under the default host profile SHALL snapshot no alternate global
subscriber table, invoke the current ordered handlers on the raising fiber,
and preserve the language event contract that a handler MUST NOT self-join.
An empty field event SHALL be a successful no-op. A host profile that changes
fairness or failure handling SHALL declare that behavior without changing field
ownership or ABI identity.

#### Scenario: Event raise follows the owning field's current order

- **GIVEN** two event fields with independently subscribed handlers and one
  field has handlers `A`, `B`, `A`
- **WHEN** the first `A` is unsubscribed and that field is raised by fiber `7`
- **THEN** only that field invokes `B` then the remaining `A`, both run on
  fiber `7`, the other field is unchanged, and raising an empty field invokes
  no handler

### Requirement: Canonical callbacks own manifest-declared per-runtime state

The canonical callback implementation SHALL allocate a zero-initialized
callback-and-handler registry separately for each initialized
`BeskidRuntimeState` and retain it only through a manifest-declared runtime
state field or manifest-declared object reachable from that state. Repeated
initialization for the same runtime SHALL reuse that registry; registries for
distinct runtime states SHALL remain distinct. Callback or handler state MUST
NOT be addressed through a literal `BeskidRuntimeState` offset, a process-global
table, a TLS-only substitute, or storage shared with another synchronization
facility.

`beskid_register_callbacks` and `beskid_register_handlers` SHALL validate the
manifest-derived FFI table layout, ABI or user-FFI layout band, pointer/count
range, and every entry before publishing a replacement registry. A rejected
registration SHALL return its canonical failure status and preserve the prior
registry unchanged. A successful registration SHALL publish one complete,
deterministic snapshot: duplicate callback identities and duplicate handler
keys SHALL have the manifest-defined replacement result rather than leave
multiple competing entries. `beskid_register_handlers` SHALL install the
validated handler registry; a no-op success path is non-conforming.

#### Scenario: Callback registries do not alias runtime state or each other

- **GIVEN** two initialized ABI-v5 runtime states surrounded by sentinel bytes
  and valid callback and handler registration tables
- **WHEN** each state registers its tables, one state re-registers a replacement,
  and the other receives an invalid registration
- **THEN** each state retains a distinct manifest-owned registry, the replacement
  is visible only in its owning state, the invalid registration leaves its prior
  registry unchanged, and no sentinel, literal-offset storage, global table, or
  unrelated synchronization object is written

### Requirement: Canonical callback entry establishes a runtime scope

Every callback or handler trampoline published by the canonical registry SHALL
resolve the selected canonical target exactly once, enter the owning runtime's
TLS/root-frame scope before invoking Beskid code, and leave that scope on every
normal or unwind-safe exit. Nested entry on the same native thread SHALL retain
the outer scope and preserve the normal GC/root and Phase-A mutator rules. An
unregistered, stale, mismatched-layout, or detached-runtime callback invocation
SHALL fail closed without calling an arbitrary function pointer or fabricating a
successful callback result.

#### Scenario: Re-entrant callback uses the owning runtime scope

- **GIVEN** a callback registered for one initialized runtime while another
  runtime has a different callback registry
- **WHEN** foreign code invokes that callback and the callback re-enters Beskid
  code once
- **THEN** both entries use the first runtime's TLS/root scope, nested entry
  preserves the outer scope, no registry from the second runtime is consulted,
  and an unregistered callback is rejected before Beskid code executes

### Requirement: Callback lowering and artifacts have canonical provenance

Canonical callback operations SHALL originate in the embedded
`Runtime/Host/Callbacks.bd` corpus and lower; this includes registration,
handler installation, and trampoline entry.
from syntax-owned facts through `TypedProgram`, `CodegenInput`, ISLE, and
verified CLIF. Their generated calls and runtime-kit exports SHALL use only
manifest-authorized ABI-v5 symbols, layouts, and trusted intrinsics. Runtime
kit, JIT, AOT, and installed-prefix tests MUST reject a Rust callback registry,
`beskid_runtime` or bridge callback object, generated Rust dispatch table,
legacy envelope/tag router, HIR lowering, or a host fallback.

#### Scenario: Callback fixture rejects legacy registration provenance

- **GIVEN** a syntax-owned fixture that registers callbacks and handlers,
  replaces an entry, enters through a trampoline, and rejects an invalid table
- **WHEN** it is compiled into an exact installed ABI-v5 kit through the
  production lowering path and the resulting CLIF and artifacts are audited
- **THEN** CLIF verifies with canonical source attribution, the runtime behavior
  uses the manifest-owned registry, and the audit rejects HIR, Rust-runtime,
  bridge, generated-dispatch, envelope, tag-router, and host-fallback
  provenance

### Requirement: Hub and event lowering has canonical provenance only

Hub and event operations SHALL lower from syntax-owned facts through
`TypedProgram`, `CodegenInput`, ISLE, and verified CLIF, using only
manifest-authorized canonical runtime calls. Produced runtime kits and
conformance artifacts MUST NOT link, invoke, or fall back to HIR lowering,
the Rust `beskid_runtime` crate, generated Rust dispatch tables, bridge
dispatch, or a process-global event table.

#### Scenario: Hub and event artifact rejects legacy dispatch

- **GIVEN** a fixture that registers, removes, waits on, subscribes to, and
  raises canonical hub and event state
- **WHEN** the production runtime artifact is built and its provenance is
  verified
- **THEN** verification accepts the canonical Beskid and approved assembly
  provenance only and rejects HIR, Rust-runtime, generated-dispatch, bridge,
  and global-table symbols
