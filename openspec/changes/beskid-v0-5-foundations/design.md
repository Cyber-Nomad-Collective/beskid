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
| Public sleep | `Core.Time.Sleep(Duration)` -> checked deadline -> manifest binding -> existing scheduler register/park/release | Public timer handle, `SleepUntil(Instant)` without domain identity, blocking-thread fallback, or a second timer service |
| Scoped cleanup | Parser scoped-binding node -> lexical ownership -> reverse-order exactly-once `Dispose` edges | Treating `use Type name = value` as a module import, adding a `using` alias, or ad hoc cleanup on selected exits; ordinary `use Package.Module;` imports remain supported |
| Partial I/O | `Core.IO.Reader` / `Writer` / `Closer` / `Stream` | Per-consumer read/write loops with divergent EOF or no-progress behavior |
| Transfer failure cause | `IoError::ReadFailed(TransferFailure cause)` / `WriteFailed(TransferFailure cause)`, one closed Foundation-owned cause enum | Flat per-cause `IoError` variants, a stateful last-failure accessor, or a Network-owned payload that would make Foundation depend on Network |

### Ownership and terminal-state model

A fiber handle has one lifecycle state. `Join` and `Detach` consume competing terminal capabilities; `Cancel` requests cancellation idempotently. A channel send has one commit point: the sender owns before it, the channel owns after it, and exactly one successful receive transfers ownership to its receiver. Channel close blocks new commits but drains already committed values.

Every external wait uses one atomic winner transition. Readiness, close, cancellation, timeout, and duplicate wake compete only at that transition. The winner resumes the fiber once and runs idempotent cleanup; losers do not produce a user-visible completion.

### F4 public sleep and registration ownership

The [Core.Time delta](specs/core-library--stability-and-api-shape--core-time/spec.md) proposes `Sleep(Duration) -> Result<unit, TimerError>` in `corelib_foundation`. Its closed, payload-free errors are `InvalidDuration`, `DeadlineOverflow`, `Unavailable`, and `Cancelled`. Negative durations fail before the clock read; nonnegative durations use one monotonic sample and check addition before registration. Zero duration uses the same cancellation observation path and promises no yield. Statuses `4`, `3`, and `0` map to success, cancellation, and unavailable admission respectively; readiness, close, and unknown statuses are invariant failures. `Unavailable` does not expose an internal cause; the legal external-wait capacity is derived from the live-fiber capacity, so a current valid fiber has one admission and duplicate rejection is distinct from capacity. Samples or wakes in nanosecond units provide no exact wake-time guarantee.

Keep the hub implementation in `compiler/corelib/packages/foundation/src/Core/Time/Time.bd`, with the one enum in `Core/Time/TimerError.bd`. Add a single `__timer_sleep_until` source binding in `compiler/runtime_manifest.bsol` to the existing `beskid_rt_v5_external_sleep_until(i64) -> usize` export using the `soft_builtin` pattern. Analysis and ABI declarations remain manifest-generated and preserve the word-sized result. Foundation does not import concurrency to invoke this builtin. Public examples establish the scheduler context explicitly with spawn/Join.

The suspended invocation owns a private registration, while the owner scheduler owns its mutable record and heap node. Completion selects one winner and removes active accounting; the resumed invocation releases terminal storage before returning. Cancellation remains sticky, and observing the call's typed cancellation does not consume the fiber handle or redefine Join. A timer that already won retains its operation result even if fiber cancellation subsequently wins. Shutdown owns release for detached frames that never resume; this provides no evidence of asynchronous lexical disposal. Timer storage has no public Disposable and adds no Core.IO cleanup path.

Public `SleepUntil(Instant)` is deferred because the current untagged Instant cannot enforce the canonical clock-domain separation requirement. A later absolute API must establish a checked or opaque monotonic domain and use this same scheduler service. The current slice neither changes existing Duration constructor overflow semantics nor claims to repair the broader Instant domain-enforcement gap.

