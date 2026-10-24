## ADDED Requirements

### Requirement: Parse error codes and unused-item warning
The inclusive range **E0101–E0199** SHALL be reserved for parse errors. The codes **E0101–E0113** are allocated: E0101 unexpected token, E0102 missing `;`, E0103 unclosed delimiter, E0104 `host` without a parameter list, E0105 `++` or `--`, E0106 typed `let`, E0107 reserved word used as a name, E0108 block used as a match-arm value, E0109 unknown string escape, E0110 invalid `\u{...}` value, E0111 unexpected syntax tree shape, E0112 `self` parameter, E0113 nothing to parse, E0115 comma between type fields, E0116 conditional expression without `:`. Every parse error SHALL carry a code from this range. A parse code SHALL NOT be reused for another rule. The code **W2101** SHALL identify an unused item, and a diagnostic with that code SHALL carry the `Unnecessary` tag. A parse error message SHALL say what the parser was parsing, in the form "Expected X while parsing Y", with Y written in plain words. A table from each grammar rule to its plain words SHALL exist beside the grammar, and a test SHALL fail when a rule has no entry. All codes SHALL link to the registry page of this capability.

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
