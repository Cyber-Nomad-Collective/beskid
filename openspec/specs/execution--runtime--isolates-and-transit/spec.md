# execution--runtime--isolates-and-transit Specification

## Purpose
TBD - created by archiving change v063-isolates-and-scope. Update Purpose after archive.
## Requirements
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
- **GIVEN** `[Copyable] pub type Pair { Leaf left; Leaf right; }` and `[Copyable] pub type Leaf { i64 v; }`, with `Pair p = Pair { left: leaf, right: leaf }` captured by a task that returns `p.left == p.right`
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
- **GIVEN** `[Copyable] pub type View { Config config; i64 offset; }` where `Config` is `[Immutable]`, with the `View` captured as `Copied` and its `config` already a scope-rooted `Shared` capture
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

### Requirement: Port ring and owner-mailbox wake-up
A port SHALL be a process-wide object identified by an `i64` id, consisting of a native bounded ring of transit slots (`SystemAllocate`, never a managed object of any heap) guarded by the 0.6.1 atomic intrinsics (`AtomicWordCompareExchange`, `AtomicWordLoad`, `AtomicWordStore`), a capacity fixed at creation (default 64, minimum 1), a closed flag, and the owner id of every scheduler with a fiber parked on it. A send SHALL claim a slot with an atomic compare-exchange, write the slot, publish it with a release store, and post a wake-up command to the owner mailbox of each receiver parked on the port (`owner_post`, `crates/beskid_abi/assembly/common/external_wait.h:76-135`). A receive SHALL consume the oldest published slot with an acquire load, SHALL post a wake-up to each sender parked on the port, and SHALL preserve FIFO order per port. Slot contents SHALL be one `BeskidAbiValue` plus a transfer-class tag: a `Shared` value's slot holds the owner's object pointer; a `Copied` value's slot holds a native transit record produced by the sender through `Transit.bd` (same descriptor walk and refusal rules as the direct copy, writing into native memory instead of a destination heap) and consumed by the receiver's copy-in; a `Moved` value's slot holds a 24-byte native record (size, value pointer, receiver box descriptor) and the graph is handed over by pointer under the hand-over rules of the change `v065-parallel-sequences`; the 0.6.x runtime ships the `Shared` and `Moved` pointer paths together (no copy of a `Moved` value through a transit record). The port ring SHALL NOT be merged into the owner mailbox.

#### Scenario: FIFO across isolates
- **GIVEN** a port of capacity 64, one sender task sending `0_i64 .. 999_i64` in order and the parent receiving 1000 values
- **WHEN** the scope runs
- **THEN** the parent receives the values in sending order and the sender's fiber parked at most while the ring held 64 unreceived values

#### Scenario: Copied value crosses through a native record
- **GIVEN** `[Copyable] pub type Job { string id; i64 size; }` and a task that sends `Job { id: "a", size: 3 }` through `Port<Job>`
- **WHEN** the parent receives it
- **THEN** the received `Job` is an object in the parent heap, the sender's `Job` is unchanged in the task heap, and no heap of either isolate was written by the other's thread

### Requirement: Fiber-cooperative port receive and send
`__port_receive` SHALL be a fiber-cooperative wait: when the ring is empty and the port is open, the runtime SHALL register an external wait for the calling fiber (`ExternalWaitRegister`, `Runtime/Fiber/Scheduler/External.bd:143-177`) with the port id as operation, SHALL park the fiber through `ExternalWaitPark`, and SHALL let other fibers of the same isolate run. A send from another isolate SHALL complete the wait by posting `EXTERNAL_READY` to the receiver's owner mailbox, consumed by `ExternalPump`. `__port_send` on a full ring SHALL park the sending fiber the same way until a slot is free or the port is closed (back-pressure). Cancellation of the fiber or its isolate SHALL complete a parked port wait with `EXTERNAL_CANCELLED`, and the operation SHALL return the cancelled status. An isolate SHALL be able to serve any number of ports with fibers; a parked port wait SHALL never block the isolate's thread.

#### Scenario: Receive parks the fiber only
- **GIVEN** a task with two fibers, one parked in `inbox.Receive()` on an empty port and one counting `Concurrency.Yield()` iterations
- **WHEN** 10 ms pass before the parent sends
- **THEN** the counting fiber advanced and the receive returns the sent value afterwards

#### Scenario: Cancelled isolate leaves a port wait
- **GIVEN** a task parked in `inbox.Receive()` with no sender
- **WHEN** the scope cancels the task
- **THEN** `Receive` returns `Result::Error(PortError::Cancelled)` and the task exits with outcome `cancelled`

### Requirement: Port close and drain
`__port_close` SHALL set the closed flag with a release store, SHALL wake every parked sender and receiver, and SHALL be idempotent. After close, a send SHALL return the closed status without writing a slot; a receive SHALL keep returning published slots until the ring is empty and SHALL then return the closed status. Every port SHALL be owned by the scope that created it; the scope SHALL close every port it owns when it returns, before it joins its tasks and isolates, so that a task or isolate parked on a receive observes the closed status and ends. A port id SHALL stay valid for the life of the process (identity handles are never reused), and an operation on a closed and drained port SHALL return the closed status, never trap.

