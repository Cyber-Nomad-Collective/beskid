## ADDED Requirements

### Requirement: 0.6.6 feature release cases
The frozen 0.6 release case manifest SHALL include mandatory cases for the 0.6.6 language and runtime features, and each case SHALL run on Linux x64, macOS arm64 and Windows x64 like every other mandatory case. The cases SHALL cover: fork-join scopes with Spawn/Join results at `BESKID_ISOLATES_MAX=1` and at the default isolate bound (`PAR066-01`, `PAR066-02`); a bounded port producer and consumer and a pipeline that keeps input order (`PORT066-01`, `PORT066-02`); parallel sequence Map/Reduce and Collect results equal to the serial result (`PSEQ066-01`, `PSEQ066-02`); `move` and `exchange` at run time and a read after `move` rejected as **E1234** through the installed CLI (`MOVE066-01`); generated Rust owner records, fieldless enums and call-scoped callbacks built by the installed CLI (`GLUE066-01`); and a `BESKID_GC_STRESS=alloc:64,verify` smoke run with a malformed setting rejected at runtime initialization (`GCS066-01`). Library-level tests that do not run the installed prefix SHALL be related evidence only.

#### Scenario: A 0.6.6 candidate fails a feature case
- **GIVEN** a candidate whose installed CLI runs the `PAR066-02` program at `BESKID_ISOLATES_MAX=1` with a task outside the main isolate
- **WHEN** the release cases run on any target
- **THEN** `PAR066-02` fails and qualification fails with that case identity

#### Scenario: The feature cases are bound to reviewed sources
- **GIVEN** the release case manifest is frozen with the official freeze tool
- **WHEN** a reader validates the evidence of a 0.6.6 candidate
- **THEN** every 0.6.6 feature case names its retained source, its required test ids and their byte offsets, and the manifest digest equals the pinned digest
