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

The block **E1234–E1255** SHALL be reserved for transfer, capture and move diagnostics, continuing the closure and spawn band after **E1233**. Codes SHALL be assigned as follows, and a code SHALL be emitted only from the release that owns it; until then the `SemanticIssueKind` variant SHALL exist with its code and SHALL have no emission site.

| Code | Kind | Condition | First emitted |
| --- | --- | --- | --- |
| **E1234** | `UseAfterMove` | Moved-class or `Fiber` value used after it was consumed | 0.6.2 |
| **E1235** | `CapturedLocalAssignedInBoundLambda` | `[Captures]` lambda assigns a captured local | 0.6.2 |
| **E1236** | `CaptureNotTransferable` | `[Captures]` lambda captures a value whose class the bound rejects | 0.6.2 |
| **E1237** | `MovedCaptureWithoutMove` | `[Captures]` lambda captures a Moved value without `move` | 0.6.2 |
| **E1238** | `CapturesArgumentNotLiteral` | argument to a `[Captures]` parameter is not a lambda literal or function item | 0.6.2 |
| **E1239** | `MoveOfNonOwningName` | `move` on a name that is not an owning Moved-class name | 0.6.2 |
| **E1240** | `MoveInLoopWithoutReassignment` | Moved value consumed in a loop body without reassignment before the next iteration | 0.6.2 |
| **E1241** | `BorrowEscapes` | borrowed Moved value stored, returned, captured or passed to a `move` parameter | 0.6.2 |
| **E1242** | `ImplicitAliasOfMovedValue` | Moved value stored, passed to a `move` parameter or returned while a live name still owns it | 0.6.2 |
| **E1243** | `DestructiveReadWithoutEmpty` | `move x.f` on a field type with no canonical empty value | 0.6.2 |
| **E1244** | `ImmutableFieldNotShared` | field of an `[Immutable]` type is not Shared | 0.6.1 |
| **E1245** | `ImmutableFieldAssignment` | assignment to or escape of a field of an `[Immutable]` object outside construction | 0.6.1 |
| **E1246** | `MarkerOnNeverTransferable` | `[Copyable]`, `[Isolated]` or `[Immutable]` on a never-transferable type | 0.6.1 |
| **E1247** | `MarkerFieldClassMismatch` | field class not admitted by `[Isolated]` or `[Copyable]` | 0.6.1 |
| **E1248** | `CapturesBoundNotMarker` | `[Captures]` bound is not a marker contract or sits on a non-function parameter | 0.6.2 |
| **E1249** | `InjectInsideIsolateBody` | `inject` field read inside a task body | 0.6.3 |
| **E1250–E1255** | reserved | unassigned | none |

From 0.6.2, **E1234–E1243** and **E1248** SHALL have emission sites in the query layer (`affine_ownership`, the `[Captures]` call-site fact and the attribute check), and **E1234** SHALL replace the former `SpawnDiagnosticKind::UseAfterMove` rendering for `Fiber` handles. The messages SHALL use the labels "moved here" for the consuming use and "borrowed here" for the borrowed declaration, and the help texts "write `move <name>`" (**E1237**, **E1242**), "use a reduction" (**E1235**), "pass the lambda literal" (**E1238**), "declare the parameter `move T <name>`" (**E1239** on a borrowed parameter, **E1241**) and "use `exchange(<place>, move <value>)`" (**E1243**).

From 0.6.3, **E1249** SHALL have an emission site in the query layer: a read of an `inject` field lexically inside a task body (a lambda literal passed to a `[Captures]` parameter) SHALL be reported at the field read with the message "composition is not available inside an isolate". The runtime fails closed for reads the static rule cannot see.

**E1509** and **E1510** SHALL be emitted by the query layer for attribute target declarations and attribute uses at every declaration site; **E1510** is no longer limited to `Extern` on a non-contract.

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

#### Scenario: Block codes present in the catalogue
- **GIVEN** `SemanticIssueKind::code()` after this change
- **WHEN** the codes E1234 through E1249 are looked up
- **THEN** each maps to the kind named in the table and no other kind maps to a code in E1234–E1255

#### Scenario: Codes of later releases have no emission in 0.6.1
- **GIVEN** the 0.6.1 compiler and the full surface test corpus
- **WHEN** every diagnostic emitted is collected
- **THEN** no E1234–E1243, E1248 or E1249 appears, and E1244–E1247 appear only in the marker and immutability tests

#### Scenario: Use after move renders with E1234
- **GIVEN** `unit Main(move u8[] buffer, Archive archive) { Archive a2 = archive.Add(move buffer); Log.Info(Array.Len<u8>(buffer)); }`
- **WHEN** `beskid check` reports the diagnostic
- **THEN** its code is **E1234**, its primary span is the second `buffer`, and a related label "moved here" points at `move buffer`


#### Scenario: Fiber double join renders with E1234
- **GIVEN** `i64 Main() { Fiber<i64> f = spawn Work(); i64 a = f.Join()?; return a + f.Join()?; }`
- **WHEN** `beskid check` reports the diagnostic
- **THEN** its code is **E1234** and no diagnostic with the former Fiber-only rendering is reported

#### Scenario: Injected read inside a task body renders with E1249
- **GIVEN** `s.Spawn(() => this.clock.Now())` where `clock` is an `inject global::` field
- **WHEN** `beskid check` reports the diagnostic
- **THEN** its code is **E1249**, its primary span is `this.clock`, and the message is "composition is not available inside an isolate"
