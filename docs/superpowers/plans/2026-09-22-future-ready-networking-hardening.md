# Future-Ready Networking Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the conformance and structural gaps between the implemented v0.5 networking and HTTP/1.1 surface and the approved future-ready networking design. Do this without widening v0.5 protocol scope.

**Architecture:** The v0.5 transport already exists: `Runtime.Network`, `corelib/packages/network`, `corelib/packages/http`, and Foundation `Core.IO`. This plan does not rebuild it. It fixes one normative violation (bare-LF framing). It replaces the duplicated byte-at-a-time HTTP read loops with one bounded message reader built on Foundation `IO.Read`/`IO.ReadExact`. It also names the runtime slot layout and status vocabulary so future adapters and protocols cannot drift on raw offsets.

**Tech Stack:** Beskid corelib/runtime sources (`.bd`), BSOL projects (`.bproj`), `beskid_cli test` in the remote `beskid-codex-build` Nix container.

**Spec:** `docs/superpowers/specs/2026-09-22-future-ready-networking-design.md` (architecture, non-normative). Normative: `openspec/changes/beskid-v0-5-networking/` and `openspec/changes/beskid-v0-5-http/`.

## Global Constraints

- v0.5 scope stays DNS, TCP, UDP, and bounded HTTP/1.1. No TLS, HTTP/2, WebSocket, QUIC, URI, CIDR, or dual-stack work in this plan.
- HTTP uses only `Network.TcpStream`, `Network.TcpListener`, and Foundation `Core.IO`. It MUST NOT implement a protocol-specific exact read/write loop (HTTP spec, "One transport path").
- The HTTP parser MUST reject bare LF with `HttpError::InvalidFraming` (HTTP spec, "Bounded strict HTTP/1.1 framing").
- No public value may expose a descriptor, `SOCKET`, `HANDLE`, errno, WSA code, readiness bit, or platform constant.
- Do not use GitNexus (active v0.5 release instruction). Use `rg` for discovery.
- Work only in `/Users/mikserek/Projects/beskid/.worktrees/compiler-f6-native-descriptor-contract` (branch `codex/f6-native-descriptor-contract`). Its root and nested `corelib` are dirty with the uncommitted v0.5 release surface. **Do not commit, reset, stash, pull, merge, or push.** Every "Checkpoint" step is a `git diff` review, not a commit. The release owner commits the combined surface later.
- **Coordination gate:** session `beskid-1a` owns `crates/beskid_queries/**`, `crates/beskid_codegen/**`, and `crates/beskid_isle/**`, and is the only session that syncs remote `/workspace/compiler`. Its nested-generic `Result<T, HttpError>` fix is green. It is still fixing a compiler gap at `Codec.bd:64` (`Framing(value.headers, limits)` on a `Result::Ok` binding). This session (`beskid-fc`) owns `corelib_tests/src/http/**`. Start Tasks 1–3 after `beskid-1a` posts that gap green on `~/.claude/handoffs/networking-coordination.md`. Never edit `crates/**` under this plan. For remote runs, ask `beskid-1a` for a slice (`/workspace/compiler-<slice>`, `CARGO_TARGET_DIR=/target/<slice>`) instead of syncing `/workspace/compiler`.
- Corelib test sources MUST NOT call `__panic_str` or other corelib services: services are authorized per canonical source file, so the call lowers as Dynamic with no never type and fails with `MissingRuleOrFact`. Use `match` with `Assert.Fail` in the error arm, as in `network/TcpTests.bd`. There is no `_u16` literal suffix; write `u16(204)`.
- Match surrounding style: PascalCase functions/types, camelCase locals, explicit `match` over `?` inside `Http.Codec`, and `u8(...)`/`_i64` literal forms as in the current code.

## Test command

All `Run:` steps use this command from the local repository root. `<Target>` is a `target` name from the named project's `.bproj`:

```bash
timeout 1500 ssh -o BatchMode=yes -J root@bdziam.dev root@10.66.0.2 \
  'podman exec -w /workspace/compiler beskid-codex-build cargo build -p beskid_cli 2>&1 | tail -2; \
   podman exec -w /workspace/compiler -e BESKID_RUNTIME_PREFIX=/workspace/verify/network-kit.F1zcEd beskid-codex-build \
   /target/debug/beskid_cli test --plain --project <Project> --target <Target>' 2>&1 | tail -40
```

- Corelib tests: `<Project>` = `corelib/beskid_corelib/tests/corelib_tests`
- Runtime tests: `<Project>` = `runtime/beskid/tests/runtime_semantics`

The remote `/workspace/compiler` tree must mirror the local worktree before each run. Use the sync method in the parallel session's log (`~/.claude/projects/-Users-mikserek-Projects-beskid/f1e5e119-*.jsonl`). If `network-kit.F1zcEd` no longer exists, run `ls /workspace/verify` in the container and use the current network kit. Do not invent a prefix.

## File map

