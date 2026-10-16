## ADDED Requirements

### Requirement: Core.IO is the sole partial-transfer abstraction
The public `Core.IO` contracts SHALL be the sole foundation-level abstraction for partial byte transfer, EOF, no-progress, and idempotent close. Stream-like corelib APIs MUST use `Reader`, `Writer`, `Closer`, or `Stream` rather than define competing partial-transfer loops; `Core.IO` MUST use `Core.Bytes` and `Core.Encoding` for byte and text conversion and MUST NOT embed transport-specific socket behavior.

**Stable ID:** `BSP-REQ-0A5892A2DB9C`

#### Scenario: Stream API delegates partial transfer
- **GIVEN** a foundation stream API that must read an exact byte count
- **WHEN** it exposes that operation publicly
- **THEN** it delegates to the `Core.IO.Reader` contract rather than defining an independent partial-read policy