#### Scenario: Close then drain
- **GIVEN** a sender that sends three values and closes the port
- **WHEN** the receiver receives four times
- **THEN** the first three receives return the values in order and the fourth returns the closed status

#### Scenario: Send after close
- **GIVEN** a closed port
- **WHEN** a task sends through it
- **THEN** `Send` returns `Result::Error(PortError::Closed)` and the ring is unchanged

### Requirement: Port builtins
The corelib SHALL reach ports only through `__port_create(capacity: i64) -> i64`, `__port_send(port: i64, value: pointer, class: i64) -> i64`, `__port_receive(port: i64, destination: pointer) -> i64` and `__port_close(port: i64) -> unit`, registered in the builtin table like `__channel_create`, `__channel_send`, `__channel_receive_status` and `__channel_close`. Status codes SHALL be `0` ok, `1` closed, `2` cancelled; `__port_create` SHALL return `-1` only when the system allocator refuses the ring. `value` and `destination` SHALL be traced `BeskidAbiValue` slots owned by the calling fiber's heap.

#### Scenario: Status codes
- **GIVEN** a port with one buffered value that is then closed
- **WHEN** `__port_receive` is called twice and `__port_send` once
- **THEN** the calls return `0`, `1` and `1` in that order

### Requirement: Long-lived isolates and the inbox pattern
`s.Isolate(body)`, with `body` a `[Captures(Bound: Transferable)] () => unit` task body, SHALL start a long-lived isolate owned by the scope and return its `Isolate` handle; the handle SHALL offer `Cancel()`. The body SHALL typically capture one or more `Port<T>` handles created by the scope (`Shared`, D13) and loop on `Receive` until the port reports closed. The scope SHALL join every long-lived isolate before returning: it SHALL close the ports it owns first so that receive loops end, then wait for each isolate to exit, and SHALL cancel any isolate still running after its ports are closed and drained only when `Scope.Cancel` was requested or a sibling failed. A panic in a long-lived isolate SHALL be a task failure of that scope (spawn index assigned at `s.Isolate`) and SHALL cancel its siblings like any other failure.

#### Scenario: Worker with an inbox
- **GIVEN**
  ```beskid
  [Immutable] pub type Job { string id; ReadOnlyArray<u8> payload; }

  Result<i64, ParallelError> RunWorker(List<Job> jobs) {
      return Parallel.Scope<i64>((Scope s) => {
          Port<Job> inbox = s.Port<Job>();
          Port<i64> done = s.Port<i64>();
          Isolate worker = s.Isolate(() => {
              mut i64 n = 0;
              mut bool open = true;
              while open {
                  match inbox.Receive() {
                      Result::Ok(job) => { n = n + job.payload.Count(); },
                      Result::Error(_) => { open = false; },
                  };
              }
              done.Send(n);
              return;
          });
          for job in jobs { inbox.Send(job); }
          inbox.Close();
          return match done.Receive() { Result::Ok(n) => Result::Ok(n), Result::Error(_) => Result::Ok(-1_i64) };
      });
  }
  ```
- **WHEN** `RunWorker` runs with three jobs of payload sizes 1, 2 and 3
- **THEN** the result is `Result::Ok(6)`, every `Job` crossed by pointer, and the worker isolate exited before the scope returned

### Requirement: Causal count delivery over the owner mailbox
Every reference-count message (INC or DEC) addressed to the owner `P` of an object SHALL be posted to `P`'s owner mailbox (`owner_post`), which is a FIFO drained by `P`'s scheduler in `ExternalPump`. A sender that forwards a foreign `Shared` value SHALL post the INC to the owner before it publishes the port slot that carries the value. A receiver SHALL post a DEC only after it has consumed the slot and its collector has found the entry unreached. Because posting is a synchronous enqueue under one lock and the mailbox is FIFO, an INC SHALL reach the owner before any DEC that causally depends on the forwarded message; the runtime SHALL NOT rely on acknowledgements. Port rings SHALL NOT be merged into the mailbox. The owner mailbox SHALL grow or spill when the fixed 256-command buffer (`external_wait.h:73`) is full instead of trapping, so count traffic can never trap the process.

#### Scenario: Forwarded value is never freed early
- **GIVEN** isolate `B` holding a `Shared` object `o` owned by `A`, forwarding `o` to `C` through a port, then dropping it; `C` receives `o`, drops it and collects
- **WHEN** `A` drains its mailbox and collects
- **THEN** `A` processed `B`'s INC before `C`'s DEC, `o`'s count never reached zero while `B` held it, and `o` is freed only after `B`'s own DEC

#### Scenario: Mailbox under count pressure
- **GIVEN** a receiver that drops 10,000 distinct `Shared` objects owned by one isolate and collects once
- **WHEN** the DECs are posted
- **THEN** the owner receives one combined DEC per object or per batch, no trap occurs, and every count reaches zero

