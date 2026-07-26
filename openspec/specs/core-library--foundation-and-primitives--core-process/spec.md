<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Core.Process Specification

## Purpose

Core.Process provides supported-tier process execution with structured output and typed failure results.

## Requirements

### Requirement: Process execution contract: Decision [D-CORE-PRIM-0180]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> `Run(string command, string[] args)` SHALL delegate to `__process_run` and return `Result<ProcessOutput, ProcessError>`. `ProcessOutput` MUST contain `exitCode: i64`, `stdout: string`, and `stderr: string`; the `Core.Process.ProcessError` variants MUST be `NotFound(string)`, `PermissionDenied(string)`, `ExitCode(i64, string)`, and `IOError(string)`.

**Stable ID:** `BSP-REQ-4A7C91E2D6F308B5`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Supported process capability: Decision [D-CORE-PRIM-0181]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> `Core.Process` MUST be classified `@tier(supported)`, and all execution failures MUST be represented by the declared `ProcessError` result rather than an untyped panic.

**Stable ID:** `BSP-REQ-9F20C4A87B1D6E33`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied
