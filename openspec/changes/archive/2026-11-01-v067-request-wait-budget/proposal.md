## Why

After the semantic-tokens fix (change `v067-semantic-tokens-budget`), references, rename, prepare rename, signature help, inlay hints and code actions still waited up to 120 s for the analyzed facts of the newest text of the document. Each edit during the wait changed the newest text again, so a request sent during a burst of edits waited for the full burst and the analyses after it. The soak did not send these requests, so it did not measure this.

## What Changes

- References, signature help and inlay hints wait at most 100 ms for the facts of the newest text. After that, they answer from the last analyzed facts, moved over the edit. Inlay hints now move over an edit like the other facts.
- After an inlay-hint answer from carried facts, the server sends one `workspace/inlayHint/refresh` when the facts of the newest text are stored, if the client supports the refresh request.
- Rename, prepare rename and code actions wait at most 500 ms for the facts of the newest text. They never answer from older facts: past the wait, or when the client changes the document while the server computes the answer, the request fails with `ContentModified` (`-32801`).
- No document request waits without a limit. A background refresh task waits at most 30 s for the current facts, then sends its refresh.
- The language-server soak sends these requests and has default latency budgets for them.

## Capabilities

### Modified Capabilities
- `tooling--lsp--intellisense-capabilities-and-behavior`.

## Impact

`beskid_lsp` (request facts and wait budgets, open-text versions, carried inlay hints, refresh requests), `beskid_proof` soak request mix and budgets. Target release: 0.6.7.

## Compatibility, Migration and Reversion

No users exist. During a burst of edits, rename and code actions fail with `ContentModified`; editors ask again or show no action. Inlay hints inside the edited range are absent until the refresh.
