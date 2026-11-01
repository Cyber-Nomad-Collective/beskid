<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Diagnostic code registry Specification

## Purpose

Registry contract for semantic diagnostic code ownership and synchronization with compiler sources.
## Requirements
### Requirement: Feature hub authority: Decision [D-COMP-SEM-0001]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> This feature hub **owns** normative MUST/SHOULD contract text. Sibling articles **must not** redefine hub requirements and **should** link here for authority.

**Stable ID:** `BSP-REQ-1F3AB2963760`  
**Legacy source:** `site/spec-content/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/adr/0001-feature-hub-authority/content.md`  
**Source SHA-256:** `e8135c0b87c948d578f9b73d4193ca432d44d4df6a66c35e02a57ee3ce03720b`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Specification over implementation notes: Decision [D-COMP-SEM-0002]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Normative platform-spec prose and ADRs under this feature **supersede** informal comments in implementation crates until explicitly migrated into spec text.

**Stable ID:** `BSP-REQ-CD3431381590`  
**Legacy source:** `site/spec-content/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/adr/0002-spec-over-implementation-notes/content.md`  
**Source SHA-256:** `02b8a7438ebb7798fed5ad09405420789581fc9e7df20f6d3fd5eb58d1a8caa2`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

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
- **GIVEN** `type Point { i64 x; }` and `string Show(Point p) { return "at ${p}"; }`
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

### Requirement: Dead assignment to a mutable parameter
The code **E1259** SHALL identify an assignment to a `mut` parameter whose value no later read of the parameter can observe. The message SHALL have the form "the value assigned to the `mut` parameter `<name>` is never read". The primary span SHALL be the assignment. The diagnostic SHALL have a related note at the parameter declaration with the text "`<name>` is passed by value". The help SHALL tell the user to return the new value, or to assign the fields of the caller's object.

#### Scenario: Dead assignment to a parameter
- **GIVEN** `unit AssignWhole(mut Size s) { s = Size { columns: 80, rows: 24, }; }`
- **WHEN** the code is checked
- **THEN** the compiler SHALL report **E1259** at the assignment with the message "the value assigned to the `mut` parameter `s` is never read" and the note "`s` is passed by value"

### Requirement: Default parameter codes E1251 to E1256
The registry SHALL allocate: **E1251** a required parameter after an optional parameter; **E1252** a default value that is not a compile-time constant; **E1253** a default value that does not fit the parameter type; **E1254** a default value or caller-information attribute on a hook parameter or a `bulk` parameter; **E1255** a caller-information parameter without a default value; **E1256** a caller-information parameter of the wrong type. **E1612** an implementation default value that differs from the contract. **E1204** SHALL identify an argument count outside the range of the callee and SHALL state the range.

#### Scenario: Codes are stable
- **GIVEN** the registry page
- **WHEN** a tool looks up E1251 to E1256
- **THEN** each code has the meaning listed in this requirement

### Requirement: Missing return at end of body
The code **E1258** SHALL identify a function or method whose declared result is not `unit` or `never` and whose end of body is reachable. The message SHALL have the form "`<name>` can reach the end of its body without returning a value". The primary span SHALL be the closing brace of the body. The diagnostic SHALL have a related note at the declared name with the text "`<name>` returns `<type>`".

#### Scenario: Value function without a final return
- **GIVEN** `i32 Main() { 0; }`
- **WHEN** the code is checked
- **THEN** the compiler SHALL report **E1258** at the closing brace with the message "`Main` can reach the end of its body without returning a value" and the note "`Main` returns `i32`"

### Requirement: Parse error codes and unused-item warning
The inclusive range **E0101–E0199** SHALL be reserved for parse errors. The codes **E0101–E0117** are allocated: E0101 unexpected token, E0102 missing `;`, E0103 unclosed delimiter, E0104 `host` without a parameter list, E0105 `++` or `--`, E0106 typed `let`, E0107 reserved word used as a name, E0108 block used as a match-arm value, E0109 unknown string escape, E0110 invalid `\u{...}` value, E0111 unexpected syntax tree shape, E0112 `self` parameter, E0113 nothing to parse, E0114 character literal with more than one character, E0115 comma between type fields, E0116 conditional expression without `:`, E0117 documentation comment that is not attached to an item. Every parse error SHALL carry a code from this range. A parse code SHALL NOT be reused for another rule. The code **W2101** SHALL identify an unused item, and a diagnostic with that code SHALL carry the `Unnecessary` tag. A parse error message SHALL say what the parser was parsing, in the form "Expected X while parsing Y", with Y written in plain words. A table from each grammar rule to its plain words SHALL exist beside the grammar, and a test SHALL fail when a rule has no entry. All codes SHALL link to the registry page of this capability.

