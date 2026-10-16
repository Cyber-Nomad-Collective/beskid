## MODIFIED Requirements

### Requirement: Runtime panic terminates the process: Decision [D-EXEC-RT-0008]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> | Mechanism | Use |
> | --- | --- |
> | `Option` / `Result` | Expected failures (language-meta + corelib) |
> | `panic` / `panic_str` | Unrecoverable faults, hard IO faults in v1 streams, allocation failures |
> | Unwind | **No** Beskid stack unwinding across panics |
> | Outcome | Runtime panics **terminate** the process (trap / abort) |
> | Builtin kind | `AbiReturnKind::Never` in the generated ABI-v5 tables from `compiler/runtime_manifest.bsol` |

A panic SHALL be contained by the nearest enclosing fiber or isolate, in this order: a panic in a joinable child fiber SHALL become that fiber's `Panicked` join outcome; a panic in an isolate main fiber SHALL end that isolate with the outcome `panicked` and SHALL be reported to the joining isolate as `TaskError::Failed` with the message copied through `IsolatePanicMessage` into the joiner's heap. A panic in the main isolate's main fiber, a panic in a detached fiber of any isolate, and a panic outside any fiber SHALL terminate the process. A trap (`beskid_rt_v5_trap`) SHALL terminate the process from any isolate. No Beskid stack SHALL be unwound in any case.

**Stable ID:** `BSP-REQ-53203A00411B`  
**Legacy source:** `site/spec-content/platform-spec/execution/runtime/panic-io-and-syscalls/adr/0008-panic-terminates-process/content.md`  
**Source SHA-256:** `b96ed9a5740e3a4441248dae6d324a418d7c178d34a5e83444fed807f3e573f9`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

#### Scenario: Panic in an isolate does not terminate the process
- **GIVEN** `Task<i64> t = s.Spawn(() => { __panic_str("isolated"); return 0_i64; });`
- **WHEN** the parent joins `t` and then returns `Result::Ok(1_i64)` from the scope
- **THEN** `Join` returned `TaskError::Failed` with message `"isolated"`, the scope returned `ParallelError::Failed`, and the process continues to its normal exit status

#### Scenario: Panic in the main isolate still terminates
- **GIVEN** a program whose main fiber calls `__panic_str("fatal")` outside any scope
- **WHEN** the panic runs
- **THEN** the process terminates through the trap path with exit status 101

#### Scenario: Detached fiber panic inside an isolate terminates
- **GIVEN** a task body that spawns a fiber, detaches it, and the detached fiber panics
- **WHEN** the panic runs
- **THEN** the process terminates through the trap path with exit status 101