The [F4 research](../../../docs/research/2026-09-20-f4-timer-ownership-closure-research.md) inspected compiler worktree revision `615c1cae`. At that revision, the internal scheduler registration/park/release implementation and C fixture exist, while the public Sleep facade and Windows harness acceptance do not. Historical runtime-only passes do not establish the proposed public contract. The original proposal's missing-timer implementation statement is historical context, not the current F4 implementation inventory.

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
| BSP-REQ-896BA6C917E9 | - | - | F4-R generation/heap tests | F4-C | F4-S Engine route | F4-S static route | F4-S shared route and F4-W |
| BSP-REQ-D613601481B2 | - | F4-C API typecheck | F4-R admission | F4-C | F4-S Engine route | F4-S static route | F4-S shared route and F4-W |
| BSP-REQ-8851DD840BC2 | - | F4-C duration/result typecheck | F4-R monotonic timer | F4-V production deadline checks | F4-S/F4-V Engine routes | F4-S/F4-V static routes | F4-S/F4-V shared routes and F4-W |
| BSP-REQ-CB2C00464517 | - | F4-M generated signature | F4-R winner/admission cases | F4-V production status checks | F4-S/F4-V Engine routes | F4-S/F4-V static routes | F4-S/F4-V shared routes and F4-W |
| BSP-REQ-75347DC0B10F | - | - | F4-R release/stale-token/shutdown | F4-C cancellation shape | F4-S Engine route | F4-S static route | F4-S shared route and F4-W |
| BSP-REQ-A371B8519429 | - | - | repeated race-matrix test | - | wait race fixture | wait race fixture | native race smoke |
| BSP-REQ-A0D58F1B3E21 | - | - | F4-R full legal admission and reuse | - | wait-capacity fixture | wait-capacity fixture | native capacity smoke |
| BSP-REQ-6DA154A4738C | spawn parser snapshots | typed spawn binding fixture | - | - | parser-to-JIT fixture | parser-to-AOT fixture | - |
| BSP-REQ-49672AF267D1 | use parser snapshots | scoped-binding diagnostics | - | - | parser-to-JIT fixture | parser-to-AOT fixture | - |
| BSP-REQ-91BA42B54DE1 | use parser snapshots | disposable/escape diagnostics | cleanup-edge tests | Disposable corelib tests | use cleanup fixture | use cleanup fixture | native cleanup smoke |
| BSP-REQ-8E1AF054C89D | - | - | `bytes_copy` overlap test | Bytes unit tests | bytes JIT fixture | bytes AOT fixture | bytes builtin smoke |
| BSP-REQ-391C7C5A5DD6 | - | - | cursor builtin bounds test | Bytes cursor tests | cursor JIT fixture | cursor AOT fixture | bytes builtin smoke |
| BSP-REQ-6B3A72539DE6 | - | - | - | UTF-8 invalid-input matrix | encoding JIT fixture | encoding AOT fixture | encoding smoke |
| BSP-REQ-C1442592D817 | - | - | - | Hex/Base64 invalid-input matrix | encoding JIT fixture | encoding AOT fixture | encoding smoke |
| BSP-REQ-F61E094A4838 | - | lifecycle misuse diagnostics; two-field enum constructor/match compatibility | terminal cancellation/overflow detail and panic-message lifetime fixtures | `FiberHandleTests.bd` | `fiber_value_transfer` payload fixture | same fixture with static kit | same fixture with shared kit |
| BSP-REQ-AF2C1DDC351E | - | generic resource channel fixture | resource drain test | Channel resource tests | resource channel fixture | resource channel fixture | ABI value smoke |
| BSP-REQ-F25A4DF4DEA0 | - | contract-resolution fixture | - | Core.IO and Disposable tests; `TransferFailure` cause propagation (second acceptance pass, tasks 2.8 and 5.13) | IO JIT fixture | IO AOT fixture | IO smoke |
| BSP-REQ-277D7253AE0E | - | syscall typecheck regression | ReadBytes builtin signature test | Syscall corelib test | syscall JIT fixture | syscall AOT fixture | ABI signature smoke |
| BSP-REQ-0A5892A2DB9C | - | Core.IO API-shape fixture | - | public API and transfer tests | IO JIT fixture | IO AOT fixture | IO smoke |
| BSP-REQ-35580A7D7B75 | - | `beskid_queries` `dead_collection_growth` fact tests (positive shape; corelib negative shapes) | - | `HttpSerializationTests` and `HttpCodecTests` still compile and pass | - | - | - |
| BSP-REQ-88A15BB6918A | - | - | `beskid_abi` heap-layout cross-check test; `isle_adapter` region-chain JIT test | `TextRegexIntegrationTests`, `PestGrammarParseTests` pass without the 1 MiB ceiling | `heap_growth_native.rs` growth fixture (JIT) | `heap_growth_native.rs` growth fixture (static AOT) | `heap_growth_native.rs` growth fixture (native kit) |
| BSP-REQ-539C3C627D46 | - | - | `isle_adapter` pacing and free-list skip tests | `gc_heap_*` corelib service observability test | `heap_growth_native.rs` garbage-loop fixture (JIT) | `heap_growth_native.rs` garbage-loop and `BESKID_HEAP_MAX_BYTES` fixtures (AOT) | `heap_growth_native.rs` cap-configuration host fixture (native kit) |
| BSP-REQ-8C1FA4687232 | - | - | trap-name C header render test in `beskid_manifest` | - | `heap_growth_native.rs` cap-hit fixture (JIT trap hook) | `heap_growth_native.rs` cap-hit fixture exit 101 and stderr (AOT) | `heap_growth_native.rs` cap-hit fixture exit 101 and stderr (native kit) |

