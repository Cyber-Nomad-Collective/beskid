## MODIFIED Requirements

### Requirement: Process execution contract: Decision [D-CORE-PRIM-0180]
The Beskid standard SHALL enforce the following contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> `Run(string command, string[] args)` SHALL delegate to `__process_run` and return `Result<ProcessOutput, ProcessError>`. `ProcessOutput` MUST contain `exitCode: i64`, `stdout: string`, and `stderr: string`. The `Core.Process.ProcessError` variants MUST be `NotFound(string)`, `PermissionDenied(string)`, and `IOError(string)`. `ProcessError` MUST provide a `Message()` method that returns the text carried by the variant.

`Run` SHALL search for a `command` that has no path separator in the directories of the `PATH` environment variable, in order. `Run` SHALL use a `command` that has a path separator as written. `Run` SHALL return `Ok(output)` whenever the child process started and ended, for every exit code. The caller SHALL check `exitCode`. `Run` SHALL return `NotFound` when the search finds no executable, `PermissionDenied` when the executable cannot run, and `IOError` when the runtime fails to start the child or to read its output.

**Stable ID:** `BSP-REQ-4A7C91E2D6F308B5`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

#### Scenario: Command found on PATH
- **GIVEN** the command `echo` and a `PATH` that contains the directory of `echo`
- **WHEN** `Process.Run("echo", ["hi"])` runs
- **THEN** the result is `Ok(output)` with `exitCode` 0 and `stdout` that contains `hi`

#### Scenario: Non-zero exit code
- **GIVEN** a command that ends with exit code 3
- **WHEN** `Process.Run` runs it
- **THEN** the result is `Ok(output)` with `exitCode` 3

#### Scenario: Command not found
- **GIVEN** a command that is in no `PATH` directory
- **WHEN** `Process.Run` runs it
- **THEN** the result is `Err(NotFound(message))` and `Message()` returns a non-empty text
