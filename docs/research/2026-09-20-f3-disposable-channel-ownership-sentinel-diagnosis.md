# F3 disposable-channel ownership sentinel diagnosis

Date: 2026-09-20  
Compiler baseline: `compiler-v05-foundations-runtime` at `09b8cb5ce27e7dc5a93542283ceaa68b2a54ed8d`  
Scope: diagnosis only. No tracked compiler, runtime, corelib, or fixture edits.

## Diagnosis

The reproduced failure is **fixture scheduling misuse**, not a reproduced
channel ownership defect. The failed observation is the resource receive in
the supposed post-commit cancellation scenario: it returns
`ChannelError::Closed`, because that sender never executed its send.

The harness invokes the source entrypoint directly through its JIT function
pointer. This execution is outside a child fiber. At that location,
`Probe.beskid_rt_v5_fiber_yield()` calls the canonical `FiberYield`, which
returns immediately when `SchedulerCurrentFiber() == FIBER_NONE`. Spawning
a sender only enqueues it. The next root-level `sender.Cancel()` thus requests
cancellation before the sender has started, and `sender.Join()` drives the
scheduler, which applies that pending cancellation before selecting runnable
work. No channel value has committed. Closing the empty channel and receiving
`Closed` is correct.

The same flaw makes the nominal bounded/full pre-commit case pass without
testing its specified parked-sender boundary. It tests cancellation before
the child starts, not cancellation of an in-flight parked send.

The convention-safe correction is to run the existing scenario body inside
one ordinary spawned controller fiber, with the unchanged public entrypoint
joining that controller. The same one-yield scenario then has a real current
fiber, and FIFO scheduling deterministically reaches the sender's park or
post-commit yield before the controller resumes and cancels it. No runtime,
query, ABI, disposal, or scheduler API change is justified by this failure.

## Evidence and limits

The Task 3 fixture was reverted and its full source patch was not retained.
This diagnosis reconstructs the four documented scenarios from the Task 2
brief, Task 3 brief/report, and F3 research note. It does not claim to recover
the old fixture byte for byte or uniquely identify an unavailable old source
line from the aggregate `-874` alone.

The external reconstruction uses one local `OwnedResource: Disposable` with
the required shared `i64[]` counter, rejects repeat disposal, and returns
`Result::Ok(())`. It uses ordinary `Channel.Send<OwnedResource>`, public
`Fiber.Cancel`/`Join`, and the existing Probe operations. It imports no Core.IO.
The real split-claim receipt helper is retained. Each scenario runs separately
and also in one aggregate; bounded diagnostic codes distinguish token,
counter, Dispose, join, drain, and missing-receive failures.

Only the supposed post-commit receive fails in that reconstruction. Its
missing-receive code is `-23`; the other three scenarios return zero. A
smaller probe then distinguishes the receive error and returns `-1000`
specifically for `ChannelError::Closed`. With the original fixture's common
`-1000` mapping, this observation is consistent with exactly
`126 - 1000 == -874`. No counter or explicit Dispose failure was observed.

Changing only the caller context—invoking the identical scenario body from
a spawned controller—makes both the minimal probe and the complete four-state
counter probe return zero through the real source-lowering/JIT path. The full
controller probe passed four runs, including three consecutive verification
runs. The root-context minimal failure was reproduced twice.

## Confirmed code facts

Paths below are relative to `compiler-v05-foundations-runtime`.

| Fact | Authority | Consequence |
| --- | --- | --- |
| The harness transmutes the exported entrypoint to `extern "C" fn() -> i64` and calls it directly. | `crates/beskid_engine/tests/fiber_value_transfer.rs:94-97` | The source fixture entry is not implicitly a child fiber. |
| `FiberCurrentId` returns `-1` outside a child. | `runtime/beskid/src/Runtime/Fiber/Scheduler/Core.bd:434-439` | The external probe directly observed `-1` at the entry and `4294967296` inside its first spawned controller. |
| `SchedulerSpawn` allocates and enqueues a fiber; execution starts only after a scheduler context switch. | Same file:687-708 | Creating the sender does not run its send. |
| `FiberYield` returns immediately when no current fiber exists. | Same file:410-431, especially 413-415 | The original root-level yield cannot advance the sender. |
| `FiberCancel` stores cancellation and enqueues the request; it does not itself drive the sender. | `runtime/beskid/src/Runtime/Fiber/Fiber.bd:17-38` | Root cancellation can win before the sender starts. |
| Root `FiberJoinStatus` calls `SchedStep`; a child join instead yields its current fiber. | Same file:70-89 | The root join is the first scheduling step in the minimal failing scenario. |
| `SchedStep` applies cancels before selecting a runnable fiber. | `runtime/beskid/src/Runtime/Fiber/Scheduler/Loop.bd:4-40` | The unstarted sender is cancelled before its entry runs. |
| A runnable cancelled fiber with no channel operation becomes terminal without entering its source function. | `runtime/beskid/src/Runtime/Fiber/Scheduler/Queue.bd:59-90` | Cancelled Join alone does not prove the send ever started or committed. |
| Public Send boxes its value using the canonical generic ChannelValue and enters the native send boundary. | `corelib/packages/concurrency/src/Concurrency/Channel.bd:12-14,39-45` | No resource-specific ownership route is needed. |
| Successful ChannelCommit moves the sender slot into a stable queue cell under the lock. | `runtime/beskid/src/Runtime/Sync/Channel.bd:97-122` | The post-commit guarantee requires that this call actually execute. |
| ChannelSend marks its in-flight operation and yields only after successful commit. | Same file:133-160 | A real controller yield exposes the intended post-commit cancellation window. |
| ChannelPark registers the waiter, marks its channel operation, releases the lock, and switches to the scheduler. | Same file:308-330 | A real controller yield with a full channel reaches the required parked-sender window. |
| Pending cancellation preserves an in-flight channel operation and wakes a parked one to resolve its original stack. | `runtime/beskid/src/Runtime/Fiber/Scheduler/Queue.bd:76-86` | Correctly scheduled sends observe cancellation through the canonical ownership path. |
| Close marks/wakes; an empty closed queue returns Closed. | `runtime/beskid/src/Runtime/Sync/Channel.bd:163-171,262-273` | Closed in the failing root case is expected, not evidence of a lost committed value. |

