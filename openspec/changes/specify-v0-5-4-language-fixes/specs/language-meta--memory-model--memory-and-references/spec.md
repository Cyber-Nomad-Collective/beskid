## ADDED Requirements

### Requirement: Array literal elements
Each element of an array literal `[e1, e2, ...]` SHALL be any expression of
the element type, including a call, a string concatenation, a field read, a
parameter, and an enum value. Elements of a reference type SHALL be traced by
the garbage collector as references in the array.

**Stable ID:** `BSP-REQ-ARRAY-LITERAL-ELEMENTS`

#### Scenario: Call and concatenation elements
- **GIVEN** `string Piece(string text) { return text; }`
- **WHEN** `string[] texts = [Piece("a") + Piece("b"), Piece("c")];` is
  evaluated
- **THEN** `texts` holds `"ab"` and `"c"`

#### Scenario: Enum value elements
- **GIVEN** `enum Shape { Dot, Line(i64 length) }`
- **WHEN** `Shape[] shapes = [Shape::Dot, Shape::Line(3_i64)];` is evaluated
- **THEN** `shapes` holds the two values as traced references
