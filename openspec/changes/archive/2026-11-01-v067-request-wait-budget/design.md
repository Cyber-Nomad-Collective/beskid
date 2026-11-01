# Design: document requests answer within a budget (0.6.7)

An open document is analyzed in the background after each edit. A request that waits for "the facts of the newest text" waits for a target that moves with each edit. So each request waits for a short, fixed time, and then answers in one of two ways.

## Read-only requests

References, signature help, semantic tokens, inlay hints, hover, definition and completion return information, not edits. LSP lets a server answer them from facts that are not current. Past 100 ms, they answer from the last analyzed facts carried over the edit: a span before or after the edited range moves with its text, and a span inside it is dropped. For semantic tokens (LSP 3.16) and inlay hints (LSP 3.17), the server then asks a client that supports it to request them again (`workspace/semanticTokens/refresh`, `workspace/inlayHint/refresh`). The refresh is workspace-wide, so at most one refresh of each kind waits for each document.

## Edit-producing requests

Rename, prepare rename and code actions return edits (prepare rename returns the range that the rename edits). Edits from carried facts can be wrong: occurrences inside the edited range are not in the carried facts. LSP 3.17 defines `ContentModified` (`-32801`) for a request whose result the document change makes invalid. Past 500 ms, these requests fail with `ContentModified`. The server also records the version of the open text when it takes the facts, and fails with `ContentModified` when the version changed before the answer is sent. The client asks again; VS Code does not show this error to the user.

The alternative, versioned edits in `documentChanges`, needs a client capability and makes the client reject the edit later. `ContentModified` is simpler and does not depend on client capabilities.

## Wait limits

| Request | Wait for the newest facts | Then |
|---|---|---|
| hover, definition, declaration | none | carried facts |
| completion | 100 ms | carried facts, no database queries |
| references, signature help | 100 ms | carried facts |
| semantic tokens, inlay hints | 100 ms | carried facts and one refresh |
| rename, prepare rename, code actions | 500 ms, including each wait for the server state | `ContentModified` |
| code actions, computation | 500 ms after the facts | the actions computed by then |
| refresh task (background) | 30 s | refresh |

The request compares the stored facts with the open text in place on each stored analysis, and copies the document once, when it has its answer.

## Waits that are not for the analysis (0.6.7 stability proof)

The 30-minute stability-proof soak found `textDocument/codeAction` answers of 5.5-6.2 s under builder load (preview.11 and preview.12). The 500 ms limit covered only the wait for the newest analysis. A soak with `BESKID_LSP_TRACE=1` (builder load median 18, maximum 31) measured two other costs that had no limit: state waits of up to 620 ms added to the 500 ms (916 ms at most over 1071 edit-request reads), and action computations of up to 991 ms (the documentation comment of a 37 KB file) and 652 ms (the formatting of a 39 KB file) after the facts:

- Each read of the server state. The state lock is fair: a read waits behind a queued writer, and the writer waits for the readers before it.
- The computation of the actions on the request's task: quick fixes, providers, the formatting of the whole document, and the documentation-comment facts (a parse when the document has none).

An edit-producing request now counts its state waits in its 500 ms and fails with `ContentModified` past it, as for a missing analysis. The code actions are computed on a blocking thread, cheapest first; the request waits 500 ms for them and answers with what it has. Fewer actions is a correct answer: each action comes from the facts of the newest text. Read-only requests keep an unlimited state wait: their answer is late, not wrong. The traced soak of the fix saw the largest cost directly: the documentation-comment action of a 141 KB file with a syntax error parsed the text again for 5950 ms; the request answered after 500 ms without that action.
