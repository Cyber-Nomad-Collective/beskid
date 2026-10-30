# Design: semantic tokens answer within a budget (0.6.7)

LSP 3.16 lets a server answer `textDocument/semanticTokens/full` from facts that are not current. The server can then send `workspace/semanticTokens/refresh`, and the client asks for the tokens again. The refresh is workspace-wide, so the server sends it only when the facts of the newest text are stored, and at most one refresh waits for each document.

Tokens come from declaration symbols and attribute names (`.bd`) or from BSOL candidates (`.bproj`, `.bws`, `.bsol`). These spans move over an edit like the hover, definition and symbol facts. A span inside the edited range is dropped.

Hover, definition and completion already answer from the facts carried over the edit. References, rename, signature help, inlay hints and code actions still wait for the facts of the newest text; they are not part of this change.
