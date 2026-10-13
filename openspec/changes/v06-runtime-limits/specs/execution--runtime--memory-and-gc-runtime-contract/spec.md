## MODIFIED Requirements

### Requirement: Heap growth pacing and committed-size cap
The runtime SHALL keep a `collection_threshold` equal to `max(2 * live_bytes after the last collection, 512 KiB)` and SHALL run a collection before growing only when `live_bytes` has reached that threshold; otherwise it SHALL grow without collecting. Pacing SHALL be evaluated when a span is refilled for a size class or when a large or dedicated-region request cannot be served, not on every allocation. A growth region SHALL be at least the requested allocation plus the region header and span directory, SHALL otherwise start at 1 MiB and double after every growth up to 64 MiB, and a request larger than the pending region size SHALL receive a dedicated region. The runtime SHALL NOT let `committed_bytes` exceed `cap_bytes`. The runtime SHALL export `beskid_rt_v5_heap_set_cap(bytes) -> u8`, which SHALL succeed only while the runtime is active and `bytes` is at least both the committed size and the initial region size, and SHALL export `gc_heap_cap`, `gc_heap_committed`, `gc_heap_region_count`, and `gc_heap_failure_reason` as read-only statistics.

The runtime SHALL NOT impose a fixed default cap on the managed heap: without configuration, `cap_bytes` SHALL be the maximum word value and the heap SHALL grow by regions until the system allocator refuses, which SHALL remain the diagnosable `out_of_memory` trap with the existing failure reason and diagnostic. The region chain SHALL have no fixed region count.

The runtime SHALL read `BESKID_HEAP_MAX` during `beskid_rt_v5_process_init`, after the heap, the primary thread and the scheduler exist, as a decimal byte count with an optional `k`, `m` or `g` suffix (powers of 1024, either case), and SHALL apply it through `beskid_rt_v5_heap_set_cap`. An absent or empty variable SHALL leave the heap uncapped. An unparsable value, or one the cap export rejects (below the committed size or below the initial region size), SHALL terminate initialization through the runtime trap path with exit status 101 and the variable name as the diagnostic message. Because the runtime reads the variable, every activation path (executable host, `beskid_library_attach_v5`, embedding engines) SHALL honour it identically; the executable host SHALL NOT parse it. `BESKID_HEAP_MAX_BYTES` is not read.

**Stable ID:** `BSP-REQ-539C3C627D46`

#### Scenario: Cap from the environment
- **GIVEN** a process started with `BESKID_HEAP_MAX=2m` whose program keeps 3 MiB of managed objects reachable
- **WHEN** the allocation that would exceed 2 MiB runs
- **THEN** the process terminates with exit status 101, the `out_of_memory (5)` diagnostic and `cap=2097152`

#### Scenario: Malformed cap
- **GIVEN** a process started with `BESKID_HEAP_MAX=abc`
- **WHEN** `beskid_rt_v5_process_init` runs
- **THEN** the process terminates with exit status 101 and `BESKID_HEAP_MAX` in the diagnostic

#### Scenario: No cap
- **GIVEN** a process started without `BESKID_HEAP_MAX` on a machine with the memory
- **WHEN** its program keeps 1,088 MiB of managed objects reachable
- **THEN** the allocations succeed, more than one region is committed and the heap verifies clean

#### Scenario: Garbage-heavy program collects instead of growing
- **GIVEN** a program whose reachable set never exceeds 64 KiB but that allocates 8 MiB of short-lived objects in a loop
- **WHEN** the loop completes
- **THEN** `gc_heap_committed` is still 1 MiB, `gc_heap_region_count` is 1, and `gc_collection_count` is greater than zero

### Requirement: Diagnosable managed-heap exhaustion
When a valid allocation cannot be satisfied after the pacing policy has collected and the cap or the operating system refuses further growth, the runtime SHALL record the failure reason and requested size in the heap state and SHALL call the runtime trap with code 5 (`out_of_memory`) and a message that contains the reason code, requested bytes, live bytes, committed bytes, and cap bytes as decimal numbers. Failure reasons SHALL include, at minimum, cap reached, platform allocation failure, a request larger than the cap, and root- or handle-stack growth failure. The trap host SHALL print `beskid runtime trap v5: <trap name> (<code>): <message>` and exit with status 101. `beskid_rt_v5_managed_object_allocate` SHALL NOT return null for a valid request; null remains reserved for a malformed request or descriptor. Exhaustion inside a fiber SHALL be process-fatal through the same trap. The generated `trapz` guard after each allocation call SHALL remain as the fail-closed backstop for malformed requests.

**Stable ID:** `BSP-REQ-8C1FA4687232`

#### Scenario: Cap exhaustion exits through the out-of-memory trap instead of an illegal-instruction signal
- **GIVEN** a process started with `BESKID_HEAP_MAX=2m` whose program keeps 3 MiB of managed objects reachable
- **WHEN** the allocation that would exceed the cap runs
- **THEN** the process exits with status 101, was not terminated by a signal, and its standard error contains `beskid runtime trap v5`, `out_of_memory (5)`, and `cap=2097152`
