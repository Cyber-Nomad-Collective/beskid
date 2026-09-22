# F3 disposable-channel acceptance: current source-path research

Date: 2026-09-20  
Baseline: `compiler-v05-foundations-runtime` at `09b8cb5c`  
Scope: research only. This note does not change compiler, runtime, corelib, or
fixture code.

## Decision

Resume F3 as **one fixture-and-harness acceptance task**. Do not add a
`value_abi_type` query candidate, a channel disposal protocol, a Core.IO path,
or a runtime ownership change.

The narrow change belongs in the existing source receipt fixture:

1. replace its scalar-only `OwnedResource` with the one local
   `OwnedResource: Disposable` fixture type;
2. add `Core/Disposable.bd` to the existing `fiber_value_transfer.rs` source
   assembly; and
3. extend that same fixture to prove ordinary transfer/close, sender
   cancellation on both sides of the commit point, and abandoned-receipt
   recovery, with an explicit receiver-owned `Dispose` as the only operation
   that increments a shared counter.

This is convention-fitting because the source-level fixture uses ordinary
`Channel<T>`, the existing `Core.Disposable` contract, existing `Fiber<T>`
cancellation, and the existing JIT/AOT/native-kit harness. It creates no
second ownership authority and does not put resource lifecycle behavior in
`Core.IO`.

## Authoritative contract

| Required fact | Authority | Consequence for this fixture |
| --- | --- | --- |
| A channel preserves opaque resources in its traced ABI-value representation and one receiver gets the handle without implicit disposal or duplication. | `openspec/changes/beskid-v0-5-foundations/specs/execution--runtime--channels-and-synchronization/spec.md:3-16` (`BSP-REQ-D00CFBE68D28`) | The resource must be a real `Disposable`, not the present `i64 token` aggregate. |
| A pre-commit cancellation retains sender ownership; a post-commit cancellation leaves ownership queued until one receive. | Same spec:18-31 (`BSP-REQ-6D7DDA9E739B`) | The fixture must use a bounded/full parked sender for pre-commit, and the intentional post-commit yield in the canonical send path for post-commit. |
| Close drains committed values and never disposes a queued resource. | Same spec:33-41 (`BSP-REQ-3B24A87BD7B8`) | The counter must remain zero after `Close` and before the successful receiver explicitly disposes. |
| Public concurrency requires the same one-owner condition at send, cancellation, receive, and close-after-drain. | `.../core-library--concurrency--concurrency-package/spec.md:21-29` (`BSP-REQ-AF2C1DDC351E`) | A single fixture should show every transition rather than splitting test-only ownership conventions. |
| `Disposable` is the Foundation contract and returns `Result<unit, DisposeError>`. | `compiler/corelib/packages/foundation/src/Core/Disposable.bd:1-11`; `.../core-library--concurrency--concurrency-package/spec.md:31-41` | Import only `Core.Disposable` and `Core.Results`; do not involve `Core.IO` or its cleanup conversion. |