| File | Responsibility | Tasks |
| --- | --- | --- |
| `corelib/packages/http/src/Http/Codec.bd` | Pure parse/serialize. Gains bare-LF detection and pure `MessageEnd` boundary detection | 1, 2 |
| `corelib/packages/http/src/Http/Wire.bd` (new) | The only HTTP transport read loop, over `IO.Read` and `IO.ReadExact` | 3 |
| `corelib/packages/http/src/Http.bd` | Module list | 3 |
| `corelib/packages/http/src/Http/Client.bd`, `Server.bd` | Remove duplicated `ReadWire` and call `Wire.ReadMessage` | 3 |
| `corelib/beskid_corelib/tests/corelib_tests/src/http/CodecTests.bd` | Repaired bare-LF fixture and `MessageEnd` tests | 1, 2 |
| `corelib/beskid_corelib/tests/corelib_tests/src/http/ExchangeTests.bd` (new) | Loopback client/server exchange above the 4096-byte read size | 3 |
| `corelib/beskid_corelib/tests/corelib_tests/corelib_tests.bproj` | Register `HttpExchangeTests` | 3 |
| `runtime/beskid/src/Runtime/Network/{Table,Operations,Sockets,Dns}.bd` | Named slot layout and status constants. No behavior change | 4 |

Paths below are relative to the worktree root.

---

### Task 1: Bare-LF framing conformance

The existing test `http_rejects_bare_lf_and_conflicting_framing` is vacuous. Its input `"GET / HTTP/1.1 Host: example.test"` contains a space where the LF should be (verified with `od -c`). The codec has no bare-LF check. It returns `HeaderTooLarge` for that input, so the test's `InvalidFraming` assertion fails. The spec scenario is also unenforced.

**Files:**
- Modify: `corelib/beskid_corelib/tests/corelib_tests/src/http/CodecTests.bd` (`Wire`, `IsError`, bare-LF test)
- Modify: `corelib/packages/http/src/Http/Codec.bd` (`HeaderEnd` area, `ParseRequest`, `ParseResponse`)

**Interfaces:**
- Produces: `bool HasBareLf(u8[] bytes, i64 end)`, `i64 HeadScanEnd(u8[] bytes, i64 end, Limits limits)`, and `pub Result<i64,HttpError> HeadBoundary(u8[] bytes, Limits limits)` in `Http.Codec`. `HeadBoundary` returns the index of the `CRLFCRLF` terminator. Task 2 relies on `HasBareLf` and `HeadScanEnd`.

- [ ] **Step 1: Repair the fixture helper and the test**

In `CodecTests.bd`, give `Wire` a second sentinel. `~` (126) becomes a lone LF, and `|` stays CRLF:

```beskid
u8[] Wire(string text) {
    mut u8[] output = [];
    mut i64 index = 0_i64;
    while index < String.Len(text) {
        u8 value = String.ByteAt(text, index);
        if value == 124_u8 { Array.Append<u8>(output, 13_u8); Array.Append<u8>(output, 10_u8); }
        else if value == 126_u8 { Array.Append<u8>(output, 10_u8); }
        else { Array.Append<u8>(output, value); }
        index = index + 1_i64;
    }
    return output;
}
```

Add the variants Tasks 1–2 assert to `IsError`, keeping the existing arms:

```beskid
        HttpError::HeaderTooLarge => match expected { HttpError::HeaderTooLarge => true, _ => false, },
        HttpError::UnexpectedEof => match expected { HttpError::UnexpectedEof => true, _ => false, },
        HttpError::TrailingBytes => match expected { HttpError::TrailingBytes => true, _ => false, },
```

Insert these before the final `_ => false,` arm.

Replace the bare-LF test body:

```beskid
test http_rejects_bare_lf_and_conflicting_framing {
    u8[] requestLf = Wire("GET / HTTP/1.1~Host: example.test||");
    Assert.True(IsError<Request>(Codec.ParseRequest(requestLf, Types.DefaultLimits()), HttpError::InvalidFraming()), "bare LF after the request line is not HTTP/1.1 framing");
    u8[] headerLf = Wire("GET / HTTP/1.1|Host: example.test~|");
    Assert.True(IsError<Request>(Codec.ParseRequest(headerLf, Types.DefaultLimits()), HttpError::InvalidFraming()), "bare LF terminating a field line is rejected");
    u8[] responseLf = Wire("HTTP/1.1 204 No Content~~");
    Assert.True(IsError<Response>(Codec.ParseResponse(responseLf, Types.DefaultLimits()), HttpError::InvalidFraming()), "responses share the bare LF rule");
    u8[] ambiguous = Wire("POST / HTTP/1.1|Content-Length: 0|Transfer-Encoding: chunked||0||");
    Assert.True(IsError<Request>(Codec.ParseRequest(ambiguous, Types.DefaultLimits()), HttpError::AmbiguousFraming()), "length and transfer coding never coexist");
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: the Test command with `<Target>` = `HttpCodecTests`.
Expected: FAIL in `http_rejects_bare_lf_and_conflicting_framing`. The codec returns `HeaderTooLarge` (no `CRLFCRLF`) or `InvalidHeader`, not `InvalidFraming`.

- [ ] **Step 3: Implement bare-LF detection**

In `Codec.bd`, after `HeaderEnd`, add:

```beskid
/// A lone LF inside the header section is never HTTP/1.1 framing; body octets are not scanned.
bool HasBareLf(u8[] bytes, i64 end) {
    mut i64 i = 0_i64;
    while i < end {
        if bytes[i] == u8(10) && (i == 0_i64 || bytes[i - 1_i64] != u8(13)) { return true; }
        i = i + 1_i64;
    }
    return false;
}

