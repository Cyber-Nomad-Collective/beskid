## ADDED Requirements

### Requirement: Bounded strict HTTP/1.1 framing

The `Http` core library SHALL parse HTTP/1.1 request and response messages as
bounded octet sequences. It MUST require CRLF line endings, an `HTTP/1.1`
version token, valid token method/header names, ASCII header values without
control bytes, and configured section/body limits. It MUST reject bare LF,
obsolete line folding, invalid start lines, invalid header syntax, and trailing
bytes after one complete bounded message.

**Stable ID:** `BSP-REQ-7E14A36F9F29`

#### Scenario: malformed line endings are rejected

- **WHEN** a request header uses a bare LF
- **THEN** parsing returns `HttpError::InvalidFraming`

### Requirement: Unambiguous message framing

The library MUST reject a message containing both `Content-Length` and
`Transfer-Encoding`. It MAY accept one decimal `Content-Length` or the lone
transfer coding `chunked`; all other transfer codings MUST be rejected.
`Content-Length` bodies MUST have exactly the declared number of octets.

A response to a `HEAD` request and any response with a `1xx`, `204`, or
`304` status SHALL end at the first empty line after the header section.
The library MUST validate but MUST NOT apply a `Content-Length` or
`Transfer-Encoding` field in such a response to body framing. A request
with neither field SHALL have a zero-length body. A response with neither
field that is not bodiless by the rule above SHALL be rejected with
`HttpError::CloseDelimitedBody`; the v0.5 bounded client does not read
close-delimited bodies. A `1xx` response SHALL be rejected with
`HttpError::InterimResponse`; the v0.5 bounded client does not consume
interim responses. The caller SHALL state the message role
(`Request`, `Response`, `HeadResponse`) when parsing or reading a message.

**Stable ID:** `BSP-REQ-58182F687E87`

#### Scenario: conflicting framing is rejected

- **WHEN** a request has both `Content-Length` and `Transfer-Encoding: chunked`
- **THEN** parsing returns `HttpError::AmbiguousFraming`

#### Scenario: HEAD response with Content-Length has no body

- **WHEN** a client sends `HEAD /` and receives `HTTP/1.1 200 OK` with `Content-Length: 1234` and no further octets
- **THEN** `Client.Send` returns the response with an empty body without waiting for 1234 octets

#### Scenario: close-delimited response is rejected

- **WHEN** a client receives `HTTP/1.1 200 OK` with neither `Content-Length` nor `Transfer-Encoding`
- **THEN** `Client.Send` returns `HttpError::CloseDelimitedBody` and returns no body octets

### Requirement: Exactly one Host field per request

The `Http` core library SHALL require exactly one `Host` header field line
in every parsed and every serialized HTTP/1.1 request. `ParseRequest` and
`SerializeRequest` MUST return `HttpError::MissingHost` when no `Host`
line is present and `HttpError::InvalidHost` when more than one line is
present or the single value is not an empty value or a `uri-host`
optionally followed by `":"` and a decimal port in 0..65535. The check
MUST run before body framing and MUST NOT allocate a body. A v0.5 server
application that receives either error MUST respond with status 400 and
close the connection; `HttpServer.Receive` does not send that response.

**Stable ID:** `BSP-REQ-6CAA5AC6F4E3`

#### Scenario: duplicate Host is rejected before the body is read

- **WHEN** a request contains two `Host` field lines and a `Content-Length` body
- **THEN** `ParseRequest` returns `HttpError::InvalidHost` without returning any body octets

### Requirement: One transport path

HTTP client and server operations SHALL use only `Network.TcpStream`,
`Network.TcpListener`, and Foundation `Core.IO`. They MUST NOT expose a native
socket value or implement a protocol-specific exact read/write loop.
`HttpError::Transport` SHALL carry the Foundation `TransferFailure` cause
received from `Core.IO` and MUST NOT add an HTTP-specific transport cause.
`IoError::ReadFailed(cause)` and `WriteFailed(cause)` map to
`Transport(cause)`; `InvalidRange` and `NoProgress` map to
`Transport(TransferFailure::Unspecified)`; `UnexpectedEof(_)` maps to
`HttpError::UnexpectedEof`.

**Stable ID:** `BSP-REQ-9E0DE26CF08F`

#### Scenario: listener server accepts through Network

- **WHEN** `HttpServer.Accept` receives a connection
- **THEN** it returns the `Network.TcpStream` produced by `TcpListener.Accept`

#### Scenario: transport cause reaches the HTTP caller unchanged

- **GIVEN** a stream read that fails with `IoError::ReadFailed(TransferFailure::PeerReset())`
- **WHEN** `Client.Send` or `HttpServer.Receive` reports the failure
- **THEN** it returns `HttpError::Transport(TransferFailure::PeerReset())`
