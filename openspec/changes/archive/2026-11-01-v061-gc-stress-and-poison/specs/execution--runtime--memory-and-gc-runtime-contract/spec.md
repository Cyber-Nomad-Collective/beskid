## ADDED Requirements

### Requirement: GC stress mode for root verification
The runtime SHALL read `BESKID_GC_STRESS` during `beskid_rt_v5_process_init`, in the same activation-independent way as `BESKID_HEAP_MAX`. The value SHALL be a comma-separated list of `alloc`, `alloc:<n>` with `n` at least 1, and `verify`. With `alloc` the runtime SHALL run a full collection before every managed allocation; with `alloc:<n>` before every `n`-th managed allocation. With `verify` the runtime SHALL verify the heap before and after every collection and SHALL trap with code 10 (`runtime_internal_corruption`) when the verification fails. An absent or empty variable SHALL leave the pacing policy unchanged. A malformed value SHALL terminate initialization through the runtime trap path with exit status 101 and the variable name in the diagnostic.

#### Scenario: Stress exposes a missing root
- **GIVEN** a fixture that holds a managed string in a slot that is not rooted while it allocates, and then passes the string to `str_concat`
- **WHEN** it runs with `BESKID_GC_STRESS=alloc`
- **THEN** the process exits with status 101 and the `invalid_or_stale_handle (6)` diagnostic of `str_concat`

#### Scenario: Malformed stress setting
- **GIVEN** a process started with `BESKID_GC_STRESS=often`
- **WHEN** `beskid_rt_v5_process_init` runs
- **THEN** the process exits with status 101 and `BESKID_GC_STRESS` in the diagnostic

### Requirement: Freed-object poisoning and quarantine in the debug runtime kit
The debug runtime kit SHALL overwrite each freed small slot after its free-list link with a fixed poison pattern, and SHALL hold freed small slots in a first-in-first-out quarantine with a byte budget before it returns them to their span's free list. A slot in quarantine SHALL NOT be reported as an allocated object, so a service that receives a reference to it SHALL trap through the fail-fast rule for a dead managed operand. The release runtime kit SHALL NOT poison or quarantine freed slots.

#### Scenario: Dangling reference to a quarantined slot
- **GIVEN** the debug kit, a collected string, and further allocations that are smaller than the quarantine budget
- **WHEN** the collected string is passed to `str_len`
- **THEN** the process exits with status 101 and the `invalid_or_stale_handle (6)` diagnostic of `str_len`, because the freed slot was not given to a new object
