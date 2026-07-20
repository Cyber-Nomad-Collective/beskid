## ADDED Requirements

### Requirement: Authoritative pest grammar
Implementations SHALL treat the checked-in grammar `compiler/crates/beskid_analysis/src/beskid.pest` as the single syntactic truth. A tool claiming Beskid L0 conformance MUST accept the same token stream as `beskid.pest` for all inputs in the reference parser test corpus.

#### Scenario: L0 token-stream agreement
- **GIVEN** a source file from the reference parser test corpus
- **WHEN** an L0-conformant tool tokenizes and parses the file
- **THEN** the token stream matches the stream produced by `beskid.pest`

### Requirement: Identifier and keyword lexical rules
Identifiers MUST match the `Identifier` production (ASCII letter or `_` followed by alphanumeric/`_` characters) and MUST NOT spell a reserved `Keyword`. Reserved keywords, including DI tokens such as `host`, `registry`, `scope`, `launch`, and `inject`, MUST be tokenized as keywords even when unused in a given compilation unit.

#### Scenario: Keyword rejected as identifier
- **GIVEN** source that uses a reserved keyword as a binding name
- **WHEN** the lexer and parser process the input
- **THEN** the name is not accepted as an `Identifier`

### Requirement: Documentation comment lexical form
`///` on items begins a documentation run attached only via `ItemWithDocs`. `////` and longer slash runs MUST NOT be treated as documentation. Ordinary `//` line comments (not starting a third `/`) and `/* ... */` block comments (nesting by terminator only) remain non-documentation comments.

#### Scenario: Four-slash run is not documentation
- **GIVEN** a line starting with `////` immediately before an item
- **WHEN** documentation attachment runs
- **THEN** the line is not attached as a documentation comment for that item

### Requirement: Parse validity does not imply semantic validity
Lexical and syntactic validity MUST NOT be treated as semantic validity. Phases after parsing MUST reject programs that parse but violate module, type, or contract rules. Parse failures MUST surface as parser diagnostics; early structural issues discovered during HIR construction use diagnostic codes **E1151–E1154**.

#### Scenario: Well-formed syntax with semantic violation
- **GIVEN** a program that parses successfully but violates a module, type, or contract rule
- **WHEN** semantic analysis runs
- **THEN** the program is rejected by a post-parse phase and is not accepted solely because parsing succeeded

## REMOVED Requirements

### Requirement: Lexical and syntax conformance status
**Reason**: Replaced by explicit behavioral requirements extracted from migrated source.
**Migration**: Cite the ADDED requirements above.
