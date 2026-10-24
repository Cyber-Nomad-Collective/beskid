## ADDED Requirements

### Requirement: Parse error codes and unused-item warning
The inclusive range **E0101–E0199** SHALL be reserved for parse errors. Every parse error SHALL carry a code from this range. A parse code SHALL NOT be reused for another rule. The code **W2101** SHALL identify an unused item, and a diagnostic with that code SHALL carry the `Unnecessary` tag. A parse error message SHALL say what the parser was parsing, in the form "Expected X while parsing Y", with Y written in plain words. A table from each grammar rule to its plain words SHALL exist beside the grammar, and a test SHALL fail when a rule has no entry. All codes SHALL link to the registry page of this capability.

#### Scenario: Parse error has a code
- **GIVEN** the source `host Greeter { }` where `(` is expected
- **WHEN** the file is parsed
- **THEN** the diagnostic carries a code from E0101–E0199 and the message reads "Expected `(` while parsing host `Greeter`."

#### Scenario: Unused item
- **GIVEN** a private function that no item uses
- **WHEN** the file is analyzed
- **THEN** the compiler reports **W2101** with the `Unnecessary` tag

#### Scenario: Rule without words
- **GIVEN** a grammar rule that has no entry in the rule-to-words table
- **WHEN** the completeness test runs
- **THEN** the test fails