#### F4 planned evidence anchors and execution gates

The identifiers below name planned acceptance work, not completed results. Paths are relative to `compiler/`. The source fixture must execute the actual public facade; runtime C-ABI callback coverage cannot substitute for source lowering.

| Anchor | Exact files and planned proof |
| --- | --- |
| F4-C | Extend `corelib/beskid_corelib/tests/corelib_tests/src/system/TimeTests.bd` in the existing `SystemTimeTests` target for the public signature, closed results, and duration/result type coverage. Maintain the spawn/Join example in `corelib/beskid_corelib/docs/Core/Time.md`, describing an unspecified monotonic epoch. These front-end typecheck gates do not execute the deadline/status branches; F4-V owns that proof. |
| F4-M | Add only the manifest-owned binding in `runtime_manifest.bsol`; run `cargo test -p beskid_manifest` and `cargo test -p beskid_abi --test runtime_bootstrap_contract`. Inspect generated analysis/ABI artifacts; no independent i32 return declaration. |
| F4-S | Add `crates/beskid_engine/tests/fixtures/timer_value_transfer.bd` and `source_timer_sleep_has_typed_outcomes_and_owned_registration` in `crates/beskid_engine/tests/fiber_value_transfer.rs`. Reuse its real Core.Time input closure plus TimerError and existing Engine JIT, emitted-object/static-kit, and emitted-object/shared-kit execution helper. Assert negative/zero/positive duration, overflow, no-fiber Unavailable, sibling progress, sticky cancellation observed inside the child, independent parent Join cancellation, released active count, repeated calls beyond the concurrent bound over time, and a fresh reused fiber's successful sleep. Fixture-local probes may observe accounting and orchestrate cancellation only. |
| F4-V | Add the focused native driver `crates/beskid_engine/tests/fixtures/timer_validation.c` and the tests `source_timer_sleep_deadline_validation_uses_production_helpers` and `source_timer_sleep_invalid_runtime_status_fails_closed` in `crates/beskid_engine/tests/fiber_value_transfer.rs`. Select canonical public `Sleep`, private `SleepDeadlineFromSample` and `SleepResultFromStatus`, plus production `FromNanoseconds`, from the unchanged canonical `corelib/packages/foundation/src/Core/Time/Time.bd` closure. Require `direct_callees(Sleep)` and its complete `reachable_items(Sleep)` closure to contain the exact two helper identities before lowering the real helper closure through `CodegenInput`/`SyntaxModuleItem`/`lower_syntax_program`; Engine passes their true pointers to the native driver and static/shared routes selectively export those same emitted items to it. The driver obtains signatures and result layouts from semantic facts, roots managed values, and contains observations only. It MUST NOT copy validation, append or splice source, expose a public helper, interpose clock/sleep runtime exports, or add another timer registration path. |
| F4-R | Extend `crates/beskid_engine/tests/fixtures/external_wait.c` through `crates/beskid_engine/tests/external_wait_native.rs` for full legal shared-capacity admission, independent duplicate-registration rejection, complete slot reuse, stale cancellation after reuse, and timer-winner integrity when cancellation precedes resume. Preserve existing deterministic `ExternalPump(now)` heap checks, race phases, and detached-shutdown tests. Use real valid fiber handles; do not assume an additional valid fiber after every live slot is occupied. Duplicate registration and full legal admission are separate cases. |
| F4-W | Port the existing `crates/beskid_engine/tests/{fiber_value_transfer,external_wait_native}.rs`, `crates/beskid_engine/tests/fixtures/{fiber_value_transfer,timer_validation,external_wait}.c`, and `crates/beskid_abi/tests/{external_owner_transport.rs,fixtures/external_owner_transport.c}` build/load/thread/alarm mechanics with platform branches or existing helpers, including F4-V's native callback driver and isolated subprocess assertions. Execute the same named source, production-validation, C runtime, and owner-transport tests on `x86_64-pc-windows-msvc`; Unix-only zero-test binaries fail readiness. |

