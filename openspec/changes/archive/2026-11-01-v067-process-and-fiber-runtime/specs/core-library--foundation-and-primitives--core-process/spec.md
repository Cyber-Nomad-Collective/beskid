## MODIFIED Requirements

### Requirement: Process execution contract: Decision [D-CORE-PRIM-0180]
The Beskid standard SHALL enforce the following contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> `Run(string command, string[] args)` SHALL start the child, close its stdin, capture stdout and stderr concurrently and return `Result<ProcessOutput, ProcessError>`. When the child started, `Run` SHALL return `Ok(ProcessOutput)` whatever its exit code. `ProcessOutput` MUST contain `exitCode: i64`, `stdout: string` and `stderr: string`, and both streams MUST be kept when `exitCode` is not zero. `Run` SHALL return an error only when the child could not start, its output could not be read, or the output is not UTF-8 or exceeds 16 MiB. The `Core.Process.ProcessError` variants MUST be `NotFound(string)`, `PermissionDenied(string)`, `IOError(string)`, `InvalidInput`, `Cancelled`, `TimedOut`, `Closed`, `Busy`, `CleanupFailed` and `Unsupported`. There is no exit-code variant.

An executable that contains no path separator (`/`; on Windows also `\` or `:`) SHALL be resolved through the `PATH` variable of the child's environment: each directory in order, the first one that holds a runnable file. On Windows a name without an extension SHALL get `.exe`. On POSIX, when the environment has no `PATH`, the search list SHALL be `/usr/bin:/bin`. A name that no directory holds SHALL fail with `ProcessError::NotFound`. This SHALL apply to `Spawn`, `SpawnUntil` and `Run`.

`Process.Message(ProcessError error)` SHALL be a free function in `Core.Process`. It SHALL return one readable line that names the failure. For `NotFound` and `PermissionDenied` the line SHALL name the executable. For `IOError` it SHALL return the carried message. A member form `error.Message()` is not part of the contract.

**Stable ID:** `BSP-REQ-4A7C91E2D6F308B5`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

#### Scenario: Non-zero exit code
- **GIVEN** a child that writes to stderr and exits with code 3
- **WHEN** `Run` returns
- **THEN** the result is `Ok` with `exitCode` 3 and the stderr text of the child

#### Scenario: Bare name on PATH
- **GIVEN** a `PATH` that names the directory of `tool`
- **WHEN** `Spawn` starts `tool`
- **THEN** the child runs

#### Scenario: Command not found
- **GIVEN** a name that no `PATH` directory holds
- **WHEN** `Process.Run` runs it
- **THEN** the result is `Err(NotFound(name))` and `Process.Message(error)` names the executable
