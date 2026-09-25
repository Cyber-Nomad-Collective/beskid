## ADDED Requirements

### Requirement: Legality facts are positive findings
A legality fact SHALL describe the error it finds with a registered
diagnostic kind and the generation-bound key of its site. A semantic query
that cannot be decided because its port is incomplete SHALL remain
distinguishable as unavailable and SHALL NOT be mapped to a user diagnostic
code by message text.

**Stable ID:** `BSP-REQ-LEGALITY-FACTS-ARE-POSITIVE-FINDINGS`

#### Scenario: Compiler gap after a clean gate
- **GIVEN** an item whose legality facts yield no finding
- **WHEN** a later fact or ISLE rule is unavailable for one of its nodes
- **THEN** the compiler reports an internal error carrying the query or rule
  name and the site, with an internal-error code, and no user code

#### Scenario: Internal errors identify the failed compiler boundary
- **GIVEN** the legality gate yields no user finding for an item
- **WHEN** a semantic fact remains unavailable during specialization
- **THEN** the compiler SHALL report E2101 with the query name and source
  excerpt
- **WHEN** ISLE lowering has no required rule or fact for that item
- **THEN** the compiler SHALL report E2102 with the construct name and source
  excerpt

#### Scenario: A user error is never classified from an unavailable message
- **GIVEN** `unresolved_type_reference` finds an unresolved nominal type name
  in a type position of an item
- **WHEN** the legality gate evaluates that item
- **THEN** the finding is `SemanticFinding { kind:
  SemanticIssueKind::TypeUnknownType, site, .. }`, constructed directly from
  the fact's positive result, never by pattern-matching the text of a
  `SemanticError::unavailable(...)` message
