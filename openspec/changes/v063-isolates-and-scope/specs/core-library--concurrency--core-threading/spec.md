## ADDED Requirements

### Requirement: Isolate threads are runtime-owned sessions
Every OS thread that runs Beskid code other than the main thread SHALL be created by the runtime for an isolate through the `thread_create` intrinsic and SHALL establish its heap session through `IsolateCreate` before executing any generated code. `Core.Threading` SHALL expose no operation that creates, joins or names such a thread; `Core.Threading.Thread.Yield` SHALL remain the only OS-level operation and SHALL yield the calling isolate's thread. The runtime SHALL join every isolate thread it created before `beskid_rt_v5_process_shutdown` returns.

#### Scenario: No corelib thread creation surface
- **GIVEN** the corelib `Core.Threading` module after 0.6.3
- **WHEN** its public declarations are listed
- **THEN** `Yield` is the only exported function and no `Thread` handle type exists

#### Scenario: Isolate threads are joined at shutdown
- **GIVEN** a program whose last scope returned and whose pool still holds idle isolates
- **WHEN** `beskid_rt_v5_process_shutdown` runs
- **THEN** every pool isolate's thread has exited before shutdown returns and the process exit status is the program's own
