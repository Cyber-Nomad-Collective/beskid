## MODIFIED Requirements

### Requirement: Edit-producing requests never use facts of an older text
A `textDocument/rename` or `textDocument/prepareRename` request, and a `textDocument/codeAction` request whose context has a diagnostic with a `source` that starts with `beskid:mod:`, SHALL wait at most 500 ms for the analyzed facts of the newest text of an open document. The 500 ms SHALL include each wait for the server state that the request reads the facts from. When the facts are not stored within that time, or the server state is not free within that time, the server SHALL fail the request with the `ContentModified` error (`-32801`) and SHALL NOT compute edits from older facts. Other `textDocument/codeAction` requests for an open document SHALL use the newest open text and SHALL NOT wait for its analysis, for the server state or for the handlers of earlier text-sync notifications of the document. When the client changes the document after the server takes the facts or the text and before it sends the answer, the server SHALL fail the request with `ContentModified`.

#### Scenario: Rename during a burst of edits
- **GIVEN** an open `.bd` document whose analysis finishes one edit after the newest text
- **WHEN** the client edits the document every 50 ms and requests a rename during the edits
- **THEN** the server fails the request with `ContentModified` within 1 s and sends no workspace edit

#### Scenario: Edit during the computation of a rename
- **GIVEN** a rename whose facts match the newest text
- **WHEN** the client sends an edit of the document before the server answers
- **THEN** the server fails the request with `ContentModified`

#### Scenario: Code actions before the analysis of the newest text
- **GIVEN** an open `.bd` document whose stored facts are of an older text, and a writer that holds the server state for 2 s
- **WHEN** the client requests code actions without a Mod diagnostic in the context
- **THEN** the server answers within 1 s, and the "Format document" edit formats the newest text

#### Scenario: Mod quick fix during a burst of edits
- **GIVEN** an open `.bd` document whose analysis finishes one edit after the newest text
- **WHEN** the client edits the document every 50 ms and requests code actions for a Mod diagnostic during the edits
- **THEN** the server fails the request with `ContentModified` within 1 s

#### Scenario: Rename with current facts
- **GIVEN** an open `.bd` document whose newest text is analyzed within 500 ms
- **WHEN** the client requests a rename
- **THEN** the server answers with edits for the newest text

### Requirement: Code actions answer within a computation budget
After a `textDocument/codeAction` request has the text or the facts of the newest text, the server SHALL wait at most 500 ms for the actions. The server SHALL compute the actions in this order: the fixes attached to the diagnostics of the request, the quick fixes for those diagnostics, then the source actions (format the document, write the documentation comment). When the 500 ms end first, the server SHALL answer with the actions computed by then and SHALL stop the computation. The server SHALL NOT answer with an action that it computed from facts of an older text. The server SHALL keep the formatting of the last texts that it formatted and SHALL NOT format such a text again. The documentation action SHALL use the documentation facts that the analysis stored for that text; when it stored none, it SHALL use facts from a parse that starts no parse recovery. A code action SHALL NOT start a parse recovery.

#### Scenario: Slow formatting of a large document
- **GIVEN** an open `.bd` document whose whole-document formatting takes 2 s
- **WHEN** the client requests code actions
- **THEN** the server answers within 1 s after it has the text, with the quick fixes and without the "Format document" action

#### Scenario: Code actions on a text that does not parse
- **GIVEN** an open `.bd` document with a syntax error and no stored documentation facts for its text
- **WHEN** the client requests code actions
- **THEN** the server answers without a "Format document" or documentation action and runs no parse recovery of the text

#### Scenario: Code actions at a second position of one text
- **GIVEN** a code action answer with a "Format document" action for the newest text
- **WHEN** the client requests code actions at another position of the same text
- **THEN** the server does not format the text again
