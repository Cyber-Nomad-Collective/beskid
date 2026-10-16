## MODIFIED Requirements

### Requirement: Diagnostic codes owned in analysis sources: Decision [D-COMP-SEM-0003]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Code-to-meaning mapping is normative in `SemanticIssueKind::code()` and `diagnostic_kinds.rs`, synchronized with trudoc verify scripts—not LSP presentation layers.

E1230 identifies a scoped-cleanup rejection. E1231 identifies a dead
collection-growth violation. Both codes are user-facing semantic diagnostics
and SHALL identify the offending source site.

The inclusive range **E2101–E2199** is reserved for internal compiler
errors: a legality fact or an ISLE lowering rule/fact that is still
unavailable after the reachability-scoped semantic legality gate
(`compiler--build-pipeline--stage-ordering`, "Reachability-scoped legality
gate precedes specialization") has passed for the items being lowered.
E2101–E2199 codes SHALL NOT be assigned to an ordinary user-facing semantic
rule; an internal-error code SHALL carry the unavailable query or missing
rule name and its generation-bound site, and SHALL NOT be presented with a
user-facing diagnostic label. Ordinary semantic rules must not allocate
inside this band. E2101 identifies an unavailable semantic fact after the
gate has passed. E2102 identifies a missing ISLE lowering rule or fact after
the gate has passed. E2103–E2199 remain reserved.

**E1233** identifies a lambda capture of a stack reference: a lambda that is not a `spawn` operand captures a `mut` local or a native pointer. Captures are by-value snapshots, so the capture would silently stop aliasing its source. E1233 is a user-facing semantic diagnostic. It SHALL identify the lambda expression and name the captured binding. A `spawn` operand that captures a stack reference keeps **E1225**.

**E1209** also identifies a string concatenation or interpolation operand whose proven type has no text form (a nominal, array or function value, `char`, `u64`, `word`, `unit`). The diagnostic SHALL name the source type of the operand and SHALL be reported at the operand.

**Stable ID:** `BSP-REQ-072159A73908`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

#### Scenario: Scoped cleanup and dead growth have user-facing codes
- **GIVEN** a legality-checked item contains a scoped-cleanup rejection or a
  dead collection-growth violation
- **WHEN** the reachability-scoped legality gate evaluates the item
- **THEN** the compiler SHALL report E1230 or E1231 at the offending source
  site

#### Scenario: Internal-error codes identify the missing boundary
- **GIVEN** the reachability-scoped semantic legality gate has passed for
  every item a lowering request judges
- **WHEN** a legality fact or ISLE rule for one of those items' nodes is
  still `unavailable` (a genuine compiler-port gap, not a user error)
- **THEN** the compiler SHALL report E2101 for an unavailable semantic fact
  or E2102 for a missing ISLE rule or fact, carrying the query or rule name
  and the site

#### Scenario: Lambda capture of a mutable binding
- **GIVEN** `i64 Main() { mut i64 count = 1; let read = () => count; return read(); }`
- **WHEN** the legality gate judges `Main`
- **THEN** the compiler SHALL report **E1233** at the lambda, naming `count`
- **AND** the compiler SHALL NOT report an internal error for the lambda

#### Scenario: Interpolation of a nominal value
- **GIVEN** `type Point { i64 x }` and `string Show(Point p) { return "at ${p}"; }`
- **WHEN** `beskid check` judges `Show`
- **THEN** the compiler SHALL report **E1209** at the `p` operand, naming `Point`
