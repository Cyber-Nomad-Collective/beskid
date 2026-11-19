## ADDED Requirements

### Requirement: Thread intrinsics
The runtime manifest SHALL declare two target-bound intrinsics for the canonical runtime corpus, implemented in the Linux, macOS and Windows platform host objects:

```
intrinsic "thread_create" {
  symbol = "beskid_rt_v5_intrinsic_thread_create"
  capability = "runtime.adapter.thread_create"
  params = [{ name = entry, type = pointer }, { name = argument, type = pointer }, { name = handle_out, type = pointer }]
  returns = i32
  target_bindings = [
    { target = "x86_64-unknown-linux-gnu", implementation = "beskid_rt_v5_intrinsic_thread_create", os_imports = [pthread_create] },
    { target = "aarch64-apple-darwin", implementation = "beskid_rt_v5_intrinsic_thread_create", os_imports = [pthread_create] },
    { target = "x86_64-pc-windows-msvc", implementation = "beskid_rt_v5_intrinsic_thread_create", os_imports = [CreateThread] }
  ]
}
intrinsic "thread_join" {
  symbol = "beskid_rt_v5_intrinsic_thread_join"
  capability = "runtime.adapter.thread_join"
  params = [{ name = handle, type = pointer }]
  returns = i32
  target_bindings = [
    { target = "x86_64-unknown-linux-gnu", implementation = "beskid_rt_v5_intrinsic_thread_join", os_imports = [pthread_join] },
    { target = "aarch64-apple-darwin", implementation = "beskid_rt_v5_intrinsic_thread_join", os_imports = [pthread_join] },
    { target = "x86_64-pc-windows-msvc", implementation = "beskid_rt_v5_intrinsic_thread_join", os_imports = [WaitForSingleObject, CloseHandle] }
  ]
}
```

`thread_create` SHALL start an OS thread that calls `entry(argument)` where `entry` is a `pointer (pointer)` function, SHALL store an opaque handle into `handle_out` and return 0, or return a non-zero status and leave `handle_out` unchanged. `thread_join` SHALL block until the thread's entry returns, release the handle and return 0, or return a non-zero status; joining a handle twice SHALL be undefined and the runtime corpus SHALL never do it. The new thread SHALL have no runtime TLS state until it calls `ThreadAttach` or `IsolateCreate`. The Beskid wrappers `ThreadCreate` and `ThreadJoin` in `Runtime/Bootstrap/Native.bd` SHALL be the only callers; the intrinsics SHALL NOT be reachable from corelib or user code.

#### Scenario: Create and join on each target
- **GIVEN** a runtime-corpus test whose entry writes 42 into the argument cell
- **WHEN** `ThreadCreate(entry, cell, handleOut)` then `ThreadJoin(handle)` run on Linux, macOS and Windows
- **THEN** both return 0 and the cell holds 42

#### Scenario: Not available to user code
- **GIVEN** a user project that calls `thread_create` or `__thread_create`
- **WHEN** it is checked
- **THEN** the compiler reports the name as unresolved (**E1101**)

### Requirement: Atomic intrinsics
The runtime manifest SHALL declare five atomic intrinsics for the canonical runtime corpus, operating on one native word at a naturally aligned address and taking a memory order byte (0 relaxed, 1 acquire, 2 release, 3 acquire-release, 4 sequentially consistent):

```
intrinsic "atomic_word_load" { symbol = "beskid_rt_v5_intrinsic_atomic_word_load" capability = "runtime.bootstrap.atomic_word_load" params = [{ name = address, type = pointer }, { name = order, type = u8 }] returns = usize }
intrinsic "atomic_word_store" { symbol = "beskid_rt_v5_intrinsic_atomic_word_store" capability = "runtime.bootstrap.atomic_word_store" params = [{ name = address, type = pointer }, { name = value, type = usize }, { name = order, type = u8 }] returns = void }
intrinsic "atomic_word_compare_exchange" { symbol = "beskid_rt_v5_intrinsic_atomic_word_compare_exchange" capability = "runtime.bootstrap.atomic_word_compare_exchange" params = [{ name = address, type = pointer }, { name = expected, type = usize }, { name = desired, type = usize }, { name = order, type = u8 }] returns = usize }
intrinsic "atomic_word_fetch_add" { symbol = "beskid_rt_v5_intrinsic_atomic_word_fetch_add" capability = "runtime.bootstrap.atomic_word_fetch_add" params = [{ name = address, type = pointer }, { name = delta, type = usize }, { name = order, type = u8 }] returns = usize }
intrinsic "atomic_fence" { symbol = "beskid_rt_v5_intrinsic_atomic_fence" capability = "runtime.bootstrap.atomic_fence" params = [{ name = order, type = u8 }] returns = void }
```

