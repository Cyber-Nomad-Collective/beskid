## ADDED Requirements

### Requirement: Precise stack roots from compiler stack maps
Generated program code SHALL NOT register or unregister stack roots with runtime calls and SHALL NOT take root handles for construction temporaries. The compiler SHALL declare every managed value of a function to Cranelift as a value that needs a stack map, and SHALL emit, for each module, a table of the stack maps that Cranelift records for each safepoint, keyed by the return address of the safepoint call. The runtime SHALL register each module's table when the module is loaded or finalized. During a collection the runtime SHALL walk the frames of the current thread and of every suspended fiber, and for each frame whose return address is in a registered table SHALL mark exactly the stack words that the table lists for that return address. Root handles and the external root stack SHALL remain the root mechanism for hosts, Glue adapters and the runtime corpus.

#### Scenario: Temporary live across an allocation stays live without a root call
- **GIVEN** a function that builds a string temporary, calls an allocating service while the temporary is live, and then passes the temporary to `str_concat`
- **WHEN** it runs with `BESKID_GC_STRESS=alloc` and its emitted code contains no `gc_register_root` call and no root handle
- **THEN** the program completes with the expected text and does not trap

#### Scenario: Dead values are not roots
- **GIVEN** a function whose managed temporary is no longer used after a call
- **WHEN** a collection runs inside that call
- **THEN** the stack map of that call does not list the temporary's slot and the collection may free it