F4-V is a production-validation seam, separate from F4-S's accounting/cancellation probes. Production `Sleep` first rejects a negative duration before reading the clock, then passes its one clock sample and nonnegative duration to private `SleepDeadlineFromSample`, which alone implements sample validation and checked deadline addition. After the sole scheduler sleep entry returns, production `Sleep` calls private `SleepResultFromStatus`, which alone implements the closed status mapping and invariant failure. These helpers do not register, park, or complete a timer. F4-V preserves the canonical source bytes and trusted canonical/materialized path required for Core.Time service authority, selects `Sleep` and both helpers by their genuine syntax identities, and requires the direct-call facts and complete reachability from `Sleep` to contain those exact helper keys. It then invokes the emitted helper functions from one host-native driver shared by Engine, static, and shared routes. The driver uses query-derived function signatures and specialized nominal layouts, including root registration for managed Duration and Result values; it contains no validation decision. The normal public F4-S fixture continues to verify composition with the actual scheduler.

`source_timer_sleep_deadline_validation_uses_production_helpers` executes negative clock samples `-1` and `I64_MIN` as Unavailable; `now = 17` with durations `I64_MAX - 17` and `I64_MAX - 16` as exact-boundary success and overflow; `now = I64_MAX` with durations `0` and `1` as success and overflow; and valid statuses `0`, `3`, and `4` as their specified typed outcomes. Exact-boundary cases assert the returned deadline without attempting a centuries-long wait. `source_timer_sleep_invalid_runtime_status_fails_closed` executes statuses `1`, `2`, `5`, and maximum word separately, using the real panic/invariant path. The Engine route runs each failure entrypoint in a child invocation of the same Rust test executable selected by a test-only case environment variable; static/shared routes run their compiled fixture executable as children. The parent requires both unsuccessful termination and the intended Sleep invariant diagnostic, so link failures, loader failures, or unrelated crashes cannot pass. All three routes must execute each case.

The exact F4-V commands, from the compiler checkout, are:

```sh
cargo test -p beskid_engine --test fiber_value_transfer source_timer_sleep_deadline_validation_uses_production_helpers -- --exact --nocapture
cargo test -p beskid_engine --test fiber_value_transfer source_timer_sleep_invalid_runtime_status_fails_closed -- --exact --nocapture
```

Run the source fixture with `cargo test -p beskid_engine --test fiber_value_transfer source_timer_sleep_has_typed_outcomes_and_owned_registration -- --nocapture`, then its full harness with `cargo test -p beskid_engine --test fiber_value_transfer -- --nocapture`. Run `cargo test -p beskid_engine --test external_wait_native -- --nocapture` and `cargo test -p beskid_abi --test external_owner_transport -- --nocapture`. Corelib gates are `cargo test -p beskid_tests_projects system_time_tests_front_end_typechecks -- --ignored --nocapture --test-threads=1` and `cargo test -p beskid_tests_projects corelib_tests_front_end_typechecks_matrix -- --nocapture --test-threads=1`.