The closest industry comparison supports the test's ownership boundary, but is
not a substitute for Beskid's normative contract: Rust's official `Drop`
documentation distinguishes a value's owner-controlled destruction from
implicit cleanup, and explains why `Copy` and destruction are exclusive. The
fixture therefore deliberately observes a resource-specific counter and asks
only the final owner to invoke `Dispose`; it does not infer disposal from GC
or from queue removal. [Rust `Drop` docs](https://doc.rust-lang.org/stable/core/ops/trait.Drop.html)

## Current code facts

| Fact | Primary source | Finding |
| --- | --- | --- |
| The public channel facade wraps every `T` in one `ChannelValue<T>` and passes it to the trusted native boundary; `Send` documents the pre-/post-commit owner transition. | `compiler-v05-foundations-runtime/corelib/packages/concurrency/src/Concurrency/Channel.bd:12-45` | A disposable resource must use ordinary `Channel<OwnedResource>`; no resource-specialized API is correct. |
| The facade explicitly states that `Close` drains queued values and never disposes resources. | `.../Channel.bd:76-80` | The close assertion must be counter-zero before receiver disposal. |
| Runtime `ChannelCommit` checks cancellation before moving the sender ABI slot, then moves sender to cell and publishes the cell under the lock. | `compiler-v05-foundations-runtime/runtime/beskid/src/Runtime/Sync/Channel.bd:97-122` | This is the only pre-commit ownership boundary. The fixture must not simulate it with a test side channel. |
| Runtime `ChannelSend` yields after a successful commit, then reports cancellation without retracting the now-vacant sender slot. | `.../Channel.bd:132-160` | A source fixture can deterministically exercise post-commit cancellation: allow the spawned sender to reach this yield, cancel it, join as `Cancelled`, then receive the queued resource. |
| Claim moves a queued ABI slot to the exclusive receipt; `ChannelReceiveValue` moves receipt to receiver. | `.../Channel.bd:163-225` | Receiver ownership is proven by successful source `Receive`, not by a raw slot probe. |
| Terminal receipt cleanup moves the receipt back into a new queue cell; it is explicitly “never a clear or resource disposal.” | `.../Channel.bd:229-258` | The existing cancellation/abandoned-receipt fixture is the correct place to prove recovery with a disposable counter. |
| `ChannelClose` only marks/wakes, while only shutdown `ChannelDrain` calls ABI-slot clear. | `.../Channel.bd:262-287` | Close itself cannot become a disposal path; no runtime edit is justified. |
| The current source receipt fixture already creates resource channel, cancels a real claiming fiber, closes, receives, and confirms the closed-empty drain. | `compiler-v05-foundations-runtime/crates/beskid_engine/tests/fixtures/channel_receipt_value_transfer.bd:24-71` | Reuse this fixture rather than add a parallel resource acceptance program. Its `OwnedResource` currently has only `i64 token`, so it does not observe lifecycle behavior. |
| The existing harness already assembles concurrency and `Core.Results`, then executes JIT, object/AOT, and shared-native-kit routes. | `compiler-v05-foundations-runtime/crates/beskid_engine/tests/fiber_value_transfer.rs:33-123` | Add only `Core/Disposable.bd` to this assembly list and keep the one existing execution harness. |
| The Foundation native fixture already includes `Core/Disposable.bd`, implements `TestStream: ... Disposable`, and is run through the source-to-native harness. | `compiler-v05-foundations-runtime/crates/beskid_engine/tests/foundation_io_native.rs:232-280`; `.../fixtures/foundation_io.bd:67-95` | Canonical contract import and source method-dispatch lower today. This is not a reason to reuse `Core.IO`; it is evidence that the accepted `Disposable` convention works. |

## Required-stage reproduction

The following current-baseline checks were run without changing the compiler
worktree:

| Command | Result | Proves | Does not prove |
| --- | --- | --- | --- |
| `cargo test -p beskid_engine --test fiber_value_transfer source_channel_claim_cancellation_cleanup_preserves_typed_value -- --nocapture` | PASS, 1 test, 35.99 s; source lowering, native-kit build, JIT, AOT, and shared-native-kit all completed | Existing source receipt cancellation/restore reaches all three execution routes. | The resource is currently scalar-only, so it cannot prove no implicit `Dispose`. |
| `cargo test -p beskid_engine --test foundation_io_native foundation_io_closer_stream_and_scoped_cleanup_are_native_safe -- --nocapture` | PASS, 1 test, 34.99 s; source lowering and native-kit build completed | A source `Disposable` implementation and its typed method path work through the accepted native harness. | It does not transport a resource through `Channel<T>`. |
| `cargo test -p beskid_queries --test semantic_facts imported_generic_channel_send_result_is_generation_bound_for_spawned_lambda -- --nocapture` (recorded by the separate query task at the same baseline) | PASS, 1 test | Direct generic `Channel.Send<OwnedResource>` gets `POINTER` result ABI and is accepted as a spawned lambda result; stale and invalid-generic cases remain unavailable. | It does not prove runtime ownership. |

The last fact reverses the older F3 report's query diagnosis. Its temporary
end-to-end probe also reached “Fiber source lowering complete.” There is no
reproduced current `value_abi_type` defect. The present gap is missing
acceptance coverage, not a semantic-query, method-dispatch, or runtime defect.

## Exact fixture design

### One test-local resource shape

In `channel_receipt_value_transfer.bd`, replace the scalar resource with one
test-local Foundation-contract implementation:

```beskid
use Core.Disposable;

type OwnedResource: Disposable {
    i64 token,
    i64[] disposalCount,

    pub Result<unit, DisposeError> Dispose() {
        i64[] count = disposalCount;
        if count[0] != 0_i64 { return Result::Error(DisposeError::Failed()); }
        count[0] = 1_i64;
        return Result::Ok(());
    }
}
```

Use a helper which maps a successful explicit call to `0_i64` and every error
to the fixture failure sentinel. Every scenario passes the same single-element
counter array through the resource. The resource is opaque to `Channel<T>`:
only test-local helpers read `token` or call `Dispose`; no field/service/path
is added to corelib or the runtime. Do not use a scoped `use` binding here,
because the subject being proved is **not** lexical cleanup; it is an explicit
receiver decision after generic transport.

The `Dispose` implementation intentionally fails on a nonzero count. That
makes both prohibited behaviors observable: any queue/close/receipt implicit
call makes the pre-consumer zero assertion fail, and a second implicit or
explicit call makes the final explicit disposal fail. The fixture calls it
once only after a successful terminal owner transfer.

### Required scenarios in the existing fixture

| Scenario | Source-level arrangement | Required observations |
| --- | --- | --- |
| Ordinary queued then closed drain | Send one `OwnedResource`, force collection, `Close`, `Receive`, then explicitly dispose received value. | Token survives; counter is `0` after close and receive, becomes exactly `1` only after consumer `Dispose`; next receive is `Closed`. |
| Abandoned receipt recovery | Reuse `AbandonReceipt`: native split claim, cancel the claiming fiber, terminal cleanup restores receipt; outer source `Receive` obtains the resource and explicitly disposes it. | Cancelled join; counter remains `0` through claim/cancel/close/recovery; exactly one later receiver gets token and increments counter once. |
| Cancellation before commit | `Channel.CreateWithOptions(ChannelOptions.Bounded(1_i64))`; fill it; spawn a `Channel.Send<OwnedResource>` child; yield until it parks; cancel child and join it as `Cancelled`; drain the original occupied value. | Child's send reports cancellation before a commit. Its resource's counter remains `0`; no resource appears as a second queue item. This checks no implicit disposal while pre-commit sender ownership is terminated by fiber cancellation. |
| Cancellation after commit | Spawn a sender to an available channel. Let the canonical runtime's post-commit `FiberYield` run; cancel and join it as `Cancelled`; source `Receive` the queued resource; explicitly dispose it. | Cancelled join, exactly one later receive with token, counter `0` before receive/Dispose and `1` after Dispose. This proves cancellation did not retract or dispose a committed value. |

For the two sender races, retain `Probe.beskid_rt_v5_fiber_yield()` solely as
the already exposed deterministic scheduler observation point, **inside one
spawned controller fiber**. The engine invokes the fixture entry directly, so
a root-level yield is intentionally a no-op. The controller yield lets the
sender reach its park or post-commit yield before cancellation without growing
a new channel test intrinsic. A source `Fiber<T>` handle's existing
`Cancel`/`Join` API is the lifecycle authority; use raw `Probe.fiber_cancel`
only where the existing receipt fixture needs a claimant to self-cancel after
the public facade has deliberately been bypassed for split-claim coverage.

### Harness and test ownership

| File | Exact change | Reason |
| --- | --- | --- |
| `compiler-v05-foundations-runtime/crates/beskid_engine/tests/fixtures/channel_receipt_value_transfer.bd` | Add `use Core.Disposable`; replace fixture-only scalar `OwnedResource`; extend the existing receipt fixture with the four scenarios above. | One source-level acceptance artifact covers generic transport, close, cancellation, receipt recovery, and explicit disposal. |
| `compiler-v05-foundations-runtime/crates/beskid_engine/tests/fiber_value_transfer.rs` | Add `Core/Disposable.bd` to its Foundation source-unit list; rename the focused test only if its name would still claim receipt-only coverage. Keep `source_transfer_fixture` unchanged. | The fixture import must resolve through the same multi-unit assembly as production corelib. No second lower/run harness. |
| Nothing else | No change. | `Channel`, ABI manifest, scheduler, `Core.Disposable`, `Core.IO`, semantic query, codegen/ISLE, and public APIs already supply the one intended authority. |

## Follow-up task contract

**Task:** implement the single disposable-channel source acceptance fixture
described above.

**Preconditions:** retain merge base `09b8cb5c` (plus any accepted commits);
start with a clean compiler worktree; do not carry forward the old query patch.

**RED then green commands:**

```text
cargo test -p beskid_engine --test fiber_value_transfer \
  source_channel_disposable_resource_ownership_survives_close_cancellation_and_receipt_cleanup \
  -- --nocapture

cargo test -p beskid_engine --test fiber_value_transfer -- --nocapture
git diff --check
```

The first command must exercise source lowering, JIT, AOT, and shared native
kit through `source_transfer_fixture`; the second guards the sibling generic
value fixtures. Existing macOS third-party deployment-target linker warnings
are not a product result and must not mask a failing process or assertion.

**Stop conditions:**

- If `Disposable` import or direct typed method lowering fails, record the
  exact fixture source and full error, then stop; do not add a dynamic-call,
  Core.IO, or scalar fallback.
- If the before-/after-commit sequence cannot be scheduled deterministically
  with the existing `Fiber` and exposed `Probe` surface, stop and design the
  missing *test-observation* boundary before changing runtime behavior.
- If a counter becomes nonzero before explicit receiver disposal, or fails to
  become exactly one after it, treat it as a concrete production ownership bug
  at the reported boundary; do not weaken the assertion.
- If all scenarios pass, stop the task. Do not broaden it into F4 timers,
  cross-platform environment repair, Core.IO, or a public resource API.

## Sources

- Beskid OpenSpec: `openspec/changes/beskid-v0-5-foundations/specs/execution--runtime--channels-and-synchronization/spec.md`
- Beskid OpenSpec: `openspec/changes/beskid-v0-5-foundations/specs/core-library--concurrency--concurrency-package/spec.md`
- Canonical source: `compiler-v05-foundations-runtime/corelib/packages/concurrency/src/Concurrency/Channel.bd`
- Canonical runtime: `compiler-v05-foundations-runtime/runtime/beskid/src/Runtime/Sync/Channel.bd`
- Existing source fixtures/harness: `compiler-v05-foundations-runtime/crates/beskid_engine/tests/{fixtures/channel_receipt_value_transfer.bd,fiber_value_transfer.rs,foundation_io_native.rs}`
- [Rust `Drop` trait documentation](https://doc.rust-lang.org/stable/core/ops/trait.Drop.html)
