## ADDED Requirements

### Requirement: Semantic tokens answer within a budget
A `textDocument/semanticTokens/full` request SHALL wait at most 100 ms for the analyzed facts of the newest text of the document. When the facts are not stored within that time, the server SHALL answer from the last analyzed facts of the document, with each token span moved over the edit; a span inside the edited range SHALL be dropped. A document without analyzed facts SHALL get a null result. After such an answer, the server SHALL send one `workspace/semanticTokens/refresh` request when the facts of the newest text are stored, only to a client that sets `workspace.semanticTokens.refreshSupport`, and at most one refresh SHALL wait for each document.

#### Scenario: Tokens during a burst of edits
- **GIVEN** an open `.bd` document whose analysis takes seconds
- **WHEN** the client edits the document every 150 ms and requests semantic tokens during the edits
- **THEN** the server answers within the budget from the carried facts, and the tokens before and after the edited range keep their positions in the newest text

#### Scenario: Refresh after a stale answer
- **GIVEN** a client that sets `workspace.semanticTokens.refreshSupport` and a stale semantic-tokens answer for a document
- **WHEN** the analysis of the newest text of that document stores its facts
- **THEN** the server sends one `workspace/semanticTokens/refresh` request

#### Scenario: No refresh without client support
- **GIVEN** a client without `workspace.semanticTokens.refreshSupport`
- **WHEN** the server answers semantic tokens from carried facts
- **THEN** the server sends no `workspace/semanticTokens/refresh` request
