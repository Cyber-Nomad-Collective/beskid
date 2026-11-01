## Why

In the preview.10 30-minute soak, `textDocument/semanticTokens/full` had a p95 of 1102 ms and a maximum of 16 193 ms. The handler waited for the analysis of the newest text of the document. Each edit during the wait changed the newest text again, so one request could wait for a full burst of edits and the analyses that followed it.

## What Changes

- A semantic-tokens request waits at most 100 ms for the facts of the newest text. After that, the tokens come from the last analyzed facts, moved over the edit. A document without analyzed facts gets a null result.
- After such an answer, the server sends one `workspace/semanticTokens/refresh` when the facts of the newest text are stored, if the client supports the refresh request.
- The language-server soak has a default latency budget for `textDocument/semanticTokens/full` (p95 500 ms, maximum 5 s), as for hover, completion, outline and definition.

## Capabilities

### Modified Capabilities
- `tooling--lsp--intellisense-capabilities-and-behavior`.

## Impact

`beskid_lsp` (semantic tokens handler, carried-over document facts), `beskid_proof` soak budgets. Target release: 0.6.7.

## Compatibility, Migration and Reversion

No users exist. Editors show the last tokens during a burst of edits; tokens inside the edited range are absent until the refresh.
