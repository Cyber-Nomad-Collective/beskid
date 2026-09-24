## ADDED Requirements

### Requirement: Reachability-scoped legality gate precedes specialization
Before the reference compiler collects generic specializations or selects ISLE rules for a lowering request, it SHALL evaluate the legality facts of every item the request will lower: the requested roots, their direct-call closure, the scheduler helper closure, and every body discovered by conformance witness resolution. The compiler SHALL judge no item outside that set. When any legality fact yields a finding, the compiler SHALL report every finding of the pass as a coded diagnostic at its source site and SHALL NOT produce a backend artifact.

**Stable ID:** `BSP-REQ-LEGALITY-GATE-PRECEDES-SPECIALIZATION`

#### Scenario: Unimported type in a dependency unit
- **GIVEN** a test unit that calls a helper in another unit whose `let`
  declares `Result<u8[], FiberError>` without importing `FiberError`
- **WHEN** `beskid test` lowers that test
- **THEN** the run reports E1201 at the `let` in the helper's unit and
  reports no missing lowering rule

#### Scenario: Unreachable misuse does not poison the unit
- **GIVEN** a unit with two test items, one of which calls a direct function
  with the wrong number of arguments
- **WHEN** only the other test is requested
- **THEN** it lowers and runs; requesting the misusing test reports E1204 at
  the call

This requirement applies to every legality fact registered in
`beskid_queries::semantic_contract::legality`. This change includes E1201,
E1204, E1229, E1230, and E1231. Later changes can add the remaining entries
from the diagnostics table without changing this requirement's shape.

#### Scenario: Eager cleanup checks do not judge an unreachable item
- **GIVEN** a unit that contains an unreachable scoped-cleanup rejection or
  dead collection-growth violation
- **WHEN** the compiler lowers a different reachable item in that unit
- **THEN** the compiler SHALL NOT report E1230 or E1231 for the unreachable
  item
