## ADDED Requirements

### Requirement: Editor diagnostic shape
The server SHALL publish one diagnostic per cause. The server SHALL anchor the diagnostic where the fix goes. For repeated assignments to an immutable binding, the anchor SHALL be the declaration. The `message` SHALL be one sentence that names the cause, followed by at most one second line of the form `Help: <text>` when the compiler has a help sentence. A help sentence SHALL NOT be a separate diagnostic. The message SHALL NOT contain a file path, a grammar rule name, a source snippet, or an arrow such as `-->`. The `range` SHALL be the exact token. Other places SHALL be `relatedInformation` entries with a short label such as "assigned again" or "host declaration starts here". For each related place in the same buffer, the server SHALL also publish a diagnostic of severity `Hint` at that place, with the label as message. A related place in another file SHALL NOT get a Hint marker. The `source` SHALL be `beskid`. The `code` SHALL be the diagnostic code, and `codeDescription.href` SHALL be the registry page of the diagnostic code registry, without a fragment. A diagnostic for an unused item SHALL carry the `Unnecessary` tag. A diagnostic for a deprecated item SHALL carry the `Deprecated` tag. A diagnostic for a project manifest SHALL be anchored on the offending block or field in the manifest.

#### Scenario: Repeated assignment
- **GIVEN** a binding `let x = 1;` that two later statements assign
- **WHEN** diagnostics are published
- **THEN** one diagnostic is anchored on the declaration, and each assignment is a related location with the label "assigned again"

#### Scenario: Message content
- **GIVEN** any diagnostic produced by the compiler
- **WHEN** the server converts it
- **THEN** the message contains no path, no rule name and no snippet, and has at most one `Help:` line

### Requirement: Quick fixes carry applicability
Each quick fix SHALL carry an applicability: `machine-applicable`, `maybe-incorrect` or `has-placeholders`. The server SHALL mark a fix as preferred only when it is `machine-applicable` and sits at the cause. The title of a `maybe-incorrect` fix SHALL tell the user to check the result. When the parser repairs a mistake, the server SHALL publish the original mistake as an error and the repair as a quick fix. The text of a diagnostic SHALL NOT use the word "recovery".

#### Scenario: Missing semicolon
- **GIVEN** a statement without `;`
- **WHEN** diagnostics and code actions are requested
- **THEN** the error is on the token found, and a preferred `machine-applicable` fix inserts `;`

#### Scenario: Fix that may change meaning
- **GIVEN** a parse mistake whose repair may change the meaning
- **WHEN** code actions are requested
- **THEN** the fix is not preferred and its title asks the user to check the result
