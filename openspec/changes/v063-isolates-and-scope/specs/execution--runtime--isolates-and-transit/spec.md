## ADDED Requirements

### Requirement: Isolate creation on a second thread
The runtime SHALL create an isolate by starting an OS thread through `ThreadCreate` (the `thread_create` intrinsic) and calling `IsolateCreate` (`beskid_rt_v5_isolate_create`) on that thread. `IsolateCreate` SHALL perform the per-instance steps of `ProcessInit` (`Runtime/Bootstrap/Lifecycle.bd:58-174`): allocate a `RuntimeState`, a heap with its first region and a callback registry, register the regions in the region-to-owner map, attach the thread (`ThreadAttach`), initialize a scheduler and its external wait state (`ExternalInit`, which allocates one owner mailbox id per scheduler), acquire the process-wide worker pool (`WorkerPoolInit`, reference counted) and install the limits the process recorded at `ProcessInit` without reading the environment again. `IsolateCreate` SHALL NOT create or launch a composition container. `IsolateDestroy` (`beskid_rt_v5_isolate_destroy`) SHALL stop the scheduler, release the worker pool reference, detach the thread and release the heap, callback registry and `RuntimeState`, except for regions adopted by the parent (memory and GC runtime contract), and SHALL unregister the released regions. From 0.6.3 the runtime corpus SHALL call `IsolateCreate` for every isolate the corelib spawns; the one-instance restriction of 0.6.1 is lifted. An isolate's thread SHALL be attached to exactly one runtime instance for its whole life, and every runtime export the isolate's generated code calls SHALL resolve the heap through thread-local state (`Runtime/Mem/Gc/State.bd:87-100`), never through a process global. The runtime SHALL join every isolate thread with `ThreadJoin` before the pool releases it.

#### Scenario: Two runtime instances in one process
- **GIVEN** a program whose main isolate spawns one task through `Scope.Spawn`
- **WHEN** the task body allocates an object and reads `Isolate.Current()`
- **THEN** the object lives in a heap distinct from the main heap, `RegionOwner` of the object returns the task's runtime instance, and the main isolate's heap is not written by the task's thread

#### Scenario: Isolate shares the process worker pool
- **GIVEN** a task body that performs a blocking file read through the syscall path
- **WHEN** the read is submitted
- **THEN** it is served by the process-wide worker pool and completion is posted to the task scheduler's own owner mailbox, not to the main scheduler's

#### Scenario: Limits inherited without an environment read
- **GIVEN** `BESKID_HEAP_MAX=64m` set before the process starts
- **WHEN** a task isolate is created
- **THEN** its heap cap is 64 MiB and no environment lookup happens during `IsolateCreate`

