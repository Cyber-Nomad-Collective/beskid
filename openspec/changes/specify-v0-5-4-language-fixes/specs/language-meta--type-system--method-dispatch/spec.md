## ADDED Requirements

### Requirement: Sibling method calls through this
Inside a method, `this.Method(args)` SHALL call `Method` on the implicit
receiver exactly as the unqualified `Method(args)` does, when `this` is not
shadowed. The callee SHALL be selected statically from the receiver's type.

**Stable ID:** `BSP-REQ-DISPATCH-THIS-SIBLING-CALL`

#### Scenario: Method calls a sibling through this
- **GIVEN** `type Counter { i64 n, i64 Double() { return 2; } i64 Quad() { return this.Double() * 2; } }`
- **WHEN** `Quad()` is called on a `Counter`
- **THEN** `this.Double()` calls `Double` on the same receiver and `Quad`
  returns `4`
