## MODIFIED Requirements

### Requirement: Diagnostic codes owned in analysis sources: Decision [D-COMP-SEM-0003]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Code-to-meaning mapping is normative in `SemanticIssueKind::code()` and `diagnostic_kinds.rs`, synchronized with trudoc verify scripts—not LSP presentation layers.

The inclusive range **E2101–E2199** is reserved for internal compiler
errors: a legality fact or an ISLE lowering rule/fact that is still
unavailable after the reachability-scoped semantic legality gate
(`compiler--build-pipeline--stage-ordering`, "Reachability-scoped legality
gate precedes specialization") has passed for the items being lowered.
E2101–E2199 codes SHALL NOT be assigned to an ordinary user-facing semantic
rule; an internal-error code SHALL carry the unavailable query or missing
rule name and its generation-bound site, and SHALL NOT be presented with a
user-facing diagnostic label. Ordinary semantic rules must not allocate
inside this band.

**Stable ID:** `BSP-REQ-072159A73908`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

#### Scenario: Internal-error band is reserved, not yet allocated
- **GIVEN** the reachability-scoped semantic legality gate has passed for
  every item a lowering request judges
- **WHEN** a legality fact or ISLE rule for one of those items' nodes is
  still `unavailable` (a genuine compiler-port gap, not a user error)
- **THEN** the compiler is permitted to report an internal-error code drawn
  from **E2101–E2199** carrying the query/rule name and the site; this
  change reserves the band and does not itself allocate E2101 or E2102 (a
  following change wires `SemanticError::unavailable_at`'s site into that
  rendering path at the module-emission boundary)
