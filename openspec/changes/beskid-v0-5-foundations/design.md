## Context

Foundation is the sole async and resource-lifetime substrate for v0.5. A child computation has one `Fiber<T>` handle; a generic value crosses fibers through one traced ABI-value record; an external event reaches one owner scheduler; and a resource is cleaned by one lexical `use` path. Networking and HTTP add no alternate path.

Foundation excludes native-handle representation, network address and type contracts, TCP, UDP, and DNS, which CYB-61 owns. It also excludes HTTP framing, routing, server lifecycle, and HTTP APIs, which CYB-62 owns.

## Decisions

### One implementation path per construct

| Construct | Canonical v0.5 path | Deleted or prohibited path |
| --- | --- | --- |
| Spawn result and captures | `spawn` expression -> `Fiber<T>` -> rooted capture environment and typed ABI result slot | Scalar result truncation and unrooted capture storage |
| Generic channel value | One traced ABI-value record for queue, parked sender, and delivery | `VecDeque<i64>` or pointer-only side path |
| External completion | Source -> owner scheduler inbound command -> owner wake -> atomic operation completion | TLS-local wake queues on syscall workers |
| Timed wait | Monotonic absolute deadline plus generation-tagged registration -> atomic winner | Wall-clock deadline and independent timeout completion |
| Scoped cleanup | Parser scoped-binding node -> lexical ownership -> reverse-order exactly-once `Dispose` edges | Treating `use Type name = value` as a module import, adding a `using` alias, or ad hoc cleanup on selected exits; ordinary `use Package.Module;` imports remain supported |
| Partial I/O | `Core.IO.Reader` / `Writer` / `Closer` / `Stream` | Per-consumer read/write loops with divergent EOF or no-progress behavior |

### Ownership and terminal-state model

A fiber handle has one lifecycle state. `Join` and `Detach` consume competing terminal capabilities; `Cancel` requests cancellation idempotently. A channel send has one commit point: the sender owns before it, the channel owns after it, and exactly one successful receive transfers ownership to its receiver. Channel close blocks new commits but drains already committed values.

Every external wait uses one atomic winner transition. Readiness, close, cancellation, timeout, and duplicate wake compete only at that transition. The winner resumes the fiber once and runs idempotent cleanup; losers do not produce a user-visible completion.

### Scoped disposal and error handling

`use Type name = expression;` is a dedicated lexical binding and is grammatically distinct from the preserved `use Package.Module;` import form. The bound type must implement `Disposable.Dispose() -> Result<unit, DisposeError>`; it cannot escape. Its enclosing callable must return `Result<T, E>`, and semantic analysis must resolve exactly one explicit cleanup conversion from `DisposeError` to `E` (identity when `E` is `DisposeError`). Missing, ambiguous, and non-`Result` cases are diagnostics; this relation does not create a general postfix-`?` coercion. Generated ISLE lowering emits cleanup for normal completion, `return`, postfix `?`, and every supported structured exit, in reverse declaration order. Cleanup result propagation follows the existing `Result` path; it neither panics nor becomes an implicit exception.

### Observability, security, and source of truth

- Scheduler diagnostics MUST identify owner scheduler ID, wait registration generation, winner source, and active-external-wait count in runtime conformance output.
- Runtime conformance MUST report a fiber or channel invariant failure with the relevant operation state; it MUST NOT silently retry a duplicate completion.
- Strict UTF-8, Base64, and Hex validation rejects malformed input without lossy replacement, preventing ambiguous protocol payloads from entering networking and HTTP.
- `openspec/specs` remains the sole normative source after this change is applied. This change directory is proposed delta material only; the catalog remains derived and is intentionally not regenerated here.

### Evidence matrix

Evidence targets are implementation anchors, not additional normative behavior. `P` is parser, `S` semantic, `R` runtime, `C` corelib, `J` JIT, `A` AOT, and `N` native runtime-kit evidence. A dash means the component has no implementation responsibility for that requirement; the named target in another column owns proof.

