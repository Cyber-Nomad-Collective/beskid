## MODIFIED Requirements

### Requirement: Runtime instance lifecycle split
The runtime SHALL provide `IsolateCreate(config) -> pointer` and `IsolateDestroy(runtime)` (exports `beskid_rt_v5_isolate_create`, `beskid_rt_v5_isolate_destroy`) that perform the per-instance part of today's `ProcessInit`: allocate the heap and callback registry, attach the calling thread, initialize the scheduler, register the heap regions in the region-to-owner map and acquire the process-wide worker pool; and release them in reverse. `IsolateCreate` SHALL inherit the process limits (`BESKID_HEAP_MAX`, stack limits) already applied by `ProcessInit` and SHALL NOT read the environment again. `ProcessInit` SHALL keep its export and behavior: it SHALL perform the process-wide steps once (argument storage, environment limits, worker pool creation, region map creation), then call `IsolateCreate` for the primary instance and launch the composition container. `ProcessShutdown` SHALL call `IsolateDestroy` for the primary instance and then release the process-wide state. From 0.6.3 a process MAY hold many instances: the runtime corpus SHALL call `IsolateCreate` on a thread it created with `ThreadCreate` for every isolate the corelib `Core.Parallel` spawns through `__isolate_spawn`, bounded by `BESKID_ISOLATES_MAX`, and `IsolateDestroy` when the isolate ends. No corelib or user surface SHALL reach `IsolateCreate` or `ThreadCreate` directly; the `Core.Parallel` isolate builtins (`__isolate_spawn` from 0.6.3) are the only entry points.

#### Scenario: ProcessInit observable behavior unchanged
- **GIVEN** the full corelib and projects test suites
- **WHEN** they run against a runtime with the split lifecycle
- **THEN** every test passes with the same outcomes as before the split

#### Scenario: IsolateCreate on a second thread
- **GIVEN** a runtime-corpus test that calls `IsolateCreate` from a thread created with `ThreadCreate` while the primary instance is active
- **WHEN** the call returns
- **THEN** it returns a non-null instance whose heap, scheduler and TLS state differ from the primary's, and `IsolateDestroy` on it leaves the primary instance running

#### Scenario: Limits inherited
- **GIVEN** `BESKID_HEAP_MAX` set before `ProcessInit`
- **WHEN** a second instance is created in a runtime-corpus test
- **THEN** its heap cap equals the primary's and no environment read occurs during `IsolateCreate`

#### Scenario: Many instances through Scope.Spawn
- **GIVEN** `BESKID_ISOLATES_MAX=4` and a scope that spawns four tasks that each wait for all four to have started
- **WHEN** the scope runs
- **THEN** four runtime instances are alive at once, each created by `IsolateCreate` on its own thread, and all four are destroyed before the scope returns

#### Scenario: User code cannot create an instance
- **GIVEN** a user project that calls `IsolateCreate` or `__isolate_spawn`
- **WHEN** it is checked
- **THEN** the compiler reports the name as unresolved (**E1101**)
