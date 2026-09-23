## ADDED Requirements

### Requirement: Build-time findings match analyze and LSP
A finding produced by a legality fact during `build`, `run`, or `test` SHALL carry the same code, message, and span as the same finding produced by `analyze` and by the LSP prepare tier for the same source generation.

**Stable ID:** `BSP-REQ-LEGALITY-FINDINGS-MATCH-ANALYZE-AND-LSP`

#### Scenario: Same E1201 from build and from analyze
- **GIVEN** a unit whose `let` declares a type argument that does not
  resolve
- **WHEN** `beskid build` and `beskid analyze` are each run against the same
  source generation
- **THEN** both report E1201 with the same message and the same source span

Note: this change (`add-reachability-scoped-semantic-legality-gate`) wires
the legality gate into `lower_syntax_program`, the caller `build`/`run`/
`test` share. It does not yet generalize
`beskid_analysis::services::prepare::TryDiagnosticAuthority` into a shared
`SemanticFactAuthority` for `analyze` and the LSP prepare tier (design
section 2.5); until a following change does, this requirement's `analyze`/
LSP half is satisfied only for findings World A's resolver/checker already
reports for the entry unit, not yet for every legality fact on every
reachable item. The requirement is recorded now so the following change is a
scoped extension, not a new capability.