#### Scenario: Parse error has a code
- **GIVEN** the source `host Greeter { }` where `(` is expected
- **WHEN** the file is parsed
- **THEN** the diagnostic carries a code from E0101–E0199 and the message reads "Expected `(` while parsing host `Greeter`."

#### Scenario: Unused item
- **GIVEN** a private function that no item uses
- **WHEN** the file is analyzed
- **THEN** the compiler reports **W2101** with the `Unnecessary` tag

#### Scenario: Unknown string escape
- **GIVEN** the literal `"\q"`
- **WHEN** the file is parsed
- **THEN** the compiler SHALL report **E0109** on the escape

#### Scenario: Rule without words
- **GIVEN** a grammar rule that has no entry in the rule-to-words table
- **WHEN** the completeness test runs
- **THEN** the test fails

### Requirement: Composition codes E1717 to E1725
The registry SHALL allocate: **E1717** `startup` hook inside a named scope; **E1718** contract registered as itself; **E1719** registered type that the container cannot create (value field, generic, enum); **E1720** registration for a contract that the type does not conform to; **E1721** `with` that does not follow `launch` in the same function body; **E1722** a `launch` whose argument count does not match the host parameters, or that passes arguments to a launched host from another unit; **E1723** parameters on a base host or on a scope of a base host; **E1724** the same implementation registered twice for one key in one host and scope; **E1725** a host-level `single` that injects a per-activation service, directly or through a `transient`. **E1708** SHALL identify a `with` whose argument count does not match the scope parameters. **E1705** SHALL identify a singular `inject` that matches several registrations, and **E1713** SHALL identify a lifetime mismatch in a host override and SHALL name the contract.

#### Scenario: Codes are stable
- **GIVEN** the registry page
- **WHEN** a tool looks up E1717 to E1723
- **THEN** each code has the meaning listed in this requirement

### Requirement: Ambiguous module qualifier diagnostic
The code **E1104** SHALL also identify a qualified path whose first segment names both an inline module and a `use` alias, where each of them reaches a different item for the rest of the path. The message SHALL have the form "ambiguous module `<Name>`: both the inline module `<Name>` and the import `<Path>` declare `<Member>`". The primary span SHALL be the path. The help SHALL tell the user to rename the inline module or to import the module under another name with `use <Path> as <Name>;`.

#### Scenario: Ambiguous qualifier message
- **GIVEN** `use Core.Random;`, `mod Random { pub i64 New() { return 5; } }` and `return Random.New();`
- **WHEN** the code is checked
- **THEN** the compiler SHALL report **E1104** at `Random.New` with the message "ambiguous module `Random`: both the inline module `Random` and the import `Core.Random` declare `New`"

### Requirement: One code per duplicate name
A duplicate function, type, enum, contract, `use` alias, module declaration, constant or test in one scope SHALL be reported only as **E1102**. The codes **E1001** and **E1006** SHALL NOT be emitted and SHALL NOT be in the code registry; they SHALL NOT be reused for another meaning. **E1104** SHALL identify an ambiguous name or module path, not a duplicate `use` alias.

#### Scenario: Duplicate use alias
- **GIVEN** `use Core.Random;` twice in one scope
- **WHEN** the code is checked
- **THEN** the compiler SHALL report **E1102** once and SHALL NOT report **E1006** or **E1104**

#### Scenario: Duplicate type
- **GIVEN** `type Point { i64 x; }` twice in one scope
- **WHEN** the code is checked
- **THEN** the compiler SHALL report **E1102** once and SHALL NOT report **E1001**

### Requirement: Literal does not fit its type
The code **T0905** SHALL identify a numeric literal whose value does not fit the type given by its context or suffix. The message SHALL have the form "`<value>` does not fit in `<type>`" and SHALL be reported at the literal. The literal SHALL NOT be wrapped or truncated.

#### Scenario: Negative unsigned
- **GIVEN** `u32 x = -1;`
- **WHEN** the code is checked
- **THEN** the compiler SHALL report **T0905** with the message "`-1` does not fit in `u32`"

### Requirement: Invalid primitive implementation E1611
The code **E1611** SHALL identify an invalid implementation block for a primitive type. It SHALL be reported at the block, and the block SHALL issue no conformance.

#### Scenario: Unit cannot conform
- **GIVEN** `impl unit : Formatting { }`
- **WHEN** the block is checked
- **THEN** the compiler SHALL report **E1611**

