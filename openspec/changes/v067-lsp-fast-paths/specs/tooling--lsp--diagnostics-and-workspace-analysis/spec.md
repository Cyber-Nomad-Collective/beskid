## ADDED Requirements

### Requirement: The diagnostics of an edit come from its analysis
When the analysis of the newest text of an open `.bd` document stores its facts and that analysis prepared the project of the document, the server SHALL publish the diagnostics of that analysis for that text and version at once. The server SHALL NOT publish them when the client sent a newer text or closed the document, when the analysis did not prepare the project (a preparation failure or a structural fallback), or when a file changed on disk or the compilation context was invalidated after the analysis started.

After an edit of an open document, the server SHALL NOT run the debounced full preparation of that document when it published the diagnostics of the analysis of the edit and, while that analysis ran, no open text of any document changed, no file changed on disk and the compilation context was not invalidated. In every other case, and after the client opens or saves a document, the server SHALL run the debounced full preparation, which SHALL publish only when its diagnostics for that version differ from the published diagnostics. The full preparation of a document publishes the diagnostics of that document only.

#### Scenario: Diagnostics after an edit
- **GIVEN** an open `.bd` document of a project and no other open document
- **WHEN** the client edits the document to have an error and the analysis of the newest text stores its facts
- **THEN** the server publishes the diagnostics of the newest text once
- **AND** the server does not run the full preparation of the document for that edit

#### Scenario: Another document changes during the analysis
- **GIVEN** an analysis of an open document that prepared its project
- **WHEN** the client edits another open document while the analysis runs
- **THEN** the server publishes the diagnostics of the analysis and then runs the full preparation of the document

#### Scenario: Preparation failure in another file
- **GIVEN** an open document whose project fails to prepare because another file does not parse
- **WHEN** the client edits the document
- **THEN** the server publishes no diagnostics from the analysis and runs the full preparation of the document

#### Scenario: Edit before the publication
- **GIVEN** an analysis of an open document that stores its facts
- **WHEN** the client sends a newer text before the server publishes the diagnostics of the older text
- **THEN** the server does not publish the diagnostics of the older text

## MODIFIED Requirements

### Requirement: A newer text stops the analysis of an older text
When the client sends a newer text of an open document, or closes the document, the server SHALL stop a running analysis of an older text of that document at its next database query and SHALL NOT store its facts. A parse recovery of the older text in that analysis SHALL stop before its next candidate parse, and the server SHALL NOT keep its result. The analysis of the newest text SHALL NOT wait for the end of the analysis of an older text. The server SHALL recover one text at most once, whatever name the text has.

#### Scenario: End of a burst of edits
- **GIVEN** a running analysis of an open document
- **WHEN** the client sends a newer text and then stops editing
- **THEN** the server stops the running analysis without storing its facts
- **AND** the facts of the newest text are stored after one analysis of that text

#### Scenario: Close during an analysis
- **GIVEN** a running analysis of an open document
- **WHEN** the client closes the document
- **THEN** the server stops the analysis and stores no facts for the closed document

#### Scenario: Edit during the recovery of a large broken file
- **GIVEN** an analysis of an open document whose text does not parse and whose recovery takes seconds
- **WHEN** the client sends a newer text
- **THEN** the recovery of the older text stops before its next candidate parse
- **AND** a later parse of the older text recovers it again
