## Why

HTTP/1.1 is the final public protocol layer required by the v0.5 release. It
must consume the single Foundation I/O path and the single Network TCP path;
otherwise a parser, client, or server can accidentally create a second socket,
readiness, cancellation, or cleanup model.

## What Changes

- Add a `Http` corelib package with bounded RFC 9110 / RFC 9112 HTTP/1.1
  request and response framing, validation, serialization, client exchange,
  and listener-backed server operations.
- Reject malformed start lines, obsolete folding, bare LF, invalid header
  names or values, oversized sections, ambiguous `Content-Length` /
  `Transfer-Encoding`, unsupported transfer codings, and malformed chunks.
- Require the public API to use only `Network.TcpStream`, `Network.TcpListener`,
  and Foundation `Core.IO`; it exposes no native handle or socket API.
  `HttpError::Transport` carries the Foundation `TransferFailure` cause.
- Require exactly one `Host` field per parsed and serialized request
  (`MissingHost`, `InvalidHost`); apply the RFC 9112 section 6.3 no-body
  rules for `HEAD`, `1xx`, `204`, and `304` responses through a typed
  `MessageRole`; fail closed on close-delimited bodies
  (`CloseDelimitedBody`) and interim responses (`InterimResponse`).
- Add Beskid corelib fixtures for accepted and rejected framing shapes.

## Non-goals

TLS, HTTP/2, HTTP/3, WebSocket, proxies, compression, connection pooling,
HTTP upgrades, and user-configurable streaming bodies are outside v0.5.

## Impact

The change adds `corelib_http`, one aggregate dependency, and HTTP-specific
corelib fixtures. It does not change the native ABI, reactor, socket table, or
Foundation I/O contracts.