The normative ownership requirements remain unchanged:
`BSP-REQ-D00CFBE68D28`, `BSP-REQ-6D7DDA9E739B`, and
`BSP-REQ-3B24A87BD7B8` in
`openspec/changes/beskid-v0-5-foundations/specs/execution--runtime--channels-and-synchronization/spec.md`.
Their post-commit scenario assumes a committed value; their pre-commit
scenario assumes a parked sender. The faulty fixture established neither.

## Reproduction commands and results

All probe sources, executable, and native kit are outside tracked worktrees:
`/private/tmp/f3-ownership-sentinel.OjnR9O/`.

- `probe.rs` assembles the same concurrency units, Results, and Disposable,
  calls `lower_syntax_assembly_entrypoint`, builds the canonical native kit
  once with `build_native_host`, and executes the artifact with
  `Engine::with_runtime_kit`. No alternate semantic/lowering route exists.
- `scenarios.bd` reconstructs normal transfer/close, receipt abandonment,
  bounded sender cancellation, and available-channel sender cancellation.
- `minimal.bd` isolates spawn/yield/cancel/join/close/receive with the same
  ordinary disposable resource channel, classifying Closed distinctly.
- `build.sh` links the baseline's existing compiler libraries. Matching ABI
  and Cranelift artifacts are pinned in the script to avoid unrelated cached
  crate-identity mismatches.

Build:

```sh
bash /private/tmp/f3-ownership-sentinel.OjnR9O/build.sh
```

Each following invocation printed `PASS source lowering: <entry>` and
`PASS native kit ready` before the listed JIT result. The first invocation
built the native kit; subsequent invocations reused that external kit.
Probe assertion failures exit 101; successful assertions exit zero.

```sh
/private/tmp/f3-ownership-sentinel.OjnR9O/probe /private/tmp/f3-ownership-sentinel.OjnR9O/scenarios.bd RunProbe 0
/private/tmp/f3-ownership-sentinel.OjnR9O/probe /private/tmp/f3-ownership-sentinel.OjnR9O/scenarios.bd Normal 0
/private/tmp/f3-ownership-sentinel.OjnR9O/probe /private/tmp/f3-ownership-sentinel.OjnR9O/scenarios.bd Receipt 0
/private/tmp/f3-ownership-sentinel.OjnR9O/probe /private/tmp/f3-ownership-sentinel.OjnR9O/scenarios.bd PreCommit 0
/private/tmp/f3-ownership-sentinel.OjnR9O/probe /private/tmp/f3-ownership-sentinel.OjnR9O/scenarios.bd PostCommit 0
/private/tmp/f3-ownership-sentinel.OjnR9O/probe /private/tmp/f3-ownership-sentinel.OjnR9O/scenarios.bd PostCommitInFiber 0
/private/tmp/f3-ownership-sentinel.OjnR9O/probe /private/tmp/f3-ownership-sentinel.OjnR9O/scenarios.bd PreCommitInFiber 0
/private/tmp/f3-ownership-sentinel.OjnR9O/probe /private/tmp/f3-ownership-sentinel.OjnR9O/scenarios.bd CurrentContext -1
/private/tmp/f3-ownership-sentinel.OjnR9O/probe /private/tmp/f3-ownership-sentinel.OjnR9O/scenarios.bd ChildContext
/private/tmp/f3-ownership-sentinel.OjnR9O/probe /private/tmp/f3-ownership-sentinel.OjnR9O/scenarios.bd RunProbeInFiber 0
/private/tmp/f3-ownership-sentinel.OjnR9O/probe /private/tmp/f3-ownership-sentinel.OjnR9O/minimal.bd PostCommit 0
/private/tmp/f3-ownership-sentinel.OjnR9O/probe /private/tmp/f3-ownership-sentinel.OjnR9O/minimal.bd InFiber 0
```

