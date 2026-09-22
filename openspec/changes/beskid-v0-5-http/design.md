## Design

`Http` is an octet protocol layer above `Network.TcpStream`. All reads and
writes flow through `Core.IO.Read`, `ReadExact`, and `WriteAll`; HTTP adds no
socket API and no partial-transfer retry loop. A `HttpServer` owns a
`TcpListener` and returns accepted `TcpStream` values to the owner scheduler,
whose routing and cancellation semantics remain Network's responsibility.

The parser treats headers as ASCII octets, never as a lossy Unicode line
format. It requires CRLF delimiters, rejects control bytes and whitespace in
field names, canonicalizes names to lowercase, and applies fixed defaults for
start-line, header, header-count, and body limits. `Content-Length` is accepted
only once and must exactly match the encoded body. `Transfer-Encoding` is
accepted only as the lone `chunked` coding and is mutually exclusive with
`Content-Length`. Chunk parsing validates each hexadecimal size, each CRLF,
and the terminating zero chunk. Serialization revalidates headers and emits a
single canonical `Content-Length` framing field.

The parser applies the RFC 9112 section 6.3 no-body rules through a typed
`MessageRole` (`Request`, `Response`, `HeadResponse`) that the caller passes
to `MessageEnd`, `ParseResponse`, and `Wire.ReadMessage`. A `HEAD` response
and any `1xx`, `204`, or `304` response ends at the first empty line, and a
single valid `Content-Length` on such a response is validated but not applied.
A request with no framing field has a zero-length body. A response with no
framing field that is not bodiless is close-delimited; the v0.5 bounded
exchange ("one message, no retained bytes") cannot treat EOF as success, so
it fails closed with `CloseDelimitedBody` rather than returning an empty
body. A `1xx` response fails closed with `InterimResponse` for the same
reason: the reader owns exactly one message and cannot continue to the
final response. Close-delimited reading and interim-response continuation
are deferred to a post-v0.5 change together with `Connection: close`.

Every request carries exactly one `Host` field (RFC 9112 section 3.2). The
parser counts `Host` lines after header parsing and before framing, so a
duplicate-`Host` smuggling attempt is rejected before any body allocation;
the serializer applies the same rule on send and does not invent a `Host`.
The library validates presence and syntax only; it does not compare `Host`
with an absolute-form request target. `HttpServer.Receive` returns the typed
error and the application sends the 400 response and closes.

`HttpError` is protocol-owned and deliberately does not carry an OS error.
Network transport failures are represented as `Transport(TransferFailure
cause)`, which forwards the Foundation cause from `Core.IO` unchanged so a
caller can tell peer reset, cancellation, timeout, local close, and
contention apart; HTTP adds no transport cause of its own. Malformed peer
bytes are represented as stable framing/limit errors. The bounded API
intentionally does not retain unread bytes after one parsed message: callers
must use a complete bounded message exchange rather than accidentally
mis-handle pipelined or smuggled suffix bytes.

## References

- RFC 9110, HTTP Semantics, sections 5 and 6.
- RFC 9112, HTTP/1.1, sections 2, 3, 6, and 7.