### Requirement: Internal-error floor E2101 to E2105
The registry SHALL allocate: **E2101** an unavailable semantic fact after the legality gate; **E2102** a missing ISLE lowering rule or fact; **E2103** any other lowering invariant failure, including verification failures; **E2104** a failure of Mod semantic authority; **E2105** a build failure that has no source site, such as a text-only compiler gap, a duplicate symbol or a module error. Every internal error SHALL be reported as exactly one of these codes. The message SHALL have the form "internal compiler error: <summary in words>; please report this". The label SHALL be "the compiler failed here", the help SHALL name the issue tracker and the internal reason, and the diagnostic SHALL be reported at the construct that failed. A failure without a site SHALL be reported at the start of the entry unit with the label "while compiling this program". An invalid CLIF block SHALL NOT be an internal error; it SHALL be **E1232** at the block. E2106–E2199 SHALL stay reserved.

#### Scenario: Lowering failure
- **GIVEN** a construct for which lowering finds no rule
- **WHEN** the program is built
- **THEN** the compiler reports one diagnostic with a code from E2101–E2105 at the construct, with the text "internal compiler error" and "please report this"

#### Scenario: Failure without a site
- **GIVEN** a duplicate symbol at link time
- **WHEN** the program is built
- **THEN** the compiler reports **E2105** at the start of the entry unit

### Requirement: CopyOnAssign diagnostic E1512
The code **E1512** SHALL identify a type that carries `[CopyOnAssign]` and has no valid `Copy` method. A valid method is exactly one method named `Copy` with a borrowed receiver, no parameters and the type as return type. The diagnostic SHALL be reported at the attribute, and the help SHALL name the required method `This Copy()`.

#### Scenario: Missing Copy
- **GIVEN** `[CopyOnAssign] type Bag { i64 n; }` without a `Copy` method
- **WHEN** the type is checked
- **THEN** the compiler SHALL report **E1512** at the attribute

### Requirement: Unused item warning W2101
The code **W2101** SHALL identify an unused private item and SHALL replace **W1504**. The code W1504 SHALL be retired. The message SHALL have the form "`Helper` is never used", the label SHALL be "unused function" (or the kind of the item), and the diagnostic SHALL carry the `Unnecessary` tag and a `MaybeIncorrect` fix that removes the item.

#### Scenario: Unused private function
- **GIVEN** a private function `Helper` that no item uses
- **WHEN** the file is analyzed
- **THEN** the compiler SHALL report **W2101** with the message "`Helper` is never used"

### Requirement: Serialize help for a Serializable bound
When a generic bound `Serializable` is violated by a type `T` (**E1610**), the help SHALL say "add `[Serialize]` to type `T` so the compiler derives its `Serializable` conformance". When the declaration of `T` is in the analysed source, the diagnostic SHALL carry a machine-applicable fix that inserts the attribute `[Serialize]` on its own line above the declaration of `T`.

#### Scenario: Missing Serialize attribute
- **GIVEN** `type Point { i64 x; }` without `[Serialize]` and a call that requires `Point: Serializable`
- **WHEN** the call is checked
- **THEN** the compiler SHALL report **E1610** with the help "add `[Serialize]` to type `Point` so the compiler derives its `Serializable` conformance" and a machine-applicable fix that inserts `[Serialize]` above `type Point`

### Requirement: Discarded array growth W1240
The code **W1240** SHALL identify an `Array.Append` or `Array.RemoveLast` call used as a statement on an array that the caller does not own (a parameter that is not `mut` or `move`, a loop or pattern variable, a lambda parameter, a call result, an element), so that the result is discarded and the array is not changed: the call works on a copy. The message SHALL have the form "the result of `Array.Append` is discarded; the call works on a copy, so `xs` is not changed" (with `Array.RemoveLast` for a shrink) and SHALL be reported at the call. The help SHALL suggest using the result or passing an owner, and the help and the fix SHALL depend on the kind of the argument. For a parameter that is not `mut`, the fix SHALL declare the parameter `mut` (machine-applicable). For a pattern binding or a lambda parameter, the fix SHALL assign the result to the name (machine-applicable). For a `for` variable, a call result or an element, the fix SHALL use the result in a new local, `T[] grown = Array.Append(...)` or `T[] shortened = Array.RemoveLast(...)` when the element type is known (applicability `MaybeIncorrect`). A call whose first argument is an owner (a `let` local, a `mut` or `move` parameter, a field), and a call whose result is used, SHALL NOT be reported. `Array.TryAppend` is not covered, because it returns a flag.