| Source / entry | Expected | Observed | Meaning |
| --- | ---: | ---: | --- |
| scenarios / RunProbe | 0 | -23 | Aggregate reproduces one missing-receive observation. |
| scenarios / Normal | 0 | 0 | Transfer, close, zero counter, one explicit Dispose, closed drain pass. |
| scenarios / Receipt | 0 | 0 | Real claimant cancellation, receipt recovery, counter, Dispose, drain pass. |
| scenarios / PreCommit | 0 | 0 | Superficial pass; root yield did not exercise parked Send. |
| scenarios / PostCommit | 0 | -23 | Receive failed; other counter/join/drain observations pass. |
| scenarios / PostCommitInFiber | 0 | 0 | Identical scenario in child context reaches actual post-commit window and passes. |
| scenarios / PreCommitInFiber | 0 | 0 | Identical bounded scenario in child context reaches actual park and passes. |
| scenarios / CurrentContext | -1 | -1 | Entry runs outside a child. |
| scenarios / ChildContext | observational | 4294967296 | Spawned controller has a generation-safe fiber identity. |
| scenarios / RunProbeInFiber | 0 | 0 | Complete four-state counter suite passes in controller context. |
| minimal / PostCommit | 0 | -1000 | Exact error is ChannelError::Closed. |
| minimal / InFiber | 0 | 0 | Only caller context changed; committed value is received. |

Minimal red output, reproduced twice:

```text
PASS source lowering: PostCommit
PASS native kit ready
JIT PostCommit = -1000
assertion `left == right` failed: PostCommit
  left: -1000
 right: 0
```

The red/green minimal pair completes in about 0.33 seconds after the kit is
built. The whole reconstructed four-scenario controller runs in under a
second. Consecutive verification used:

```sh
for probe_run in 1 2 3; do
  /private/tmp/f3-ownership-sentinel.OjnR9O/probe /private/tmp/f3-ownership-sentinel.OjnR9O/scenarios.bd RunProbeInFiber 0
done
```

All three returned `JIT RunProbeInFiber = 0`.

## Correct acceptance fixture shape

Keep one fixture and the existing Rust harness. Put the complete existing
scenario body in a narrow source helper, then retain the exported entry name
as a public Fiber Join wrapper:

```beskid
i64 RunChannelReceiptScenarios() {
    // Existing byte/aggregate/receipt checks and all four resource scenarios.
    // Retain the full counter, token, cancellation, and drain assertions.
    // Both sender races use one Probe.beskid_rt_v5_fiber_yield() before Cancel.
    // Return the existing aggregate, with success equal to 126.
}

i64 RunChannelReceiptFixture() {
    Fiber<i64> controller = spawn (() => RunChannelReceiptScenarios());
    Result<i64, FiberError> completed = controller.Join();
    return match completed {
        Result::Ok(value) => value,
        _ => -1000_i64,
    };
}
```

The helper body is the actual acceptance content, not a stub to commit. The
wrapper is the only required scheduling correction. Add Disposable to the
existing explicit source-unit assembly as originally planned. Preserve byte
and aggregate checks and expected result 126.

Within the controller, after spawning the sender, one yield enqueues the
controller after that sender. The scheduler runs the sender first. For a full
bounded channel it parks in ChannelPark. For an available channel it commits
and yields from ChannelSend, enqueuing itself behind the controller. The
controller resumes, calls public Cancel, and joins. Pending cancellation
preserves the sender's in-flight channel operation. The pre-commit sender
returns cancelled without moving its slot; the post-commit sender resumes
with a vacant sender slot and returns cancelled without retracting the queue
cell. Source Receive and explicit Dispose then test the normative ownership
guarantee directly.

Keep all previous spawned receipt claimants joined before entering these
sender scenarios, as the reconstructed body does. No sleeps, polling loop,
new intrinsic, raw scheduler-step hook, extra ownership side channel, or
resource-specific API is needed. A root-level yield should not be changed to
run the scheduler just to satisfy the fixture.

## Validation boundary and hygiene

This diagnosis ran source lowering and JIT against the canonical native kit.
It did not run the corrected acceptance fixture through AOT/shared-native-kit
routes, because no tracked acceptance change was made. The follow-up task
must still implement the wrapper with its full fixture, run the focused test
through all three routes, and run the complete `fiber_value_transfer` target.

No runtime repair or separate product regression is proposed. The corrected
existing source fixture is the appropriate maintained regression surface.
The earlier F3 research claim that a root-level exposed yield deterministically
advances a sender was incomplete and should be corrected to require a
spawned controller context.

`git diff --check` passed and `git status --short` remained empty in the
compiler worktree. GitNexus was not used. No commits, pushes, merges, secret
changes, or external-service writes occurred. The root checkout already had
unrelated modified/untracked files, all preserved. Only this requested report
was added there. Probe artifacts and durable knowledge remain outside the
repository, at the temporary path above and
`/Users/mikserek/.agents/knowledge/f3-ownership-sentinel.md` respectively.
Shared CHANGELOG integration remains with the controller to avoid editing
its already dirty file from this diagnosis-only task.
