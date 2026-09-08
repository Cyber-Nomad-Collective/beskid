# Learn Real LSP Design

## Goal

Make Beskid Learn's Monaco editors use the compiler's authoritative language
server rather than static browser-side snippets.

## Scope

The feature applies to authenticated Learn sessions. Learn is already protected
by the Authentik proxy, and the Learn application must also reject a missing or
invalid application session before it creates a language-server connection.

The first delivery supports completion, diagnostics, hover, definition,
signature help, formatting, semantic tokens, and rename when each feature is
advertised by `beskid_lsp`. Explicit compiler runs remain on `/api/check`.

## Architecture

`beskid_lsp` remains the single owner of language facts. The Learn Docker image
builds and ships both `beskid` and `beskid_lsp`; it does not recreate completion
or diagnostic logic in TypeScript.

The Bun server exposes one same-origin WebSocket endpoint, `/api/lsp`. On an
authenticated upgrade it starts one `beskid_lsp` child process for that socket
and proxies framed LSP JSON-RPC bytes in both directions. It creates an
ephemeral per-connection workspace under the operating-system temporary
directory, passes that directory as the LSP workspace root, and removes it
when the socket closes or the child exits. It must reject unauthenticated,
malformed, oversized, and failed child-process connections without leaking
compiler output or leaving a process behind.

The browser owns exactly one `BeskidLspClient` for each Monaco editor model. It
opens the authenticated same-origin socket, performs `initialize`, sends
`didOpen` and debounced `didChange` notifications, and translates the LSP
responses/notifications into Monaco providers and diagnostic markers. A single
shared registration module is used by Playground and lesson workspace editors;
the existing hard-coded completion list is removed.

## Protocol and Lifecycle

1. Monaco creates a stable virtual `file:///workspace/Main.bd` URI and opens
   `/api/lsp` with same-origin cookies.
2. The server validates `getLearnSession(request)`, creates its temporary
   workspace, starts `beskid_lsp`, and upgrades only if the child starts.
3. The client sends `initialize` with that workspace URI and then `initialized`.
4. The client sends full-text `textDocument/didOpen` and debounced full-text
   `textDocument/didChange` messages. The LSP accepts incremental sync, and a
   full-text change is a valid incremental-sync payload.
5. Monaco provider requests are forwarded as LSP requests. Every response is
   matched by JSON-RPC id and rejected promises clear pending requests during
   closure.
6. `textDocument/publishDiagnostics` becomes Monaco markers. Position and
   range conversion keeps LSP's zero-based positions separate from Monaco's
   one-based lines and columns.
7. Closing the editor sends `didClose`, then terminates the WebSocket and its
   child process. Server shutdown kills all remaining children and deletes their
   temporary workspaces.

## Error Handling

No static fallback completion list exists. If the compiler service is absent or
the socket cannot connect, the editor remains editable and shows an unobtrusive
"Language service unavailable" status; Run continues to use `/api/check`.

An unauthenticated `/api/lsp` request receives HTTP 401 before upgrade. A
child process launch failure receives HTTP 503. A malformed WebSocket payload,
protocol error, or child exit closes the connection with a normal application
error code and rejects outstanding browser requests. Server logs record a
request correlation id, never source text or Authentik credentials.

## Tests and Acceptance Evidence

- Unit-test framed JSON-RPC forwarding, authentication, child cleanup, and
  rejected launch handling without invoking a real network listener.
- Unit-test the browser mapping of LSP completion, diagnostics, and position
  conversion; prove that it does not import static playground completions.
- Integration-test `beskid_lsp` with `Core.Output.` and assert it produces the
  actual compiler-provided member completion.
- Build the Learn image and assert it contains executable `beskid` and
  `beskid_lsp` binaries.
- Browser-test an authenticated editor with a real compiler completion and a
  diagnostic marker. Exercise `/api/check` separately to prove Run still works.

## Constraints

- Do not expose an unauthenticated public compiler or LSP endpoint.
- Do not duplicate compiler language facts in Learn.
- Do not retain user source files or session workspaces after the connection
  closes.
- Preserve the existing Authentik session contract and `/api/check` behavior.
- Keep the Docker runtime glibc-compatible with the Rust binaries.
