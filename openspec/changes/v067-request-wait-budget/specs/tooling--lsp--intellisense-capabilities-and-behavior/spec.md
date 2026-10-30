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
A `textDocument/rename`, `textDocument/prepareRename` or `textDocument/codeAction` request SHALL wait at most 500 ms for the analyzed facts of the newest text of an open document. When the facts are not stored within that time, the server SHALL fail the request with the `ContentModified` error (`-32801`) and SHALL NOT compute edits from older facts. When the client changes the document after the server takes the facts and before it sends the answer, the server SHALL fail the request with `ContentModified`.

#### Scenario: Rename during a burst of edits
- **GIVEN** an open `.bd` document whose analysis finishes one edit after the newest text
- **WHEN** the client edits the document every 50 ms and requests a rename during the edits
- **THEN** the server fails the request with `ContentModified` within 1 s and sends no workspace edit

#### Scenario: Edit during the computation of a rename
- **GIVEN** a rename whose facts match the newest text
- **WHEN** the client sends an edit of the document before the server answers
- **THEN** the server fails the request with `ContentModified`

#### Scenario: Rename with current facts
- **GIVEN** an open `.bd` document whose newest text is analyzed within 500 ms
- **WHEN** the client requests a rename
- **THEN** the server answers with edits for the newest text

### Requirement: No document request waits without a limit
No document request SHALL wait for analyzed facts longer than its budget. A background task that waits for the facts of the newest text before it sends a refresh request SHALL wait at most 30 s, and SHALL then send the refresh request.

#### Scenario: Endless edits
- **GIVEN** a client that edits a document without a pause
- **WHEN** the client sends document requests during the edits
- **THEN** each request answers within its budget, and each waiting refresh is sent within 30 s
