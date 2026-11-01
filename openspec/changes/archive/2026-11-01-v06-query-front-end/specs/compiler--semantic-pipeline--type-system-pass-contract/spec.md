## MODIFIED Requirements

### Requirement: Primary contract for Type-system pass contract: Decision [D-COMP-SEM-0015]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> The reference compiler **must** implement Type-system pass contract as documented in this feature hub and its article bundle.

The typing authority of the reference compiler SHALL be the generation-bound query layer (`beskid_queries`): every type, call lowering, cast, layout and resolution fact that `beskid check`, `analyze`, the language server and code generation consume SHALL be a query over registered syntax keyed by `AstNodeKey`. The compiler SHALL NOT run a second type system on the executable path: a program the query gate accepts SHALL lower from its executable front end (the rewritten syntax assembly and its composition authority) or fail as an internal compiler gap (E2101, E2102), never with a diagnostic of another checker. The legacy `TypeResult` contract, its `node_types`, `lowering.call_kinds` and `cast_intents` tables, the `lower.type_check` phase and the `EntryOnly` / `FullClosure` dependency typing policy are retired; the executable path SHALL judge every own unit of the project exactly as the diagnostics path does. The migrated contract sections that describe them are informative provenance.

**Stable ID:** `BSP-REQ-6A3E412FCFC0`  
**Legacy source:** `site/spec-content/platform-spec/compiler/semantic-pipeline/type-system-pass-contract/adr/0003-primary-contract-choice/content.md`  
**Source SHA-256:** `4e3ac7548c9b72b0f12682f7f84bb647df8ecde3c6846c75c6a87a2bc9312707`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

#### Scenario: A program the gate accepts is executable
- **GIVEN** a program `beskid check` reports no error for
- **WHEN** `beskid build` prepares and lowers it
- **THEN** preparation SHALL NOT reject it with a second typing diagnostic
- **AND** a lowering failure, if any, SHALL be reported as an internal compiler gap naming the construct

#### Scenario: Named function value builds
- **GIVEN** `i64 Double(i64 v) { return v * 2_i64; } i64 Apply(i64 v, (i64) => i64 f) { return f(v); } i64 Main() { return Apply(5_i64, Double); }`
- **WHEN** the program is built
- **THEN** the compiler SHALL accept it and `Main` SHALL return `10`
