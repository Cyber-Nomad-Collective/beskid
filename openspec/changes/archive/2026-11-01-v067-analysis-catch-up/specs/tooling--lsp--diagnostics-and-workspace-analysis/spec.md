## ADDED Requirements

### Requirement: The analysis of an open document judges that document alone
The analysis of an open `.bd` document after an edit and the publication of its diagnostics SHALL run the structural rules and the typing and legality obligations for the unit of that document only. The other own units of its project SHALL keep the diagnostics of their own analysis or of the workspace index. The diagnostics that the server publishes for the document SHALL be the same as the diagnostics of its unit when every own unit is judged. The workspace index and `beskid check` SHALL judge every own unit.

#### Scenario: Edit in a file of a large library
- **GIVEN** an open document of a library package with many own units
- **WHEN** the client edits the document
- **THEN** the analysis judges the unit of that document only
- **AND** the published diagnostics of the document are the diagnostics of its unit when every own unit is judged

#### Scenario: Error in a unit that the document does not reach
- **GIVEN** an open document and another own unit of its project with an error that no item of the document reaches
- **WHEN** the server analyzes the open document
- **THEN** the server does not judge the other unit for that analysis
- **AND** the workspace index reports the error for the other unit

### Requirement: A newer text stops the analysis of an older text
When the client sends a newer text of an open document, or closes the document, the server SHALL stop a running analysis of an older text of that document at its next database query and SHALL NOT store its facts. The analysis of the newest text SHALL NOT wait for the end of the analysis of an older text.

#### Scenario: End of a burst of edits
- **GIVEN** a running analysis of an open document
- **WHEN** the client sends a newer text and then stops editing
- **THEN** the server stops the running analysis without storing its facts
- **AND** the facts of the newest text are stored after one analysis of that text

#### Scenario: Close during an analysis
- **GIVEN** a running analysis of an open document
- **WHEN** the client closes the document
- **THEN** the server stops the analysis and stores no facts for the closed document