For macOS, Linux, and Windows, evidence must record revision, target, same-revision native kit identity, logs, nonzero executed case counts, and actual outcomes. Engine JIT, static native, and shared native are three separate acceptance cells. Missing toolchains or kits leave cells unavailable; cross-compilation, DLL creation, or an internal JIT forwarding callback alone closes none of the public source cells. F4 does not waive F7 supported-target acceptance. `just corelib` invokes `just replace` and replaces the installed toolchain; retain that explicit integration/installation decision for F7.

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| A scalar ABI path remains reachable | Require the same generic aggregate/resource fixture through JIT, AOT, and native evidence; delete rather than adapt the scalar queue. |
| A duplicate event resumes a fiber twice | Make the atomic winner transition the only completion API and stress readiness/cancel/timeout races. |
| A resource leaks or closes twice in channel and `use` paths | Assert explicit ownership at every channel boundary and exactly-once reverse cleanup at every supported lexical exit. |
| Wall clock changes affect network deadlines | Permit only monotonic absolute deadlines in scheduler registration. |
| Invalid encodings become protocol ambiguity | Use strict validators and a non-ASCII-rejecting HTTP helper before networking/HTTP work begins. |

## Resolved contract question: preserve FiberError payloads

The proposed concurrency and fibers-and-spawn deltas preserve the established closed `FiberError` declaration: `Cancelled(i64 reason, i64 cancelerId)`, `StackOverflow(i64 limitBytes, i64 requestedBytes)`, and `Panicked(i64 code, string message)`. Child panic has code `2_i64` as a value invariant, with the message retained. This resolves task 2.3's preservation guarantee without a source migration, another error type, or a compatibility path. Narrowing would break existing constructor and match arities and discard diagnostic detail; no requirement justifies that migration.

Evidence distinguishes the checked-out compiler baseline (`d017559f`) from the active Foundation compiler worktree (`615c1cae`). Both have the same `corelib/packages/concurrency/src/Concurrency/FiberError.bd` declaration. The baseline `Fiber.bd` maps all payloads but `FiberJoinStatus.FromCode` initializes them to zero/empty placeholders; the enum declaration alone therefore does not prove transport. The Foundation `Fiber.bd` already reads cancellation and stack details through `__fiber_join_detail`, reads the panic message through `__fiber_join_message`, and returns `Panicked(2_i64, message)` before the source caller examines it. These are implementation observations, not new normative authorities or a claim that all acceptance cases pass.

Existing `FiberHandleTests.bd` and `crates/beskid_codegen/tests/isle_adapter/enum_match_result.rs` construct or match the two-field variants. The Foundation `crates/beskid_engine/tests/fixtures/fiber_value_transfer.bd` matches cancellation with two fields and reads both panic code and message length. Runtime cancellation records already hold reason/canceler details, and stack-growth failure records hold limit/requested sizes. Scheduler owner ID, wait generation, and winner source are separate observability fields; they are not `FiberError` payloads and this decision does not claim otherwise.

`BSP-REQ-F61E094A4838` now specifies constructor/match compatibility, actual terminal-detail preservation, and panic-message lifetime after consumed storage is released or reused. The fibers-and-spawn delta references that requirement rather than defining a narrower error shape. Task 5.12 owns the missing acceptance evidence: all three variants, nonzero recorded cancellation and overflow details, and exact message contents/lifetime through the existing source JIT/static/shared fixture. A no-argument public `Cancel()` does not supply arbitrary diagnostic reasons; nonzero transport evidence uses the existing runtime fixture seam without adding a public method. Typechecking, wildcard matches, message-length checks, and C-ABI status-only tests cannot establish the complete payload contract. Implementation and target acceptance tasks remain open.

The canonical `openspec/specs/core-library--concurrency--concurrency-package/spec.md` already requires typed Join failures (`BSP-REQ-4DA3BD50C58C`) and cancellation results (`BSP-REQ-A5E85E461CB0`); its migrated closed-set source record does not enumerate payload signatures. The scheduler-and-stacks specification requires overflow at Join (`BSP-REQ-62223D68B5BA`). The exact preserved signatures and their scenarios belong to this proposed delta until the change is applied; canonical specs and catalog are unchanged.