### Requirement: Moved hand-over by pointer at send
A `Moved` value (a `move` capture of a task body passed to `s.Spawn` or `s.Isolate`, a `Port.Send(move x)`, a pipeline record of Moved type, or a `ParallelSeq` output chunk) SHALL cross by pointer: the object graph SHALL stay in the sender's heap and no byte of it SHALL be copied. At send the sender SHALL walk the graph with its descriptors (`TraceObjectFields`, `Runtime/Mem/Gc/Marking.bd:148-181`, with a visited set so shared sub-objects and cycles are visited once) and, for every object it owns: give it a local count entry (`count += 1`, epoch stamped, `immutable` from `TYPE_DESCRIPTOR_IMMUTABLE`); when the object is immutable, SHALL NOT enter its fields; when the object is mutable, SHALL enter its fields. For every object in the graph owned by another isolate, the sender SHALL decrement its own foreign count or inflate and post an INC to that owner before publishing, exactly as for `Shared` forwarding, and SHALL enter the object's fields only when it is mutable. The static alias discipline guarantees that after `move x` no name in the sender reaches the graph, so the sender SHALL NOT read or write the graph afterwards; the runtime adds no barrier. The `Transit.bd` copier SHALL treat an object whose descriptor carries `TYPE_DESCRIPTOR_IMMUTABLE` as a leaf exactly when the tracer does.

#### Scenario: Buffer moves without a copy
- **GIVEN** `u8[] block = Array.Zeroed<u8>(67108864_i64); Task<i64> t = s.Spawn(() => Array.Len<u8>(move block));`
- **WHEN** the task runs
- **THEN** the task reads the array at its original address in the parent heap, the parent's local table holds one entry for the array object, and the spawn completed in constant time independent of 64 MiB

#### Scenario: Mutable graph gets one entry per object
- **GIVEN** `[Isolated] pub type Chain { Option<Chain> next; string label; }` with 1000 nodes and 1000 distinct strings, captured with `move`
- **WHEN** the send is instrumented
- **THEN** the parent's local table gains 1000 mutable entries (the nodes) and 1000 immutable entries (the strings), and the string payloads were not entered

#### Scenario: Forwarding a foreign mutable graph
- **GIVEN** task `B` that received a Moved graph owned by `A` and forwards it to `C` through a port
- **WHEN** `B` sends
- **THEN** for every object of the graph `B` decremented its foreign count or posted an INC to `A` before the slot was published, and `A`'s heap was not written

### Requirement: Moved hand-over at receive
At receive of a Moved value the receiver SHALL walk the graph the same way: for every object owned by another isolate it SHALL create or increment a foreign table entry `{count, epoch, immutable}` and SHALL enter the object's fields only when the object is mutable; for an object it owns itself (a graph coming back) it SHALL decrement the local count. The received graph SHALL then be an ordinary value of the receiver: it MAY read and write mutable objects of the graph and MAY store receiver-owned objects into them. A store of a receiver-owned child into a foreign mutable parent SHALL run the receiver's ordinary write barrier (`beskid_rt_v5_gc_write_barrier(slot, value)` from 0.6.2), which shades the overwritten value and the child in the receiver's own tables: the receiver's mark bitmaps for its own objects and its foreign table for foreign ones; no barrier SHALL touch the owner's heap. The receiver SHALL NOT allocate in the owner's regions.

#### Scenario: Receiver mutates a handed-over graph
- **GIVEN** a task that receives `move index` (an `[Isolated] Index { List<string> terms }`), appends a string allocated in its own heap to `terms`, and returns `move index`
- **WHEN** the parent joins and reads `terms`
- **THEN** the appended string is readable in the parent (its region was adopted at join) and the original nodes were never copied

#### Scenario: Received graph entries
- **GIVEN** the 1000-node `Chain` of the send scenario received by a task
- **WHEN** the receive is instrumented
- **THEN** the task's foreign table gains 1000 mutable and 1000 immutable entries naming the parent as owner, and the task entered only the mutable nodes

### Requirement: ParallelSeq chunks and results use hand-over and adoption
A `ParallelSeq` terminal SHALL pass the source array to workers by pointer under the scope-frame root of 0.6.3 (read-only for the operation's duration) and SHALL NOT give its elements count entries; each worker's output chunk SHALL be a Moved result adopted by the caller at join. A pipeline record of Moved type SHALL cross each stage by hand-over. The 0.6.4 behavior of copying Moved values through a native transit record SHALL be removed; `Copied` values keep it.

#### Scenario: Pipeline of moved buffers
- **GIVEN** `u8[] Transform(move u8[] buf)` and the pipeline `s.Source((Port<u8[]> out) => { ... })` yielding 1 MiB buffers with `out.Send(move buffer)`, then `.Stage(2_i64, Transform)` and a sink counting bytes
- **WHEN** the pipeline runs over 64 buffers
- **THEN** the sink counts 64 MiB, no buffer bytes were copied between stages, and every buffer's region is adopted by the scope's isolate when the stage isolates are joined