#### Scenario: Non-mut parameter
- **GIVEN** `unit Add(i64[] xs) { Array.Append<i64>(xs, 1); }`
- **WHEN** the function is checked
- **THEN** the compiler SHALL report **W1240** at the call with a machine-applicable fix that declares `mut i64[] xs`

#### Scenario: Pattern binding
- **GIVEN** a pattern binding `xs` and the statement `Array.Append<i64>(xs, 1);`
- **WHEN** the code is checked
- **THEN** the compiler SHALL report **W1240** with a fix that assigns the result to `xs`

#### Scenario: Discarded shrink of a parameter or an element
- **GIVEN** `unit Trim(i64[] xs, i64[][] rows) { Array.RemoveLast<i64>(xs); Array.RemoveLast<i64>(rows[0]); }`
- **WHEN** the function is checked
- **THEN** the compiler SHALL report **W1240** at both calls, and the fix for the element SHALL bind `i64[] shortened = Array.RemoveLast<i64>(rows[0]);`

#### Scenario: Owned array
- **GIVEN** `mut i64[] xs = Array.Empty<i64>(); Array.Append<i64>(xs, 1);`
- **WHEN** the code is checked
- **THEN** no diagnostic is reported

### Requirement: Corelib seal and retired lock codes
The code **E3032** SHALL identify a Corelib bundle whose content does not match its fingerprint. The code **E3025** SHALL identify a `Project.lock` file whose first line is not `# Project.lock v3`. The message of **E3025** SHALL name the lock file and SHALL tell the user to delete the file and run `beskid dev project lock` to write a new one. The code **E3024** is retired: the compiler SHALL NOT emit it, and the registry SHALL NOT give it a new meaning.

#### Scenario: Codes are stable
- **GIVEN** the registry page
- **WHEN** a tool looks up E3025 and E3032
- **THEN** each code has the meaning listed in this requirement

#### Scenario: Retired code
- **GIVEN** the registry
- **WHEN** a tool looks up E3024
- **THEN** the registry has no entry for it

### Requirement: Test name case diagnostic
The code **W1637** SHALL identify a `test` name that is not PascalCase. The code SHALL keep its number. Before 0.6.7 it identified a test name that was not snake_case. The warning SHALL be reported on the test name token.

#### Scenario: Snake_case test name
- **GIVEN** `test parse_empty_input { }`
- **WHEN** the naming check runs
- **THEN** the compiler SHALL report **W1637** on `parse_empty_input`