### Requirement: Isolate main fiber and panic outcome
Every isolate SHALL execute its entry in a fiber on its own scheduler (the isolate main fiber), so that `FiberPanic` (`Runtime/Io/Syscalls.bd:116-140`) finds a current fiber and records the panic as a fiber outcome instead of trapping the process. A panic in the isolate main fiber SHALL store the owned message in the isolate's heap and end the isolate with outcome `panicked`. `IsolateDestroy` SHALL copy the message into process-owned native storage (`IsolatePanicMessage`, `beskid_rt_v5_isolate_panic_message`) before the heap is released, and the joining isolate SHALL allocate a string from those bytes in its own heap and release the native copy; the join SHALL never return a pointer into the panicking isolate's heap. A panic in a joinable child fiber of an isolate SHALL keep the existing fiber semantics (observed by that fiber's `Join` inside the isolate). A panic outside any fiber or in a detached fiber SHALL keep its process-trap behavior in every isolate; a trap (allocation exhaustion, root stack exhaustion, ABI violation) SHALL terminate the process from any isolate.

#### Scenario: Panic becomes a task failure
- **GIVEN** `Task<i64> t = s.Spawn(() => { __panic_str("boom"); return 1_i64; });`
- **WHEN** `t.Join()` is evaluated in the parent
- **THEN** it returns `Result::Error(TaskError::Failed(TaskFailure { index: 0, message: "boom" }))`, the process exit status is unaffected, and `message` is a string in the parent heap

#### Scenario: Child fiber panic stays inside the isolate
- **GIVEN** a task body `Fiber<i64> f = spawn Boom(); return match f.Join() { Result::Ok(v) => v, Result::Error(_) => -1_i64 };` where `Boom` panics
- **WHEN** the task is joined
- **THEN** the task completed with `Result::Ok(-1)` and no task failure is reported

#### Scenario: Trap still terminates
- **GIVEN** a task body whose allocation exceeds `BESKID_HEAP_MAX` for its isolate
- **WHEN** the allocation fails through the trap path
- **THEN** the process terminates with exit status 101 and the trap diagnostic on stderr

### Requirement: Isolate cancellation slot
Every isolate SHALL own a cancellation slot (one native word, the same shape as the fiber cancellation slot at `BESKID_FIBER_RECORD_CANCEL_SLOT_OFFSET`). A cancellation request from another isolate SHALL set the slot with `AtomicWordStore` (release) and post a wake-up to the isolate's owner mailbox. The isolate's scheduler SHALL read the slot with `AtomicWordLoad` (acquire) at every safepoint at which `ApplyPendingCancels` runs (`Runtime/Fiber/Scheduler/Loop.bd:7`) and, when set, SHALL cancel the isolate main fiber through the existing fiber cancellation path so that parked waits complete with `EXTERNAL_CANCELLED` and channel operations report `Cancelled`. An isolate whose main fiber ended by cancellation SHALL have outcome `cancelled`. Cancellation SHALL be idempotent. The corelib SHALL expose the slot's state as `bool Parallel.IsCancelled()`.

#### Scenario: Cancelled task observes it at a safepoint
- **GIVEN** a task body `while !Parallel.IsCancelled() { Concurrency.Yield(); } return 7_i64;`
- **WHEN** the parent calls `s.Cancel()` and joins the task
- **THEN** the body leaves its loop and `Join` returns `Result::Error(TaskError::Cancelled)`

#### Scenario: Cancellation completes a parked wait
- **GIVEN** a task body parked in a channel receive with no sender
- **WHEN** the scope cancels it
- **THEN** the receive returns `ChannelError::Cancelled`, the body ends, and the isolate outcome is `cancelled`

### Requirement: Composition injection fails closed inside isolates
An isolate SHALL have no composition container. The compiler SHALL report **E1249** at an `inject` field read that occurs lexically inside a task body (a lambda literal passed to a `[Captures]` parameter). A read that the static rule cannot see (an injected field read in a function the task body calls) SHALL fail closed at runtime: the runtime SHALL end the isolate main fiber with outcome `panicked` and the message `composition is not available inside an isolate`, through the same path as any other panic. The runtime SHALL NOT resolve the parent's container from an isolate and SHALL NOT create a second container.

#### Scenario: Injected field read inside a task body
- **GIVEN** `s.Spawn(() => this.clock.Now())` where `clock` is an `inject global::` field
- **WHEN** the legality gate judges the lambda
- **THEN** the compiler reports **E1249** at `this.clock`

#### Scenario: Indirect injected read inside a task
- **GIVEN** a program with a launched composition and a task body that calls a function which reads an injected field
- **WHEN** the task is joined
- **THEN** `Join` returns `TaskError::Failed` whose message is `composition is not available inside an isolate` and the main isolate's container is unchanged

### Requirement: Per-isolate heap cap and process isolate bound
`BESKID_HEAP_MAX` SHALL apply to each isolate's heap separately: `IsolateCreate` SHALL install the cap the process recorded at `ProcessInit` on the new heap, and an isolate's allocations SHALL count only against its own heap. `BESKID_ISOLATES_MAX` SHALL be read once during `beskid_rt_v5_process_init`, in `ApplyEnvironmentLimits` beside `BESKID_HEAP_MAX`, as a decimal integer with no suffix; it SHALL bound the number of runtime instances alive at one time in the process, counting the main isolate. The default SHALL be the host logical processor count (`HostProcessorCount()`, the 0.6.1 `host_processor_count` intrinsic), read once in `ApplyEnvironmentLimits`; `Concurrency.ProcessorCount()` and the `fiber_processor_count` export SHALL keep returning the scheduler's mutator count. A value of `0`, a value that does not parse, or a value above `65535` SHALL terminate initialization through the runtime trap path with `BESKID_ISOLATES_MAX` as the diagnostic message.

#### Scenario: Heap cap applies per isolate
- **GIVEN** `BESKID_HEAP_MAX=64m` and two tasks each allocating 48 MiB of live data
- **WHEN** both tasks run at the same time on two isolates
- **THEN** neither allocation traps and the main heap's committed size is unchanged by the tasks

#### Scenario: Default bound equals the processor count
- **GIVEN** a host reporting eight logical processors and no `BESKID_ISOLATES_MAX`
- **WHEN** a scope spawns sixteen tasks that each block until all started tasks are counted
- **THEN** at most eight runtime instances are alive at once and the remaining bodies run by elision

#### Scenario: Unparsable bound
- **GIVEN** `BESKID_ISOLATES_MAX=four`
- **WHEN** `beskid_rt_v5_process_init` runs
- **THEN** the process terminates through the trap path with exit status 101 and `BESKID_ISOLATES_MAX` in the diagnostic

### Requirement: Descriptor-driven transit copy
The runtime SHALL provide `Runtime/Mem/Transit.bd`, a descriptor-driven deep copy of a managed object graph from a source heap into a destination heap, used for `Copied` and (in 0.6.3) `Moved` captures at spawn and for results that cannot be adopted. The copier SHALL run on the destination heap's mutator thread while the source heap has no running mutator and no running collector (the source isolate is parked in the spawn or has ended). The copy SHALL obey all of the following:

1. The root is a `BeskidAbiValue` slot `{tag, payload, descriptor, owner_heap, owner_state}` (`Runtime/Mem/AbiValue.bd`). A scalar payload SHALL be copied bitwise. A managed payload SHALL be resolved to its object header through `ManagedObjectForReference` against the source heap (`Runtime/Mem/Gc/Marking.bd:35-74`).
2. The copier SHALL keep a visited table mapping source object address to destination object address. Before copying an object's fields it SHALL allocate the destination object, copy the object bytes, and insert the mapping; a source object met again SHALL be replaced by its mapped destination so that sharing and cycles are preserved exactly.
3. For an aggregate, every offset in the descriptor's pointer map (`TypeDescriptorPointerMap`, `TypeDescriptorPointerCount`) SHALL be rewritten to the copied child; non-null children SHALL be copied recursively. For an array (`TYPE_DESCRIPTOR_ARRAY`), the element descriptor's stride and pointer map SHALL be applied to each of `length` elements, and `length` and `capacity` SHALL be copied with `capacity` not below `length`. For a UTF-8 view record (`TYPE_DESCRIPTOR_UTF8_VIEW`), the record and its backing byte array SHALL both be copied and the view SHALL point at the copied backing array.
4. A child pointer whose target is not in the source heap (`RegionOwner` returns another instance) SHALL be kept unchanged: it is a foreign reference the destination may already hold (a scope-rooted `Shared` capture), and the copier SHALL NOT enter it.
5. Words that are not in a pointer map (scalars, native `pointer`, `i64` handles) SHALL be copied as bits; the static transfer-class rule, not the copier, excludes types for which this is wrong.
6. The copier SHALL refuse, without producing a partial graph visible to the destination program, any object whose descriptor fails `ValidateTypeDescriptor`, whose flags are not a known combination of `TYPE_DESCRIPTOR_ARRAY`, `TYPE_DESCRIPTOR_UTF8_VIEW` and `TYPE_DESCRIPTOR_IMMUTABLE`, whose pointer-map offset lies outside the object, or whose array `length` exceeds `capacity`. A refusal at spawn SHALL fail the task with `TaskError::Failed` and the message `transit refused <descriptor address>`; a refusal at join SHALL do the same for the joiner.
7. The copier SHALL allocate in the destination heap only; it SHALL NOT write to the source heap.

#### Scenario: Shared substructure stays shared
- **GIVEN** `[Copyable] pub type Pair { Leaf left, Leaf right }` and `[Copyable] pub type Leaf { i64 v }`, with `Pair p = Pair { left: leaf, right: leaf }` captured by a task that returns `p.left == p.right`
- **WHEN** the task runs on another isolate
- **THEN** the body observes one copied `Leaf` referenced twice and returns `true`

#### Scenario: Cycle is copied once
- **GIVEN** a `[Copyable]` type `Node { Option<Node> next, i64 v }` where `a.next` is `Some(b)` and `b.next` is `Some(a)`
- **WHEN** `a` is captured by a task that walks `next` four times and returns the sum of `v`
- **THEN** the copy terminates, the task returns `2 * (a.v + b.v)`, and exactly two `Node` objects are allocated in the task heap

#### Scenario: String payload is copied
- **GIVEN** a `[Copyable]` type `Named { string name }` captured by a task returning `named.name`
- **WHEN** the task is joined
- **THEN** the returned string has equal bytes and its backing array is in the joiner's heap, distinct from the source object

#### Scenario: Foreign pointer inside a copied graph is kept
- **GIVEN** `[Copyable] pub type View { Config config, i64 offset }` where `Config` is `[Immutable]`, with the `View` captured as `Copied` and its `config` already a scope-rooted `Shared` capture
- **WHEN** the task reads `view.config`
- **THEN** it reads the parent's `Config` object at its original address and only the `View` record was copied

#### Scenario: Unknown descriptor is refused
- **GIVEN** a test hook that stamps a source object with descriptor flags `16`
- **WHEN** a task captures it as `Copied`
- **THEN** `Join` returns `TaskError::Failed` with a message starting `transit refused` and no object with flags `16` exists in the task heap

### Requirement: Isolate spawn and join builtins
The corelib `Core.Parallel` SHALL reach the runtime only through the builtins `__isolate_spawn(entry: pointer, environment: pointer, options: i64) -> i64` and `__isolate_join(handle: i64, destination: pointer) -> i64`, registered in the builtin table like `__fiber_spawn` and `__fiber_join_status`. `__isolate_spawn` SHALL return a non-negative process-wide task handle, or `-1` when the bound of live isolates is reached (the corelib then elides). `environment` SHALL be the closure environment of the body. The runtime SHALL classify each pointer field of the environment from the target object's descriptor: an object whose descriptor carries `TYPE_DESCRIPTOR_IMMUTABLE`, and every scalar field, is `Shared` and passed by pointer; every other object is copied through `Transit.bd` in 0.6.3 (`Moved` and `Copied` alike). `__isolate_join` SHALL park the calling fiber cooperatively until the task is terminal and SHALL return `0` (completed, result available in `destination`), `1` (cancelled), or `2` (panicked, message available through `__isolate_join_message(handle) -> string`), with `__isolate_join_finish(handle)` releasing the task record. A second `__isolate_join` on the same handle SHALL return `3`.

#### Scenario: Join parks the fiber, not the thread
- **GIVEN** a parent isolate with two fibers, one joining a slow task and one looping on `Concurrency.Yield()` counting iterations
- **WHEN** the task completes after 20 ms
- **THEN** the counting fiber made progress while the join was pending

#### Scenario: Spawn at the bound returns -1
- **GIVEN** `BESKID_ISOLATES_MAX=2` with two isolates alive
- **WHEN** `__isolate_spawn` is called
- **THEN** it returns `-1` without creating a thread and the corelib runs the body on the caller

#### Scenario: Environment fields classified by descriptor
- **GIVEN** a lambda capturing an `[Immutable] Config`, a `[Copyable] Knobs` and an `i64`
- **WHEN** `__isolate_spawn` prepares the task
- **THEN** the `Config` pointer is stored unchanged, the `Knobs` object is copied into the task heap, and the `i64` is copied bitwise

### Requirement: Scoped sharing of Shared captures
A `Shared` capture of a `Scope.Spawn` lambda SHALL be passed to the task by pointer: the task's closure environment SHALL hold the parent's object address. The parent SHALL root every such object in a scope frame (one root per spawned task, taken through the external root handles of `Runtime/Mem/Gc/RootsHandles.bd:189-249`) when the task is spawned and SHALL release the roots only when the task has been joined by the scope, so the parent's collector keeps the object alive for the task's whole life without reference counts. The task's collector SHALL treat a pointer into another instance's heap as a foreign reference: it SHALL NOT mark, trace, sweep or free it (`Runtime/Mem/Gc/Marking.bd:110-119` returns before any write when `FindHeapRegionContaining` fails for the current heap), and SHALL record it as specified in the memory and GC runtime contract. The task SHALL NOT write a field of a `Shared` object; the static `[Immutable]` rule guarantees this and the runtime SHALL NOT add a write barrier for it.

#### Scenario: Shared capture survives a parent collection
- **GIVEN** a parent that captures `ReadOnlyArray<string> words` into a task, drops its own binding, forces `Assert.CollectGarbage()` twice, then joins
- **WHEN** the task reads `words.Get(1)` after the parent's collections
- **THEN** it reads the original bytes and the parent's collector did not free the array

#### Scenario: Task collection ignores parent objects
- **GIVEN** a task that stores a captured `Shared` object into a local record and forces a collection in its own heap
- **WHEN** the task's collector runs
- **THEN** it marks the local record, does not write any mark bit for the parent object, and the parent object is still reachable afterwards
