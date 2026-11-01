## ADDED Requirements

### Requirement: Only a member that is being typed is repaired for completion
When a line of an open `.bd` document ends with a member access outside a comment or a string, the server SHALL repair it for completion only when the access is a member that is being typed: `receiver.` with no member, or `receiver.Member` followed by a new statement, by `}` or by the end of the buffer. When other text follows `receiver.Member` (for example the `{` of a struct literal, a `.`, a `(` or an operator), the line ends a complete expression, and the server SHALL analyze the document as written.

#### Scenario: Struct literal of a qualified type
- **GIVEN** an open document with `Syntax.Span` at the end of a line and the `{` of its struct literal on the next line
- **WHEN** the server analyzes the document
- **THEN** the server analyzes the text as written, with no repair and no parse recovery

#### Scenario: Member being typed
- **GIVEN** an open document with `String.Le` at the end of a line and `return 0;` on the next line
- **WHEN** the server analyzes the document
- **THEN** the completion facts come from the text with `String.Le;`
