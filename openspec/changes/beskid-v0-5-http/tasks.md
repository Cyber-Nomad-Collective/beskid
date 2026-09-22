## 1. HTTP core library

- [ ] 1.1 Add the `corelib_http` package and aggregate registration.
- [ ] 1.2 Implement bounded strict request/response parsing, chunk decoding,
  canonical header handling, and serialization over Foundation byte helpers.
- [ ] 1.3 Implement client and listener-backed server exchanges exclusively
  over `Network.TcpStream` and `Network.TcpListener`.
- [ ] 1.4 Enforce exactly one `Host` field per request
  (`BSP-REQ-6CAA5AC6F4E3`): add `MissingHost()` and `InvalidHost()` to
  `compiler/corelib/packages/http/src/Http/Errors.bd`; add a private
  `Result<unit,HttpError> HostField(Header[] headers)` in `Http/Codec.bd`
  called from `RequestHead` after `Headers` and from `SerializeRequest`
  before `Serialize`, before `Framing` runs. Accept an empty value or
  `uri-host [ ":" port ]` (bracketed IPv6 literal or
  `unreserved / sub-delims / pct-encoded` octets; decimal port in
  0..65535; no whitespace, control bytes, or second colon outside
  brackets). `MessageEnd` does not check `Host`. Document in the package
  README that `HttpServer.Receive` returns the typed error and the
  application answers `Types.EmptyResponse(u16(400), "Bad Request")` and
  closes.
- [ ] 1.5 Implement the RFC 9112 section 6.3 no-body rules through a typed
  role (`BSP-REQ-58182F687E87`): add
  `pub enum MessageRole { Request(), Response(), HeadResponse(), }` to
  `Http/Types.bd`; add a `MessageRole role` parameter to
  `Codec.MessageEnd`, `Codec.ParseResponse` (reject `Request` with
  `InvalidStatus`), and `Wire.ReadMessage`; keep `ParseRequest` unchanged
  and pass `MessageRole::Request` internally. Add private
  `bool Bodiless(MessageRole role, i64 status)` (true for `HeadResponse`
  or status 100..199, 204, 304); validate and then ignore a single
  `Content-Length` for a bodiless response; keep `AmbiguousFraming` first.
  Add `CloseDelimitedBody()` and `InterimResponse()` to `Errors.bd`: a
  `Response` role with no framing field and not bodiless returns
  `CloseDelimitedBody`; `ParseResponse` returns `InterimResponse` for
  100..199 after framing validation while `MessageEnd` still reports the
  head end. `Client.Send` derives `HeadResponse` from `request.method ==
  "HEAD"`; `Server.Receive` passes `MessageRole::Request`. Keep
  `TrailingBytes` for octets after a complete bodiless response. Document
  that `Respond` to `HEAD` stays the application's responsibility.
- [ ] 1.6 After Foundation task 2.8 lands `Core.IO.TransferFailure`, change
  `HttpError::Transport()` to `Transport(TransferFailure cause)` in
  `Errors.bd` and map `IoError::ReadFailed(c)` / `WriteFailed(c)` to
  `Transport(c)`, `InvalidRange` and `NoProgress` to
  `Transport(TransferFailure::Unspecified)`, and `UnexpectedEof(_)` to
  `HttpError::UnexpectedEof()` in `Wire.bd`, `Client.bd`, and `Server.bd`
  (`BSP-REQ-9E0DE26CF08F`). Any `IsError` extension that lists `Transport`
  MUST match `HttpError::Transport(_)`.

## 2. Evidence

- [ ] 2.1 Add Beskid corelib tests for valid framing, malformed framing,
  limits, conflicting framing, chunks, and serialization.
- [ ] 2.2 Extend `corelib_tests/src/http/CodecTests.bd`: add `Host: t` to
  the request fixtures that lack it (`ambiguous`, chunked valid and
  malformed, oversized body); add `MissingHost`, `InvalidHost`,
  `CloseDelimitedBody`, and `InterimResponse` arms to `IsError`; add
  `http_request_requires_exactly_one_host`; pass `MessageRole::Request` to
  every existing `MessageEnd` call; add
  `http_response_head_role_ignores_content_length`,
  `http_response_204_with_body_octets_is_trailing_bytes`,
  `http_unframed_2xx_response_is_close_delimited`, and
  `http_interim_response_is_rejected`.
- [ ] 2.3 Extend `corelib_tests/src/http/SerializationTests.bd`: add a
  `Host` header to `http_serializer_rejects_caller_supplied_framing_header`
  so it still asserts `AmbiguousFraming`; add
  `http_serializer_requires_host`; pass `MessageRole::Response` in
  `http_response_parser_requires_http11_status_and_exact_suffix` (its
  `204 ... x` case still expects `TrailingBytes`).
- [ ] 2.4 Extend `corelib_tests/src/http/ExchangeTests.bd` with
  `http_exchange_head_returns_no_body` through loopback; the existing
  `Host: loopback.test` POST exchanges are unchanged.
- [ ] 2.5 Run `beskid analyze` for the HTTP fixture target.
- [ ] 2.6 Run strict OpenSpec validation and final release evidence after the
  prerequisite changes have independently passed.