`atomic_word_compare_exchange` SHALL return the value observed at `address`; the exchange succeeded exactly when the returned value equals `expected`. `atomic_word_fetch_add` SHALL return the previous value. An invalid order byte SHALL be treated as sequentially consistent. The C host SHALL implement them with C11 `stdatomic.h` operations on every target. `clif { }` blocks SHALL NOT admit atomic opcodes; the Beskid wrappers `AtomicWordLoad`, `AtomicWordStore`, `AtomicWordCompareExchange`, `AtomicWordFetchAdd` and `AtomicFence` in `Runtime/Bootstrap/Native.bd` SHALL be the only callers. The region-to-owner map SHALL use them for publication and lookup.

#### Scenario: Compare-exchange success and failure
- **GIVEN** a native cell holding 7
- **WHEN** `AtomicWordCompareExchange(cell, 7, 9, 4)` then `AtomicWordCompareExchange(cell, 7, 11, 4)` run
- **THEN** the first returns 7 and the cell holds 9, the second returns 9 and the cell still holds 9

#### Scenario: Fetch-add from two threads
- **GIVEN** two threads created with `ThreadCreate` that each call `AtomicWordFetchAdd(cell, 1, 3)` one thousand times
- **WHEN** both are joined
- **THEN** the cell holds 2000

#### Scenario: Atomic opcode in a clif block is rejected
- **GIVEN** a corelib `clif { }` block that uses `atomic_cas`
- **WHEN** the block is checked
- **THEN** the compiler reports **E1232**

### Requirement: Lifecycle and region exports in the manifest
The runtime manifest SHALL declare the exports `beskid_rt_v5_isolate_create` (`params = [{ name = config, type = pointer }] returns = pointer`), `beskid_rt_v5_isolate_destroy` (`params = [{ name = runtime, type = pointer }] returns = void`), `beskid_rt_v5_isolate_panic_message` (`params = [{ name = runtime, type = pointer }, { name = data_out, type = pointer }, { name = length_out, type = pointer }] returns = u8`) and `beskid_rt_v5_region_owner` (`params = [{ name = address, type = pointer }] returns = pointer`), and the generated registries SHALL carry them with symbol-string parity like every other export. `beskid_rt_v5_process_init` and `beskid_rt_v5_process_shutdown` SHALL keep their signatures.

#### Scenario: Registry parity for the new exports
- **GIVEN** the manifest with the four new exports
- **WHEN** the registry generator runs
- **THEN** `RUNTIME_EXPORT_SYMBOLS` lists all four and the parity check passes

### Requirement: Host logical processor count intrinsic
The runtime manifest SHALL declare a target-bound intrinsic and a corelib service that report the host's logical processor count, both bound to one host symbol in the Linux, macOS and Windows platform host objects:

```
intrinsic "host_processor_count" {
  symbol = "beskid_rt_v5_host_processor_count"
  capability = "runtime.adapter.host_processor_count"
  params = []
  returns = usize
  target_bindings = [
    { target = "x86_64-unknown-linux-gnu", implementation = "beskid_rt_v5_host_processor_count", os_imports = [sysconf] },
    { target = "aarch64-apple-darwin", implementation = "beskid_rt_v5_host_processor_count", os_imports = [sysconf] },
    { target = "x86_64-pc-windows-msvc", implementation = "beskid_rt_v5_host_processor_count", os_imports = [GetActiveProcessorCount] }
  ]
}
corelib_service "__host_processor_count" {
  adapter = "beskid_rt_v5_host_processor_count"
  params = []
  returns = usize
  target_bindings = [
    { target = "x86_64-unknown-linux-gnu", implementation = "beskid_rt_v5_host_processor_count", os_imports = [sysconf] },
    { target = "aarch64-apple-darwin", implementation = "beskid_rt_v5_host_processor_count", os_imports = [sysconf] },
    { target = "x86_64-pc-windows-msvc", implementation = "beskid_rt_v5_host_processor_count", os_imports = [GetActiveProcessorCount] }
  ]
}
```

The host function SHALL return the number of logical processors online for the process: `sysconf(_SC_NPROCESSORS_ONLN)` on Linux and macOS, `GetActiveProcessorCount(ALL_PROCESSOR_GROUPS)` on Windows. When the host call fails or reports less than 1, it SHALL return 1. The Beskid wrapper `HostProcessorCount` in `Runtime/Bootstrap/Native.bd` SHALL be the only runtime-corpus caller of the intrinsic. The corelib SHALL expose the service as `i64 Concurrency.HostProcessorCount()`. `Concurrency.ProcessorCount()` SHALL keep returning the scheduler's mutator count through `__fiber_processor_count` (1 per runtime instance); the two queries SHALL NOT share an implementation.

#### Scenario: Host count on each target
- **GIVEN** a test host that reports eight logical processors on Linux, macOS and Windows
- **WHEN** a program prints `Concurrency.HostProcessorCount()` and `Concurrency.ProcessorCount()`
- **THEN** it prints `8` and `1` on each target

#### Scenario: Failure reports one processor
- **GIVEN** a runtime-corpus test hook that makes the host call fail
- **WHEN** `HostProcessorCount()` runs
- **THEN** it returns 1

#### Scenario: Registry parity for the new names
- **GIVEN** the manifest with `host_processor_count` and `__host_processor_count`
- **WHEN** the registry generator runs
- **THEN** both are in the generated registries and the parity check passes