/// The header-section prefix that may be scanned: through CRLFCRLF when found, else the bounded head.
i64 HeadScanEnd(u8[] bytes, i64 end, Limits limits) {
    if end >= 0_i64 { return end + 4_i64; }
    i64 count = Slice.Len(bytes);
    if count > limits.maxHeaderBytes + 4_i64 { return limits.maxHeaderBytes + 4_i64; }
    return count;
}

/// Index of the CRLFCRLF head terminator. Bare LF wins over size so malformed framing is reported as such.
pub Result<i64,HttpError> HeadBoundary(u8[] bytes, Limits limits) {
    i64 end = HeaderEnd(bytes, limits);
    if HasBareLf(bytes, HeadScanEnd(bytes, end, limits)) { return Result::Error(HttpError::InvalidFraming()); }
    if end < 0_i64 { return Result::Error(HttpError::HeaderTooLarge()); }
    return Result::Ok(end);
}
```

In `ParseRequest` and `ParseResponse`, replace the opening
`i64 end=HeaderEnd(bytes,limits);if end<0_i64{return Result::Error(HttpError::HeaderTooLarge());}`
with a match on `HeadBoundary`. Example for `ParseRequest`. `ParseResponse` has the same shape with `ResponseHead`/`Response`:

```beskid
pub Result<Request,HttpError> ParseRequest(u8[] bytes,Limits limits) {
    Result<i64,HttpError> boundary = HeadBoundary(bytes, limits);
    return match boundary {
        Result::Error(error) => Result::Error(error),
        Result::Ok(end) => {
            Result<Request,HttpError> head=RequestHead(bytes,end,limits);return match head {Result::Error(error)=>Result::Error(error),Result::Ok(value)=>{Result<i64,HttpError> framing=Framing(value.headers,limits);return match framing {Result::Error(error)=>Result::Error(error),Result::Ok(length)=>{Result<u8[],HttpError> body=Body(bytes,end+4_i64,length,limits);return match body {Result::Ok(payload)=>Result::Ok(Request {method:value.method,target:value.target,headers:value.headers,body:payload}),Result::Error(error)=>Result::Error(error),};},};},};
        },
    };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: the Test command with `HttpCodecTests`, then `HttpSerializationTests`.
Expected: both PASS, including the unchanged serialization round trip.

- [ ] **Step 5: Checkpoint**

Run: `git -C corelib diff --stat -- packages/http beskid_corelib/tests/corelib_tests/src/http` and review the diff. Do not commit.

---

### Task 2: Pure incremental message boundary

The shared reader in Task 3 needs to know, from buffered bytes only, whether a message is complete. It also needs to know how long it will be. For a `Content-Length` message, the answer arrives as soon as the head is parsed. That lets the reader hand the remainder to `IO.ReadExact` instead of re-parsing per byte, which is quadratic today.

**Files:**
- Modify: `corelib/packages/http/src/Http/Codec.bd`
- Test: `corelib/beskid_corelib/tests/corelib_tests/src/http/CodecTests.bd`

**Interfaces:**
- Consumes: `HasBareLf`, `HeadScanEnd`, `HeaderEnd`, `Headers`, `Framing`, `Hex` (Task 1 and existing).
- Produces: `pub Result<i64,HttpError> MessageEnd(u8[] bytes, Limits limits)`. It returns `Ok(0)` when more bytes are needed, and `Ok(total)` when the total message length is known. For `Content-Length` messages, `total` can exceed `Slice.Len(bytes)`; for no-body and chunked messages, `total <= Slice.Len(bytes)`. It returns `Error` for malformed or over-limit input. It does not check trailing bytes; the caller does.

- [ ] **Step 1: Write the failing tests**

Append to `CodecTests.bd`:

```beskid
// Corelib tests cannot call __panic_str (services are authorized per canonical
// source file) and Foundation has no never-returning API: map errors to -1 so the
// following Assert.Equal fails with its message.
i64 RequireEnd(Result<i64, HttpError> value) {
    return match value { Result::Ok(result) => result, Result::Error(_) => -1_i64, };
}

test http_message_end_waits_for_head_and_reports_declared_total {
    Limits limits = Types.DefaultLimits();
    Assert.Equal(RequireEnd(Codec.MessageEnd(Wire("POST / HTTP/1.1|Content-Len"), limits)), 0_i64, "incomplete head needs more bytes");
    u8[] partial = Wire("POST / HTTP/1.1|Content-Length: 10||abc");
    Assert.Equal(RequireEnd(Codec.MessageEnd(partial, limits)), Slice.Len(partial) + 7_i64, "declared total is known before the body arrives");
    u8[] bare = Wire("GET / HTTP/1.1|Host: a||");
    Assert.Equal(RequireEnd(Codec.MessageEnd(bare, limits)), Slice.Len(bare), "an unframed message ends at its head");
}

test http_message_end_walks_chunks_without_copying {
    Limits limits = Types.DefaultLimits();
    Assert.Equal(RequireEnd(Codec.MessageEnd(Wire("POST / HTTP/1.1|Transfer-Encoding: chunked||3|ab"), limits)), 0_i64, "split chunk data needs more bytes");
    u8[] done = Wire("POST / HTTP/1.1|Transfer-Encoding: chunked||3|abc|0||");
    Assert.Equal(RequireEnd(Codec.MessageEnd(done, limits)), Slice.Len(done), "terminal chunk ends the message");
    u8[] bad = Wire("POST / HTTP/1.1|Transfer-Encoding: chunked||3|abcX|0||");
    Assert.True(IsError<i64>(Codec.MessageEnd(bad, limits), HttpError::InvalidChunk()), "missing chunk CRLF is rejected");
}

test http_message_end_bounds_head_and_rejects_bare_lf {
    Limits limits = Types.DefaultLimits();
    limits.maxHeaderBytes = 8_i64;
    Assert.True(IsError<i64>(Codec.MessageEnd(Wire("GET /aaaaaaaaaaaaaaaa"), limits), HttpError::HeaderTooLarge()), "unterminated head past the limit is rejected");
    Assert.True(IsError<i64>(Codec.MessageEnd(Wire("GET / HTTP/1.1~"), Types.DefaultLimits()), HttpError::InvalidFraming()), "bare LF is rejected before the head completes");
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: the Test command with `HttpCodecTests`.
Expected: FAIL to compile, because `Codec.MessageEnd` is not defined.

- [ ] **Step 3: Implement `MessageEnd`**

In `Codec.bd`, after `Body`, add:

```beskid
/// Walks chunk boundaries in place. Ok(0) means more octets are required.
Result<i64,HttpError> ChunkedEnd(u8[] bytes, i64 start, Limits limits) {
    mut i64 cursor = start;
    mut i64 total = 0_i64;
    while true {
        mut i64 lineEnd = cursor;
        while lineEnd + 1_i64 < Slice.Len(bytes) && !(bytes[lineEnd] == u8(13) && bytes[lineEnd + 1_i64] == u8(10)) { lineEnd = lineEnd + 1_i64; }
        if lineEnd + 1_i64 >= Slice.Len(bytes) {
            // A size line longer than 16 hex digits cannot fit i64; do not buffer it unboundedly.
            if lineEnd - cursor > 16_i64 { return Result::Error(HttpError::InvalidChunk()); }
            return Result::Ok(0_i64);
        }
        Result<i64,HttpError> parsed = Hex(bytes, cursor, lineEnd);
        match parsed {
            Result::Error(error) => { return Result::Error(error); },
            Result::Ok(size) => {
                if size > limits.maxBodyBytes - total { return Result::Error(HttpError::BodyTooLarge()); }
                total = total + size;
                cursor = lineEnd + 2_i64 + size;
                if Slice.Len(bytes) < cursor + 2_i64 { return Result::Ok(0_i64); }
                if bytes[cursor] != u8(13) || bytes[cursor + 1_i64] != u8(10) { return Result::Error(HttpError::InvalidChunk()); }
                cursor = cursor + 2_i64;
                if size == 0_i64 { return Result::Ok(cursor); }
            },
        };
    }
}

/// Pure boundary detection for the shared transport reader; see Http.Wire.
pub Result<i64,HttpError> MessageEnd(u8[] bytes, Limits limits) {
    i64 end = HeaderEnd(bytes, limits);
    if HasBareLf(bytes, HeadScanEnd(bytes, end, limits)) { return Result::Error(HttpError::InvalidFraming()); }
    if end < 0_i64 {
        if Slice.Len(bytes) >= limits.maxHeaderBytes + 4_i64 { return Result::Error(HttpError::HeaderTooLarge()); }
        return Result::Ok(0_i64);
    }
    mut i64 lineEnd = 0_i64;
    while lineEnd + 1_i64 < end && !(bytes[lineEnd] == u8(13) && bytes[lineEnd + 1_i64] == u8(10)) { lineEnd = lineEnd + 1_i64; }
    if lineEnd > limits.maxStartLine { return Result::Error(HttpError::InvalidStartLine()); }
    Result<Header[],HttpError> headers = Headers(bytes, lineEnd + 2_i64, end, limits);
    return match headers {
        Result::Error(error) => Result::Error(error),
        Result::Ok(items) => {
            Result<i64,HttpError> framing = Framing(items, limits);
            return match framing {
                Result::Error(error) => Result::Error(error),
                Result::Ok(length) => {
                    if length == -2_i64 { return ChunkedEnd(bytes, end + 4_i64, limits); }
                    if length < 0_i64 { return Result::Ok(end + 4_i64); }
                    return Result::Ok(end + 4_i64 + length);
                },
            };
        },
    };
}
```

Note: `Headers(bytes, lineEnd + 2, end, ...)` equals the call in `RequestHead`/`ResponseHead` when the request line is followed directly by `CRLFCRLF`. In that case `lineEnd + 2 == end + 2 > end`, `Headers` returns an empty list, and the message has no framing. This matches `http_response_parser_requires_http11_status_and_exact_suffix`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: the Test command with `HttpCodecTests`.
Expected: all tests PASS, including Task 1's tests.

- [ ] **Step 5: Checkpoint**

Review `git -C corelib diff -- packages/http/src/Http/Codec.bd`. Do not commit.

---

### Task 3: One bounded HTTP transport reader

`Http/Client.bd` and `Http/Server.bd` each contain a `ReadWire` that:

- reads one byte per `IO.Read`, which costs one runtime allocation and one Foundation wait per octet;
- re-parses the entire buffer after every byte once the head is complete, which is O(n²) up to the 16 MiB default body limit;
- is a protocol-specific transfer loop that the HTTP spec forbids.

Replace both with one reader that reads 4096-byte partial chunks through `IO.Read` and hands any declared remainder to `IO.ReadExact`.

**Files:**
- Create: `corelib/packages/http/src/Http/Wire.bd`
- Modify: `corelib/packages/http/src/Http.bd`, `corelib/packages/http/src/Http/Client.bd`, `corelib/packages/http/src/Http/Server.bd`
- Create: `corelib/beskid_corelib/tests/corelib_tests/src/http/ExchangeTests.bd`
- Modify: `corelib/beskid_corelib/tests/corelib_tests/corelib_tests.bproj`

**Interfaces:**
- Consumes: `Codec.MessageEnd` (Task 2), `IO.Read`, `IO.ReadExact`, `Slice.New`, `Slice.Copy`, `Array.Append<u8>`.
- Produces: `pub Result<u8[],HttpError> ReadMessage(TcpStream stream, Limits limits)` in `Http.Wire`. It returns exactly one complete message's octets and fails with `TrailingBytes` if the peer sent octets past the message boundary in the same read.

- [ ] **Step 1: Write the failing loopback test**

Create `ExchangeTests.bd`. The request and response bodies are 10000 bytes, so both the 4096-byte partial path and the `ReadExact` remainder path run:

```beskid
use Concurrency.Fiber;
use Core.Bytes.Slice;
use Core.Collections.Array;
use Core.Results;
use Http.Client;
use Http.Errors;
use Http.Server;
use Http.Types;
use Network.Tcp.TcpStream;
use Network.Types;
use Testing.Assert;

u8[] Filled(i64 count, u8 value) {
    u8[] bytes = Slice.New(count);
    mut i64 index = 0_i64;
    while index < count { bytes[index] = value; index = index + 1_i64; }
    return bytes;
}

Result<unit, HttpError> ServeOnce(HttpServer server) {
    TcpStream stream = server.Accept()?;
    Request request = server.Receive(stream, Types.DefaultLimits())?;
    Assert.Equal(Slice.Len(request.body), 10000_i64, "server reads a body larger than one partial read");
    Assert.Equal(request.body[9999], 7_u8, "server keeps the final octet");
    Response response = Types.EmptyResponse(u16(200), "OK");
    response.body = Filled(10000_i64, 9_u8);
    server.Respond(stream, response, Types.DefaultLimits())?;
    Assert.True(match stream.Close() { Result::Ok(_) => true, _ => false, }, "accepted stream closes");
    return server.Close();
}

unit Serve(HttpServer server) {
    match ServeOnce(server) {
        Result::Ok(_) => (),
        Result::Error(_) => Assert.Fail("HTTP server exchange completes without HttpError"),
    };
}

Result<TcpStream, HttpError> ConnectHttp(SocketAddress address) {
    return match TcpStream.Connect(address, Network.Types.DefaultSocketOptions()) {
        Result::Ok(stream) => Result::Ok(stream),
        Result::Error(_) => Result::Error(HttpError::Network()),
    };
}

Result<unit, HttpError> ExchangeResult() {
    SocketAddress bindAddress = SocketAddress { address: IpAddress::V4(127_u8, 0_u8, 0_u8, 1_u8), port: Network.Types.PortBytes(0_u8, 0_u8) };
    HttpServer server = HttpServer.Bind(bindAddress, 8_i64)?;
    SocketAddress address = server.LocalAddress()?;
    Fiber<unit> serving = spawn (() => Serve(server));
    TcpStream stream = ConnectHttp(address)?;
    Request request = Types.EmptyRequest("POST", "/upload");
    Array.Append<Header>(request.headers, Header { name: "Host", value: "loopback.test" });
    request.body = Filled(10000_i64, 7_u8);
    Response response = Client.Send(stream, request, Types.DefaultLimits())?;
    Assert.Equal(response.status, u16(200), "status is retained");
    Assert.Equal(Slice.Len(response.body), 10000_i64, "client reads a body larger than one partial read");
    Assert.True(match stream.Close() { Result::Ok(_) => true, _ => false, }, "client stream closes");
    match serving.Join() {
        Result::Ok(_) => (),
        Result::Error(_) => Assert.Fail("server fiber exits"),
    };
    return Result::Ok(());
}

unit Exchange() {
    match ExchangeResult() {
        Result::Ok(_) => (),
        Result::Error(_) => Assert.Fail("HTTP loopback exchange completes"),
    };
}

test http_exchange_reads_bodies_across_partial_reads {
    Fiber<unit> scenario = spawn Exchange();
    match scenario.Join() {
        Result::Ok(_) => (),
        Result::Error(_) => Assert.Fail("HTTP exchange scenario completes"),
    };
}
```

Add `pub Result<SocketAddress,HttpError> LocalAddress()` to `HttpServer` in `Server.bd` (the `listener` field stays private):

```beskid
pub Result<SocketAddress,HttpError> LocalAddress() {Result<SocketAddress,NetworkError> address=listener.LocalAddress();return match address {Result::Ok(value)=>Result::Ok(value),Result::Error(_)=>Result::Error(HttpError::Network()),};}
```

Test code must not call `__panic_str` (see Global Constraints).

Register the target in `corelib_tests.bproj` after `HttpSerializationTests`:

```text
target "HttpExchangeTests" {
  kind = Lib
  entry = "http/ExchangeTests.bd"
}
```

- [ ] **Step 2: Run the test to establish the baseline**

Run: the Test command with `HttpExchangeTests`.
Expected: the test may PASS slowly on the byte-at-a-time implementation, which proves the fixture is sound. It FAILS only if the fixture is wrong. If it fails, fix the fixture before continuing. Record the wall time from the log for comparison in Step 4.

- [ ] **Step 3: Implement `Http.Wire` and migrate both call sites**

Create `corelib/packages/http/src/Http/Wire.bd`:

```beskid
use Core.Bytes.Slice;
use Core.Collections.Array;
use Core.IO;
use Core.IO.IoError;
use Core.Results;
use Http.Codec;
use Http.Errors;
use Http.Types;
use Network.Tcp.TcpStream;

const HTTP_READ_CHUNK = 4096;

/// The only HTTP transport read loop. Partial reads locate the head; a declared
/// Content-Length remainder is transferred by Foundation ReadExact. One exchange
/// owns exactly one message, so octets past its boundary are TrailingBytes.
pub Result<u8[],HttpError> ReadMessage(TcpStream stream, Limits limits) {
    mut u8[] wire = [];
    u8[] chunk = Slice.New(i64(HTTP_READ_CHUNK));
    i64 ceiling = limits.maxHeaderBytes + limits.maxBodyBytes + 32_i64;
    while true {
        Result<i64,HttpError> boundary = Codec.MessageEnd(wire, limits);
        match boundary {
            Result::Error(error) => { return Result::Error(error); },
            Result::Ok(total) => {
                if total > 0_i64 { return Complete(stream, wire, total); }
            },
        };
        if Slice.Len(wire) >= ceiling { return Result::Error(HttpError::BodyTooLarge()); }
        Result<i64,IoError> read = IO.Read(stream, chunk, 0_i64, i64(HTTP_READ_CHUNK));
        match read {
            Result::Error(_) => { return Result::Error(HttpError::Transport()); },
            Result::Ok(count) => {
                if count == 0_i64 { return Result::Error(HttpError::UnexpectedEof()); }
                mut i64 index = 0_i64;
                while index < count { Array.Append<u8>(wire, chunk[index]); index = index + 1_i64; }
            },
        };
    }
}

Result<u8[],HttpError> Complete(TcpStream stream, u8[] wire, i64 total) {
    i64 buffered = Slice.Len(wire);
    if buffered > total { return Result::Error(HttpError::TrailingBytes()); }
    if buffered == total { return Result::Ok(wire); }
    u8[] message = Slice.New(total);
    Slice.Copy(message, 0_i64, wire, 0_i64, buffered);
    Result<unit,IoError> rest = IO.ReadExact(stream, message, buffered, total - buffered);
    return match rest {
        Result::Ok(_) => Result::Ok(message),
        Result::Error(error) => match error {
            IoError::UnexpectedEof(_) => Result::Error(HttpError::UnexpectedEof()),
            _ => Result::Error(HttpError::Transport()),
        },
    };
}
```

Register the module in `Http.bd` before `Http.Client`:

```beskid
pub mod Http.Wire;
```

In `Client.bd`, delete `ReadWire` and replace its call:

```beskid
use Http.Wire;
// in Send:
Result<u8[],HttpError> wire=Wire.ReadMessage(stream,limits);
```

In `Server.bd`, delete `ReadWire` and change `Receive` to:

```beskid
pub Result<Request,HttpError> Receive(TcpStream stream, Limits limits) {Result<u8[],HttpError> wire=Wire.ReadMessage(stream,limits);return match wire {Result::Ok(value)=>Codec.ParseRequest(value,limits),Result::Error(error)=>Result::Error(error),};}
```

Add `use Http.Wire;`. Remove any imports that no longer have a use (`Core.Bytes.Slice`, `Core.Collections.Array`, `Core.IO.IoError`), but only after `rg` confirms they are unused in that file.

If `const HTTP_READ_CHUNK` is not accepted as an `i64` in corelib packages, which may differ from runtime sources, inline `4096_i64` at both use sites instead.

- [ ] **Step 4: Run the HTTP and network suites**

Run: the Test command with `HttpExchangeTests`, `HttpCodecTests`, `HttpSerializationTests`, and `NetworkTcpTests`.
Expected: all PASS. `HttpExchangeTests` wall time drops well below the Step 2 baseline.

- [ ] **Step 5: Shape audit**

Run: `rg -n "ReadWire|IO\.Read\(" corelib/packages/http/src`
Expected: the only `IO.Read(` call is in `Http/Wire.bd`, and there is no `ReadWire`.

- [ ] **Step 6: Checkpoint**

Review `git -C corelib status --short -- packages/http beskid_corelib/tests` and the diff. Do not commit.

---

### Task 4: Name the runtime slot layout and status vocabulary

The four `Runtime/Network/*.bd` files address the slot with raw offsets (`24 + direction * 16`, `32 + ...`, `56`, `64`, `72`, `80 + direction * 8`) and return raw status numbers (`7`, `9`, `10`, `12`–`17`). The layout is documented only in a comment in `Table.bd`. Every future adapter or protocol that touches this seam can silently drift. This task changes names only. Generated code and behavior stay identical.

**Files:**
- Modify: `runtime/beskid/src/Runtime/Network/Table.bd`, `Operations.bd`, `Sockets.bd`, `Dns.bd`
- Test: existing `runtime/beskid/tests/runtime_semantics/src/NetworkNativeTests.bd` and corelib `Network*Tests`

**Interfaces:**
- Produces, in `Table.bd`:
  - Constants: `NETWORK_TABLE_DNS = 8`, `NETWORK_TABLE_REQUESTS = 16`, `NETWORK_SLOT_NATIVE = 8`, `NETWORK_SLOT_KIND = 16`, `NETWORK_SLOT_OPTIONS = 56`, `NETWORK_SLOT_WRITE_SHUTDOWN = 64`, `NETWORK_SLOT_CREATOR = 72`
  - Accessors: `pointer NetworkSlotToken(pointer slot, word direction)`, `pointer NetworkSlotTokenOwner(pointer slot, word direction)`, `pointer NetworkSlotRequest(pointer slot, word direction)`
  - Status constants: `NETWORK_CONNECTION_ABORTED = 3`, `NETWORK_INVALID_ADDRESS = 7`, `NETWORK_DOWN = 9`, `NETWORK_NOT_CONNECTED = 10`, `NETWORK_TIMED_OUT = 12`, `NETWORK_CANCELLED = 13`. The existing `NETWORK_CLOSED`, `NETWORK_BUSY`, `NETWORK_UNSUPPORTED`, and `NETWORK_PENDING` stay.

- [ ] **Step 1: Record the green baseline**

Run: the Test command with runtime `<Project>` and `NetworkNativeTests`, then corelib `NetworkTcpTests`, `NetworkUdpTests`, `NetworkDnsTests`, and `NetworkScopeTests`.
Expected: all PASS. If any fail before the refactor, stop and report it, because this task must not mask a pre-existing failure.

- [ ] **Step 2: Add the constants and accessors to `Table.bd`**

Directly below the existing constants:

```beskid
// Status values mirror Network.Errors.NetworkError declaration order (1-based).
const NETWORK_CONNECTION_ABORTED = 3;
const NETWORK_INVALID_ADDRESS = 7;
const NETWORK_DOWN = 9;
const NETWORK_NOT_CONNECTED = 10;
const NETWORK_TIMED_OUT = 12;
const NETWORK_CANCELLED = 13;

// Table header and slot field offsets; see the layout comment below.
const NETWORK_TABLE_DNS = 8;
const NETWORK_TABLE_REQUESTS = 16;
const NETWORK_SLOT_NATIVE = 8;
const NETWORK_SLOT_KIND = 16;
const NETWORK_SLOT_OPTIONS = 56;
const NETWORK_SLOT_WRITE_SHUTDOWN = 64;
const NETWORK_SLOT_CREATOR = 72;

// Direction 0 is read/accept/receive; 1 is write/connect/send.
pub pointer NetworkSlotToken(pointer slot, word direction) { return pointer_add(slot, 24 + direction * 16); }
pub pointer NetworkSlotTokenOwner(pointer slot, word direction) { return pointer_add(slot, 32 + direction * 16); }
pub pointer NetworkSlotRequest(pointer slot, word direction) { return pointer_add(slot, 80 + direction * 8); }
```

- [ ] **Step 3: Replace every raw slot/table offset and status literal**

Mechanical substitutions across the four files:

| Raw form | Replacement |
| --- | --- |
| `pointer_add(slot, 8)` | `pointer_add(slot, NETWORK_SLOT_NATIVE)` |
| `pointer_add(slot, 16)` | `pointer_add(slot, NETWORK_SLOT_KIND)` |
| `pointer_add(slot, 24 + direction * 16)` / `pointer_add(slot, 24)` | `NetworkSlotToken(slot, direction)` / `NetworkSlotToken(slot, 0)` |
| `pointer_add(slot, 32 + direction * 16)` | `NetworkSlotTokenOwner(slot, direction)` |
| `pointer_add(slot, 40)` | `NetworkSlotToken(slot, 1)` |
| `pointer_add(slot, 56)` / `64` / `72` | `NETWORK_SLOT_OPTIONS` / `NETWORK_SLOT_WRITE_SHUTDOWN` / `NETWORK_SLOT_CREATOR` |
| `pointer_add(slot, 80 + direction * 8)` | `NetworkSlotRequest(slot, direction)` |
| `pointer_add(table, 8)` / `pointer_add(table, 16)` | `NETWORK_TABLE_DNS` / `NETWORK_TABLE_REQUESTS` |
| status `return 7` / `-7` | `NETWORK_INVALID_ADDRESS` / `-i64(NETWORK_INVALID_ADDRESS)` |
| status `9`, `10`, `12`, `13`, `14`, `15`, `17`, `3` | the matching constant |

Do not substitute `pointer_add(record, ...)` (DNS record fields) or `BESKID_NETWORK_REQUEST_*` (manifest-generated). Do not change `NetworkSlot(table, index)`, which already computes the base. The `record` offsets are DNS-private and documented at the top of `Dns.bd`. Leave them.

- [ ] **Step 4: Audit for leftovers**

Run: `rg -n "pointer_add\((slot|table), [0-9]" runtime/beskid/src/Runtime/Network`
Expected: no matches.

Run: `rg -n "return -?[0-9]+;" runtime/beskid/src/Runtime/Network`
Expected: only `return 0;` success returns and the status passthroughs that return a computed `status`/`result`.

- [ ] **Step 5: Re-run the baseline suites**

Run: the same five targets as Step 1.
Expected: all PASS, with results identical to Step 1.

- [ ] **Step 6: Checkpoint**

Review `git diff -- runtime/beskid/src/Runtime/Network`. Do not commit.

---

## Rulings needed before further work (not tasks)

These are real gaps against the design. Each changes public or normative behavior, so each needs an OpenSpec delta and a user ruling before implementation.

1. **Transport cause is erased.** `TcpStream.Read`/`Write` map every runtime status (Cancelled, TimedOut, Closed, ConnectionReset) to `IoError::ReadFailed`/`WriteFailed`. `HttpError::Transport()` then erases it again. TLS, HTTP/2, and WebSocket all need to distinguish orderly close, cancellation, and reset. Options: add portable `Cancelled`/`TimedOut`/`Closed` variants to Foundation `IoError` (Foundation spec delta), or attach a cause payload. This is a Foundation contract change owned by the release surface.
2. **Resource exhaustion reports `NetworkDown`.** The runtime table is fixed at 256 slots (`NETWORK_SLOT_COUNT`). Slot exhaustion and `SystemAllocate` failure both return status 9, which surfaces as `NetworkError::NetworkDown`. That is a misleading portable error. Adding a variant renumbers nothing if it is appended, but status 18 is reserved for native `PENDING`, so the manifest status vocabulary needs a deliberate revision.
3. **`Host` is not enforced.** RFC 9112 §3.2 requires exactly one `Host` in a request, and servers must reject a missing or duplicate `Host`. The v0.5 HTTP spec is silent, and several existing fixtures omit `Host`. Enforcing it is a request-smuggling hardening item, but it needs a spec scenario and fixture updates.
4. **Response bodies without framing.** HTTP/1.1 responses without `Content-Length`/`Transfer-Encoding` are close-delimited, and `HEAD`/`1xx`/`204`/`304` carry no body. The v0.5 codec treats every unframed message as bodiless and reports `TrailingBytes` otherwise. Decide whether v0.5 documents this as a bounded-client restriction or implements close-delimited reads.
5. **Deadlines.** Every wait registers with `-1` (unbounded), as the TCP spec requires until a typed deadline policy exists. That policy is the first Stage D prerequisite for TLS handshakes and HTTP timeouts. It belongs in its own OpenSpec change after v0.5.

Post-v0.5 Stages D and E (URI, codecs, CIDR, `ConnectHost`, TLS 1.3, HTTP/2, WebSocket, QUIC, HTTP/3) remain as sequenced in the design and research documents. Each needs its own OpenSpec change.
