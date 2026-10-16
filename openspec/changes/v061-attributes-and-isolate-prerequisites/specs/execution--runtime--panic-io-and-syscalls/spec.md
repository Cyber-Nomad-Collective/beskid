## ADDED Requirements

### Requirement: Panic message survives heap release
When a runtime instance is destroyed, the panic message of its main fiber, if the fiber ended in `FIBER_JOIN_PANICKED`, SHALL be copied into process-owned native storage (`SystemAllocate`) before the instance's heap is released, and `beskid_rt_v5_isolate_panic_message(runtime, data_out, length_out)` SHALL return 1 and the copied bytes and length while the instance record is still valid, or 0 when the main fiber did not panic. The copy SHALL be released by `ProcessShutdown`, or by the destroyer of a non-primary instance once it has read it. A panic outside a fiber or in a detached fiber SHALL keep its process-trap behavior.

#### Scenario: Main fiber panic message readable after heap release
- **GIVEN** a runtime-corpus test whose main fiber panics with the message `"disk full"`
- **WHEN** `IsolateDestroy` releases the heap and `IsolatePanicMessage` is called
- **THEN** it returns 1 and the bytes `disk full` from native storage, not from the released heap

#### Scenario: No panic, no message
- **GIVEN** a runtime instance whose main fiber returned normally
- **WHEN** `IsolatePanicMessage` is called
- **THEN** it returns 0 and writes nothing