| Stable requirement ID | P | S | R | C | J | A | N |
| --- | --- | --- | --- | --- | --- | --- | --- |
| BSP-REQ-075328D8F9ED | `analysis::spawn` binding fixture | spawn type diagnostic fixture | `spawn_scheduler` aggregate-root test | Fiber generic parity test | spawn aggregate fixture | spawn aggregate fixture | runtime-kit spawn smoke |
| BSP-REQ-EBF704693274 | capture parser snapshot | `StackReferenceEscapesSpawn` fixture | GC capture stress | Fiber capture API fixture | capture JIT fixture | capture AOT fixture | root enumeration smoke |
| BSP-REQ-8CE166C9D003 | - | lifecycle misuse diagnostics | `spawn_scheduler` terminal-state test | Fiber lifecycle tests | Fiber parity fixture | Fiber parity fixture | scheduler smoke |
| BSP-REQ-14D405F2C1C7 | - | - | `spawn_scheduler` shutdown test | Fiber shutdown test | shutdown fixture | shutdown fixture | runtime-kit shutdown smoke |
| BSP-REQ-D00CFBE68D28 | - | generic channel type fixture | `gc_concurrency` value matrix | Channel aggregate/resource tests | channel JIT fixture | channel AOT fixture | ABI value smoke |
| BSP-REQ-6D7DDA9E739B | - | - | `concurrency` cancellation-race test | Channel ownership tests | channel JIT fixture | channel AOT fixture | scheduler race smoke |
| BSP-REQ-3B24A87BD7B8 | - | - | `concurrency` close-drain test | Channel close tests | channel JIT fixture | channel AOT fixture | runtime-kit drain smoke |
| BSP-REQ-987344126476 | - | - | `phase_b_concurrency` backpressure test | Channel backpressure test | channel JIT fixture | channel AOT fixture | scheduler lock-progress smoke |
| BSP-REQ-B206035816D3 | - | - | cross-thread owner-wake test | - | syscall completion fixture | syscall completion fixture | native scheduler smoke |
| BSP-REQ-6CF93216D4C9 | - | - | external-wait deadlock test | - | scheduler fixture | scheduler fixture | native scheduler smoke |
| BSP-REQ-52284EABE5E1 | - | - | external-wait non-blocking test | - | scheduler fixture | scheduler fixture | native scheduler smoke |
| BSP-REQ-896BA6C917E9 | - | - | timer cancellation test | Time `Sleep` tests | timer fixture | timer fixture | native timer smoke |
| BSP-REQ-A371B8519429 | - | - | repeated race-matrix test | - | wait race fixture | wait race fixture | native race smoke |
| BSP-REQ-6DA154A4738C | spawn parser snapshots | typed spawn binding fixture | - | - | parser-to-JIT fixture | parser-to-AOT fixture | - |
| BSP-REQ-49672AF267D1 | use parser snapshots | scoped-binding diagnostics | - | - | parser-to-JIT fixture | parser-to-AOT fixture | - |
| BSP-REQ-91BA42B54DE1 | use parser snapshots | disposable/escape diagnostics | cleanup-edge tests | Disposable corelib tests | use cleanup fixture | use cleanup fixture | native cleanup smoke |
| BSP-REQ-8E1AF054C89D | - | - | `bytes_copy` overlap test | Bytes unit tests | bytes JIT fixture | bytes AOT fixture | bytes builtin smoke |
| BSP-REQ-391C7C5A5DD6 | - | - | cursor builtin bounds test | Bytes cursor tests | cursor JIT fixture | cursor AOT fixture | bytes builtin smoke |
| BSP-REQ-6B3A72539DE6 | - | - | - | UTF-8 invalid-input matrix | encoding JIT fixture | encoding AOT fixture | encoding smoke |
| BSP-REQ-C1442592D817 | - | - | - | Hex/Base64 invalid-input matrix | encoding JIT fixture | encoding AOT fixture | encoding smoke |
| BSP-REQ-F61E094A4838 | - | lifecycle misuse diagnostics | `spawn_scheduler` state test | Fiber lifecycle tests | Fiber parity fixture | Fiber parity fixture | scheduler smoke |
| BSP-REQ-AF2C1DDC351E | - | generic resource channel fixture | resource drain test | Channel resource tests | resource channel fixture | resource channel fixture | ABI value smoke |
| BSP-REQ-F25A4DF4DEA0 | - | contract-resolution fixture | - | Core.IO and Disposable tests | IO JIT fixture | IO AOT fixture | IO smoke |
| BSP-REQ-277D7253AE0E | - | syscall typecheck regression | ReadBytes builtin signature test | Syscall corelib test | syscall JIT fixture | syscall AOT fixture | ABI signature smoke |
| BSP-REQ-0A5892A2DB9C | - | Core.IO API-shape fixture | - | public API and transfer tests | IO JIT fixture | IO AOT fixture | IO smoke |

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| A scalar ABI path remains reachable | Require the same generic aggregate/resource fixture through JIT, AOT, and native evidence; delete rather than adapt the scalar queue. |
| A duplicate event resumes a fiber twice | Make the atomic winner transition the only completion API and stress readiness/cancel/timeout races. |
| A resource leaks or closes twice in channel and `use` paths | Assert explicit ownership at every channel boundary and exactly-once reverse cleanup at every supported lexical exit. |
| Wall clock changes affect network deadlines | Permit only monotonic absolute deadlines in scheduler registration. |
| Invalid encodings become protocol ambiguity | Use strict validators and a non-ASCII-rejecting HTTP helper before networking/HTTP work begins. |

## Open Questions

### FiberError narrowing contradicts the closed-type guarantee

The concurrency-package spec delta
(`specs/core-library--concurrency--concurrency-package/spec.md:7-12`)
defines `FiberError` as a narrower enum than the existing corelib
declaration:

```beskid
pub enum FiberError {
    Cancelled(),
    StackOverflow(),
    Panicked(i64 code),
}
```

The existing corelib declaration at
`compiler/corelib/packages/concurrency/src/Concurrency/FiberError.bd`
carries richer payloads:

```beskid
pub enum FiberError {
    Cancelled(i64 reason, i64 cancelerId),
    StackOverflow(i64 limitBytes, i64 requestedBytes),
    Panicked(i64 code, string message),
}
```

The spec delta drops the `reason` / `cancelerId` fields from
`Cancelled`, the `limitBytes` / `requestedBytes` fields from
`StackOverflow`, and the `message` field from `Panicked`. Task 2.3
states the work extends the existing contracts "without changing the
established `Detach() -> unit`, `Cancel() -> unit`, closed `FiberError`,
or channel-option surfaces." A narrower enum is a change to the closed
`FiberError` surface: it removes fields that callers and the runtime
scheduler diagnostics (owner scheduler ID, wait registration generation,
winner source) may depend on, and it breaks source that constructs or
pattern-matches the richer variants.

This contradiction MUST be resolved before implementation. The
resolution is one of:

1. Restore the richer payloads in the spec delta so the spec matches
   the existing corelib `FiberError.bd` and the closed surface is
   preserved.
2. Intentionally narrow `FiberError` and update task 2.3 to drop the
   "closed `FiberError`" guarantee, with a migration that updates every
   caller and runtime diagnostic that reads the dropped fields.

Until resolved, the spec delta and task 2.3 are inconsistent and the
`BSP-REQ-F61E094A4838` scenario "Detach after join is rejected
statically" does not exercise the payload shape. This open question is
flagged here without editing the spec delta; the spec deltas remain
proposed material pending resolution.