#### Scenario: PascalCase test name
- **GIVEN** `test ParseEmptyInput { }`
- **WHEN** the naming check runs
- **THEN** no diagnostic is reported

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Diagnostic code registry

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/`  
**Source:** `site/spec-content/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/content.md`  
**SHA-256:** `932e34eb5144b88939b0ac2c42ca67f236795d9a21602db68f6c5dda86f018fd`

<details>
<summary>Migrated source text</summary>

``````markdown
## What this feature governs

This feature defines ownership and evolution rules for semantic diagnostic codes in `SemanticIssueKind::code()` and neighboring catalog logic. It keeps diagnostics stable for tooling, docs, and conformance references.

## Core guarantees

1. Diagnostic code-to-meaning mapping is normative in compiler source, not in rendering layers.
2. New semantic issues must use unique, documented codes before release.
3. Registry updates must remain synchronized with platform-spec documentation and verification scripts.
4. Renaming or reusing existing codes requires explicit migration handling for downstream consumers.

## Implementation anchors

- `compiler/crates/beskid_analysis/src/analysis/diagnostic_kinds.rs`
- `compiler/crates/beskid_analysis/src/analysis`
- `compiler/crates/beskid_analysis/src/doc/validate.rs`
- `compiler/crates/beskid_analysis/src/services/`
- `packages/trudoc/scripts/verify-diagnostics-spec-sync.mjs`
## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-SEM-0001` … `D-COMP-SEM-0003`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Design model](./articles/design-model/)
- [Examples](./articles/examples/)
- [FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Flow and algorithm](./articles/flow-and-algorithm/)
- [Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Feature hub authority

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/adr/0001-feature-hub-authority/`  
**Source:** `site/spec-content/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/adr/0001-feature-hub-authority/content.md`  
**SHA-256:** `e8135c0b87c948d578f9b73d4193ca432d44d4df6a66c35e02a57ee3ce03720b`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Sibling articles under this feature previously restated requirements in inconsistent forms.

## Decision

This feature hub **owns** normative MUST/SHOULD contract text. Sibling articles **must not** redefine hub requirements and **should** link here for authority.

## Consequences

Contract changes start on the hub or in linked ADRs, then propagate to articles and implementation anchors.

## Verification anchors

- `site/website/src/content/docs/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/index.mdx`
- `article bundle under the same feature directory.`
``````

</details>

### Source Record: Specification over implementation notes

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/adr/0002-spec-over-implementation-notes/`  
**Source:** `site/spec-content/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/adr/0002-spec-over-implementation-notes/content.md`  
**SHA-256:** `02b8a7438ebb7798fed5ad09405420789581fc9e7df20f6d3fd5eb58d1a8caa2`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Implementation crates accumulated informal notes that diverged from published contracts.

## Decision

Normative platform-spec prose and ADRs under this feature **supersede** informal comments in implementation crates until explicitly migrated into spec text.

## Consequences

Engineers file spec/ADR updates when behavior changes; crate comments are non-authoritative for conformance arguments.

## Verification anchors

- `compiler/crates/beskid_analysis/src/analysis/diagnostic_kinds.rs`
- `compiler/crates/beskid_analysis/src/analysis`
- `compiler/crates/beskid_analysis/src/doc/validate.rs`
``````

</details>

### Source Record: Diagnostic codes owned in analysis sources

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/adr/0003-codes-owned-in-analysis/`  
**Source:** `site/spec-content/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/adr/0003-codes-owned-in-analysis/content.md`  
**SHA-256:** `9fae97e060b40dbd98e9baab68cf2cb1750678234b351c383f784313fd206180`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Rendered diagnostics drifted from semantic registry.

## Decision

Code-to-meaning mapping is normative in `SemanticIssueKind::code()` and `diagnostic_kinds.rs`, synchronized with trudoc verify scripts—not LSP presentation layers.

## Consequences

Renaming codes requires migration notes; new issues need unique codes before release.

## Verification anchors

- `compiler/crates/beskid_analysis/src/analysis/diagnostic_kinds.rs`
- `packages/trudoc/scripts/verify-diagnostics-spec-sync.mjs`.
``````

</details>

### Source Record: Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/articles/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/articles/contracts-and-edge-cases/content.md`  
**SHA-256:** `b5eb836c3af234c01314fd3bb44db0ec7ddd6ee67ca6dbef31ba067b7ca65ff4`

<details>
<summary>Migrated source text</summary>

``````markdown
Registry contracts:

- Codes must be unique and semantically stable once published.
- Rules may evolve messages, but not silently repurpose existing codes.
- Deprecated codes should remain documented until consumer migration is complete.

Edge cases:

- Splitting one broad issue into multiple specific codes can break external filters.
- Merging codes can hide important distinctions used by editor workflows.
- Reordering kinds without preserving explicit mappings may create accidental code churn.
``````

</details>

### Source Record: Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/articles/design-model/content.md`  
**SHA-256:** `dde25b646ee45fd7989c2556e09942643e93b49e889d8160a7d30a40a7dca594`

<details>
<summary>Migrated source text</summary>

``````markdown
The registry model is intentionally centralized:

- `diagnostic_kinds.rs` owns code identities and semantic categories.
- Rule modules reference kinds, not hard-coded code strings.
- Delivery adapters (CLI/LSP) preserve code identity while formatting messages.

This avoids drift between compiler internals and platform documentation, and it makes diagnostics easier to consume in editors and machine-readable tooling.

## Mod, manifest, and mod-host band (**E1801–E1899**)

The inclusive range **E1801–E1899** is owned by compiler-mod manifest validation and mod-host failures. Ordinary semantic rules must not allocate inside this band. Register each allocated code in `compiler/crates/beskid_analysis/src/analysis/diagnostic_kinds.rs` and extend this table in the same change.

| Code range | Owner | Intended failures (examples) |
| --- | --- | --- |
| **E1801–E1810** | `beskid_analysis::projects` manifest parse | Unknown `mod` key, invalid `maxGeneratorRounds`, malformed capabilities list, Meta→Mod migration (see table below). |
| **E1811–E1820** | Workspace / graph resolution | Invalid Mod dependency topology, unresolved mod package, incompatible host/mod graph constraints. |
| **E1821–E1835** | Mod host / capabilities | Denied capability, exceeded `maxGeneratorRounds`, sandbox violation, AOT artifact load/bootstrap failure (see **[AOT artifact contract](/platform-spec/compiler/compiler-mods/mod-host-bridge/aot-artifact-contract/)**). |
| **E1836–E1850** | Typed merge / rewrite | Conflicting generator edits, illegal typed contribution, invalid typed rewrite, merge rollback. |
| **E1851–E1870** | Contract discovery / execution | Missing required contracts, invalid contract signatures, collector scope violations, analyzer/rewriter registration errors. |
| **E1871–E1899** | **Reserved** / Bsol project shape | Buffer for staged rollout; allocate in order and extend this table when used. **E1886–E1888** are allocated to Bsol project-shape validation (see sub-table below). |

### Meta→Mod migration and manifest parse (**E1801–E1810**, normative)

| Code | When emitted |
| --- | --- |
| **E1801** | Unknown key inside `project.mod`. |
| **E1802** | `maxGeneratorRounds` missing, non-positive, or not an integer. |
| **E1803** | `capabilities` entry not in the closed vocabulary. |
| **E1804** | `artifactPolicy` value not in `reuse` / `rebuild` / `clean_rebuild`. |
| **E1805** | `type: Mod` project declares a `target` block (forbidden). |
| **E1806** | Compiler-mod `contract` item declared outside a `type: Mod` project. |
| **E1807** | Deprecated `type: Meta` or nested `meta { }` manifest section (use `Mod` / `mod { }`). |
| **E1808** | Removed `attachTo` key on mod/manifest (use `Collector` scope). |
| **E1809** | Removed `entryModules` key (use contract discovery). |
| **E1810** | Legacy `max_meta_rounds` or other removed mod keys. |

### Mod artifact load (**E1821–E1835**, normative)

Individual codes are defined in **[Mod host bridge / AOT artifact contract](/platform-spec/compiler/compiler-mods/mod-host-bridge/aot-artifact-contract/)** (**E1821** missing artifact through **E1835** bootstrap catch-all). Hosts **must** prefer the most specific code before **E1835**.

### Typed merge (**E1836–E1850**, normative)

| Code | When emitted |
| --- | --- |
| **E1836** | Two generators target the same declaration identity in one generation round. |
| **E1837** | Typed contribution fails well-formedness / parser re-check after merge. |
| **E1838** | `Rewriter` returned an illegal target node kind. |
| **E1839** | Merge rolled back — syntax tree unchanged after failure. |
| **E1840–E1850** | **Reserved** for additional merge/rewrite failures. |

### Contract discovery (**E1851–E1870**, normative)

| Code | When emitted |
| --- | --- |
| **E1851** | Module-level `meta` item or other forbidden grammar in a Mod/host compilation unit. |
| **E1852** | Required `Collector` contract missing from artifact registrations. |
| **E1853** | `contractId` in descriptor not recognized by host. |
| **E1854** | Public type does not implement declared `contractId`. |
| **E1855** | `entrySymbol` missing from native export table. |
| **E1856** | Collector scope references unresolved compilation member. |
| **E1857** | Analyzer registration conflicts with capability set. |
| **E1858** | Rewriter generic instantiation does not match source node kind. |
| **E1859–E1870** | **Reserved** for contract execution failures. |

### Bsol project shape (**E1886–E1888**, normative)

Bsol project-shape validation emits these codes from `beskid_analysis::projects` (manifest validator and compile-plan builder). They use the `ProjectError::meta_contract` string-code pattern, consistent with the rest of the E1801–E1899 manifest band.

| Code | When emitted |
| --- | --- |
| **E1886** | `type = Bsol` project declares a `target` block (forbidden — schema packages are not compile roots). |
| **E1887** | `type = Bsol` project has no nested `schemas { export ... }` block. |
| **E1888** | A `beskid build` targets a `Bsol` project (use `beskid dev bsol validate <manifest>.bproj` instead). |

## Language macro expansion (**E1901–E1999**)

The inclusive range **E1901–E1999** is owned by **`macro.expand`** and macro definition validation. Ordinary semantic rules must not allocate inside this band.

| Code | When emitted |
| --- | --- |
| **E1901** | `name!` invocation with no resolving `macro` binding in scope. |
| **E1902** | Argument count does not match macro parameter list. |
| **E1903** | Actual argument shape does not match declared fragment kind. |
| **E1904** | **`$param`** reference in a non-macro body or unknown parameter name. |
| **E1905** | **`maxMacroExpansionDepth`** exceeded (default 32). |
| **E1906** | Expanded tree fails well-formedness / structural validation. |
| **E1907** | Ambiguous macro name (multiple `macro` bindings in scope). |
| **E1908** | `macro` definition with duplicate parameter names. |
| **E1909** | Invalid or unknown fragment kind keyword in macro parameter list. |
| **E1910–E1999** | **Reserved** for macro hygiene and item-splice failures. |

See **[Language macros](/platform-spec/language-meta/metaprogramming/macros/)**.

## Project template scaffolding (**E2001–E2099**)

The inclusive range **E2001–E2099** is owned by the project template engine (`beskid_template`). Ordinary semantic rules must not allocate inside this band.

| Code | When emitted |
| --- | --- |
| **E2001** | Template manifest missing or invalid schema. |
| **E2002** | Package kind is not `template`. |
| **E2003** | Required symbol not provided. |
| **E2004** | Output path conflict. |
| **E2005** | Item template outside project root. |
| **E2006** | GUID replacement incomplete. |
| **E2007** | Git template source failed. |
| **E2008** | Workspace template invalid member graph. |
| **E2099** | Reserved internal template engine error. |
| **E2009–E2098** | **Reserved** for future template-engine diagnostics. |

See **[Project templates](/platform-spec/tooling/project-scaffolding/project-templates/)**.

## Documentation comment diagnostics (**W1610–W1619**, **W1620–W1625**)

The inclusive ranges **W1610–W1619** and **W1620–W1625** are reserved for **leading documentation body** validation (triple-slash mini-language: `@ref`, `@arg`, `@returns`, `@variant`, `@par`, and unknown directives). These warnings are produced from the document-analysis snapshot after name resolution succeeds; they **must not** use ad hoc string codes outside `SemanticIssueKind`. Hard errors for documentation are **not** allocated in v1; if a future policy introduces blocking documentation failures, allocate **E1610–E1629** in this document and in `diagnostic_kinds.rs` before use.

| Code | Meaning (summary) |
| --- | --- |
| **W1610** | `@arg` names a parameter that does not exist on the documented callable. |
| **W1611** | Duplicate `@arg(name)` for the same item. |
| **W1612** | `@arg` / `@returns` on an item that is not a supported callable. |
| **W1613** | `@returns` on a `unit` return (redundant). |
| **W1614** | Unknown documentation directive (`@foo` not in the supported registry). |
| **W1615** | Unresolved `@ref(...)` path. |
| **W1616–W1619** | **Reserved** for documentation-quality rules. |
| **W1620** | `@variant(...)` used outside an enum declaration’s leading documentation. |
| **W1621** | `@variant(name)` does not match any enum variant. |
| **W1622** | Duplicate `@variant(name)` in the same block. |
| **W1623** | `@par(...)` where the declaration has no generic type parameters. |
| **W1624** | `@par(name)` does not match a generic type parameter on the item. |
| **W1625** | Duplicate `@par(name)` in the same block. |

## Code style and naming (**W1630–W1639**)

The inclusive range **W1630–W1639** is owned by **[Code style and naming](/platform-spec/language-meta/program-structure/code-style-and-naming/)**. These warnings **should** be produced by style lint rules after name resolution; they **must not** use ad hoc string codes outside `SemanticIssueKind`.

| Code | Meaning (summary) |
| --- | --- |
| **W1630** | `type`, `enum`, or `contract` name is not **PascalCase** |
| **W1631** | Enum variant name is not **PascalCase** |
| **W1632** | Type field or named variant payload field is not **lowerCamelCase** |
| **W1633** | Function or type method name is not **PascalCase** |
| **W1634** | Module path segment is not **PascalCase** |
| **W1635** | Generic type parameter is not **PascalCase** |
| **W1636** | Parameter or local binding is not **lowerCamelCase** (except `self`) |
| **W1637** | `test` name is not **snake_case** |
| **W1638** | `macro` name is not **lowerCamelCase** |
| **W1639** | **Reserved** |

Codes **must** be stable across patch releases once shipped; breaking message text is allowed only with a migration note in **[Rules and diagnostics catalog](/platform-spec/compiler/semantic-pipeline/rules-and-diagnostics-catalog/)**.

## User FFI diagnostics (**E1520–E1539**, v0.3)

The inclusive range **E1520–E1539** is owned by **[FFI and extern](/platform-spec/language-meta/interop/ffi-and-extern/)** and **[Export and callbacks](/platform-spec/language-meta/interop/export-and-callbacks/)** validation. These codes are **normative in platform-spec v0.3**; the reference compiler may still emit legacy **`T0901–T0904`** until migration completes—tests **must** accept either code during the transition, then **only E152x** once `diagnostic_kinds.rs` maps `TypeError::Extern*` to `SemanticIssueKind`.

| Code | When emitted | Reference compiler (transition) |
| --- | --- | --- |
| **E1520** | `Extern` **`Abi`** is not **`"C"`** | **T0901** |
| **E1521** | `Extern` contract missing non-empty **`Library`** | **T0902** |
| **E1522** | Disallowed parameter type on extern method | **T0903** |
| **E1523** | Disallowed return type on extern method | **T0904** |
| **E1524** | **`Export`** on non-`pub` function or disallowed item | *(planned)* |
| **E1525** | **`Export`** signature uses disallowed FFI type | *(planned)* |
| **E1526** | Unknown **`Symbol`** override or duplicate export symbol | *(planned)* |
| **E1527** | **`Transfer`** / interop view misuse at boundary | *(planned)* |
| **E1528** | **`CLayout`** violation (v0.3.1) | *(planned)* |
| **E1529** | Callback type is not a permitted function-pointer shape | *(planned)* |
| **E1530–E1539** | **Reserved** | Buffer for link manifest and import CLI failures |

Attribute placement errors remain in the **E1508–E1510** band (**E1510** = `Extern` on non-contract).
``````

</details>

### Source Record: Examples

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/articles/examples/`  
**Source:** `site/spec-content/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/articles/examples/content.md`  
**SHA-256:** `07f90723d78fee75594d2ca182f5dafa680f83a8d1b97884888d18a36dd7b033`

<details>
<summary>Migrated source text</summary>

``````markdown
Example A: adding a new semantic issue

1. Add a new issue kind and code in `diagnostic_kinds.rs`.
2. Emit it from the relevant staged rule.
3. Add/update docs and sync checks.
4. Verify CLI and LSP both expose the new code.

Example B: deprecating an old code

1. Keep legacy code mapping documented.
2. Route rule output to a replacement code behind an explicit migration step.
3. Update troubleshooting notes for users with code-based alerting.
``````

</details>

### Source Record: FAQ and troubleshooting

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/articles/faq-and-troubleshooting/`  
**Source:** `site/spec-content/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/articles/faq-and-troubleshooting/content.md`  
**SHA-256:** `b295587a5df3b500dafe31225f4ee65af199b009accacbbbaeacf2c55cebf85d`

<details>
<summary>Migrated source text</summary>

``````markdown
### A new rule compiles, but docs sync fails. Why?

The rule likely emits a kind not represented in the documented registry mapping. Update both source and docs references together.

### Can I rename an existing diagnostic code?

Treat code renames as migrations, not inline edits. Preserve compatibility notes and update downstream filters before removing old identifiers.

### Where do I debug code mismatch between CLI and editor?

Start with `diagnostic_kinds.rs`, then check conversion in analysis services and LSP diagnostics adapters to ensure code strings are passed through unchanged.
``````

</details>

### Source Record: Flow and algorithm

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/articles/flow-and-algorithm/`  
**Source:** `site/spec-content/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/articles/flow-and-algorithm/content.md`  
**SHA-256:** `3d0697d635772a7b17dd7798f2a50dfe561edc9a7493386ab67935d486d5d167`

<details>
<summary>Migrated source text</summary>

``````markdown
Code lifecycle algorithm:

1. Define or reuse an issue kind in `diagnostic_kinds.rs`.
2. Emit that kind from a semantic rule in `analysis/rules`.
3. Convert issue kind to stable code/category payload.
4. Surface payload through services to CLI and LSP.
5. Validate docs and source sync with diagnostics verification scripts.

The code identity must survive every handoff unchanged, even when message templates differ between clients.
``````

</details>

### Source Record: Verification and traceability

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/articles/verification-and-traceability/`  
**Source:** `site/spec-content/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/articles/verification-and-traceability/content.md`  
**SHA-256:** `41f8db35bc1ed3accbc40575eeb2982a53d2c54ba8f8d315e2c04ef291a09ee1`

<details>
<summary>Migrated source text</summary>

``````markdown
Traceability anchors:

- Source of truth: `compiler/crates/beskid_analysis/src/analysis/diagnostic_kinds.rs`
- Rule emitters: `compiler/crates/beskid_analysis/src/analysis/rules`
- Verification script: `packages/trudoc/scripts/verify-diagnostics-spec-sync.mjs`

Suggested verification path:

1. Run semantic tests after registry changes.
2. Run diagnostic spec synchronization (`packages/trudoc/scripts/verify-diagnostics-spec-sync.mjs` via the website/trudoc verify scripts).
3. Validate at least one CLI and one LSP diagnostics scenario to confirm code identity parity.
``````

</details>
