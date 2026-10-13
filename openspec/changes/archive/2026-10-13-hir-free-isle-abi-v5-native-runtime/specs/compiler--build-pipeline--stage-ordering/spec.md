## ADDED Requirements

### Requirement: Canonical AST-to-verified-CLIF phase DAG
The production compiler MUST execute one ordered path: parse, expand, mod rewrite, semantic and legality queries, `TypedProgram`, generated ISLE selection, stock CLIF emission, and CLIF verification.

#### Scenario: Production compilation path
- **GIVEN** a project-backed build, run, test, analyze, or LSP request
- **WHEN** the request needs semantic results or code generation
- **THEN** it uses the shared generation-safe frontend and never constructs HIR or invokes a legacy lowering entry

## REMOVED Requirements

### Requirement: Canonical parse-to-lowering phase DAG: Decision [D-COMP-BUILD-0018]
**Reason**: The existing phase DAG requires HIR normalization, resolution, typing, and HIR-to-CLIF lowering.
**Migration**: Use the canonical AST/Salsa-to-ISLE-to-verified-CLIF phase DAG.
