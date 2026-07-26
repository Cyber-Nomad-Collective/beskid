<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Core.Math Specification

## Purpose

Core.Math provides integer and floating-point arithmetic, transcendental functions, constants, conversions, and typed math errors.

## Requirements

### Requirement: Integer arithmetic and power operations: Decision [D-CORE-PRIM-0100]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Core.Math SHALL provide `Abs`, `Min`, `Max`, and `Clamp` over `i64`, and `Pow(i64, i64) -> i64` SHALL use iterative exponentiation; a negative exponent MUST produce zero.

**Stable ID:** `BSP-REQ-0000000000000100`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Floating-point operations and constants: Decision [D-CORE-PRIM-0101]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Core.Math SHALL expose `Floor`, `Ceil`, `Round`, `RoundTo`, `Sqrt`, `Log`, `Log2`, `Log10`, `Sin`, `Cos`, `Tan`, and `Atan2` over floating-point values, plus `Pi()` and `E()` constants; these operations MUST delegate to the corresponding `__math_*` builtins.

**Stable ID:** `BSP-REQ-0000000000000101`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Conversions and math errors: Decision [D-CORE-PRIM-0102]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> `DegreesToRadians` and `RadiansToDegrees` SHALL be available, and `Core.Math.MathError` MUST define `DomainError()`, `Overflow()`, and `Underflow()` for reported mathematical failures.

**Stable ID:** `BSP-REQ-0000000000000102`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied
