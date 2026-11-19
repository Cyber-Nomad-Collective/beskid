## MODIFIED Requirements

### Requirement: Core.Threading is the OS-thread surface: Decision [D-CORE-SYST-0001]
`Core.Threading` SHALL expose only the OS-level `Thread.Yield` operation. Corelib SHALL NOT expose raw OS-thread creation or joining. Concurrent work SHALL be started as a fiber with the `spawn` expression and coordinated with the Concurrency package (`Fiber`, channels). Release 0.6.0 provides no CPU-parallel execution API; parallel execution through isolates is planned in changes `v061-attributes-and-isolate-prerequisites`, `v062-captures-and-move`, `v063-isolates-and-scope`, `v064-ports-and-pipelines` and `v065-parallel-sequences`.

**Stable ID:** `BSP-REQ-DEC34B7C1AC5`  
**Legacy source:** `site/spec-content/platform-spec/core-library/concurrency/core-threading/adr/0001-os-thread-surface-only/content.md`  
**Source SHA-256:** `441b70913768b6081efb83b2989d343e6af4ba7de39f77dee16f7e603828fc09`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

#### Scenario: Corelib exposes no raw thread spawn
- **GIVEN** the corelib foundation package
- **WHEN** its `Core.Threading` module is resolved
- **THEN** it declares `Thread.Yield` and declares no `Spawn`, `Join`, thread handle type or pthread extern contract
