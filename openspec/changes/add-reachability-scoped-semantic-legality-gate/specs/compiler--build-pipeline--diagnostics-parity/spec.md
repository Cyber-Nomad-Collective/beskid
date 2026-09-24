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

The prepare spine SHALL use `SemanticFactAuthority` to collect legality
findings for the entry item's reachable direct-call closure. A finding in a
dependency unit SHALL retain that unit's source identity and span. The LSP
SHALL publish a finding only for the URI of the source unit that owns its
span.

#### Scenario: Dependency finding is published for its own URI
- **GIVEN** an entry unit that reaches a dependency unit with an unresolved
  type in a legality-checked item
- **WHEN** the LSP prepares diagnostics for the entry URI and for the
  dependency URI
- **THEN** the dependency finding is absent from the entry URI and is
  published once with E1201 for the dependency URI
