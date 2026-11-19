## MODIFIED Requirements

### Requirement: Canonical parse-to-lowering phase DAG: Decision [D-COMP-BUILD-0018]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Phase literals are defined in `compiler/crates/beskid_pipeline/src/phases.rs` and asserted by conformance tests; CLI/LSP observers rely on the same ids.

The lowering boundary SHALL consist of two phase ids: `lower.ready` (every own unit passed the structural rules and the query gate) and `lower` (the executable front end of the syntax generation exists). The retired ids `lower.ast`, `lower.resolve_pass1`, `lower.normalize`, `lower.resolve`, `lower.type_check` and the structural stage `semantic.error_handling` SHALL NOT be emitted; `codegen_clif` follows `lower` directly. The ordering of every other phase is unchanged.

**Stable ID:** `BSP-REQ-3269537641D5`  
**Legacy source:** `site/spec-content/platform-spec/compiler/build-pipeline/stage-ordering/adr/0003-canonical-phase-dag/content.md`  
**Source SHA-256:** `50d76231aca191c15fe0b99fea13de68ad19e61e49a8fb5c00b2d138cf12df1b`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

#### Scenario: Build observes the lowering boundary once
- **GIVEN** a `beskid build` of a project entry
- **WHEN** the pipeline observer records phases
- **THEN** `lower.ready` SHALL precede `lower`, `lower` SHALL precede `codegen_clif`
- **AND** no `lower.type_check` phase SHALL be recorded
