## ADDED Requirements

### Requirement: Read-only document requests answer within a budget
A `textDocument/references`, `textDocument/signatureHelp` or `textDocument/inlayHint` request SHALL wait at most 100 ms for the analyzed facts of the newest text of the document. When the facts are not stored within that time, the server SHALL answer from the last analyzed facts of the document, with each span moved over the edit; a span inside the edited range SHALL be dropped. After an inlay-hint answer from carried facts, or without analyzed facts, the server SHALL send one `workspace/inlayHint/refresh` request when the facts of the newest text are stored, only to a client that sets `workspace.inlayHint.refreshSupport`, and at most one inlay-hint refresh SHALL wait for each document.

#### Scenario: References during a burst of edits
- **GIVEN** an open `.bd` document whose analysis finishes one edit after the newest text
- **WHEN** the client edits the document every 50 ms and requests references during the edits
- **THEN** the server answers within 1 s from the carried facts, and the locations are positions in the newest text

#### Scenario: Inlay hint refresh after a stale answer
- **GIVEN** a client that sets `workspace.inlayHint.refreshSupport` and an inlay-hint answer from carried facts
- **WHEN** the analysis of the newest text of that document stores its facts
- **THEN** the server sends one `workspace/inlayHint/refresh` request

### Requirement: Edit-producing requests never use facts of an older text
A `textDocument/rename`, `textDocument/prepareRename` or `textDocument/codeAction` request SHALL wait at most 500 ms for the analyzed facts of the newest text of an open document. The 500 ms SHALL include each wait for the server state that the request reads the facts from. When the facts are not stored within that time, or the server state is not free within that time, the server SHALL fail the request with the `ContentModified` error (`-32801`) and SHALL NOT compute edits from older facts. When the client changes the document after the server takes the facts and before it sends the answer, the server SHALL fail the request with `ContentModified`.

#### Scenario: Rename during a burst of edits
- **GIVEN** an open `.bd` document whose analysis finishes one edit after the newest text
- **WHEN** the client edits the document every 50 ms and requests a rename during the edits
- **THEN** the server fails the request with `ContentModified` within 1 s and sends no workspace edit

#### Scenario: Edit during the computation of a rename
- **GIVEN** a rename whose facts match the newest text
- **WHEN** the client sends an edit of the document before the server answers
- **THEN** the server fails the request with `ContentModified`

#### Scenario: Code actions while the server state is held
- **GIVEN** an open `.bd` document whose newest text is analyzed, and a writer that holds the server state for 2 s
- **WHEN** the client requests code actions
- **THEN** the server fails the request with `ContentModified` within 1 s

#### Scenario: Rename with current facts
- **GIVEN** an open `.bd` document whose newest text is analyzed within 500 ms
- **WHEN** the client requests a rename
- **THEN** the server answers with edits for the newest text

### Requirement: Code actions answer within a computation budget
After a `textDocument/codeAction` request has the facts of the newest text, the server SHALL wait at most 500 ms for the actions. The server SHALL compute the actions in this order: the fixes attached to the diagnostics of the request, the quick fixes for those diagnostics, then the source actions (format the document, write the documentation comment). When the 500 ms end first, the server SHALL answer with the actions computed by then and SHALL stop the computation. The server SHALL NOT answer with an action that it computed from facts of an older text.

#### Scenario: Slow formatting of a large document
- **GIVEN** an open `.bd` document whose whole-document formatting takes 2 s
- **WHEN** the client requests code actions
- **THEN** the server answers within 1 s after it has the facts, with the quick fixes and without the "Format document" action

### Requirement: No document request waits without a limit
No document request SHALL wait for analyzed facts longer than its budget. A background task that waits for the facts of the newest text before it sends a refresh request SHALL wait at most 30 s, and SHALL then send the refresh request.

#### Scenario: Endless edits
- **GIVEN** a client that edits a document without a pause
- **WHEN** the client sends document requests during the edits
- **THEN** each request answers within its budget, and each waiting refresh is sent within 30 s
