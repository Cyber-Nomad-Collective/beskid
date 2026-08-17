# Beskid.Glue 0.5 StdioBridge Fiber — Research Report

**Date:** 2026-08-16
**Scope:** Inform the 0.5 StdioBridge runtime protocol design (the 0.4 contract is already normative in `openspec/changes/add-beskid-glue-0-4/`; 0.5 implements the runtime, per `design.md` D-GLUE-0003 and GLOSSARY `Glue generation (0.5)`).
**Method:** Web research (LSP 3.17 spec, msgpack-rpc spec, Node/Deno/Bun subprocess docs, UniFFI internals, PyO3 guide) + Beskid design grounding. Research only — no code changes.

---

## 1. LSP base-protocol framing (the canonical text-header framing)

**Source:** LSP 3.17 spec, "Base Protocol" / "Header Part" / "Content Part" (microsoft/language-server-protocol).

### The framing
The LSP base protocol is HTTP-like: a **header part** and a **content part** separated by `\r\n`.

```
Content-Length: 230\r\n
Content-Type: application/vscode-jsonrpc; charset=utf-8\r\n
\r\n
<json-rpc payload bytes>
```

Rules (verbatim from the spec):
- Each header field is `name: value` terminated by `\r\n`. Header semantics conform to RFC 7230 §3.2.
- The last header **and** the overall header are each terminated by `\r\n`, so **two `\r\n` sequences always immediately precede the content** (given at least one mandatory header).
- **Headers are ASCII-encoded**, including the separating `\r\n`.
- `Content-Length` (number, **bytes** of the content part) is **required**.
- `Content-Type` (string) is optional; defaults to `application/vscode-jsonrpc; charset=utf-8`. The charset defaults to `utf-8`, which is **the only encoding supported**. A receiver that gets a different charset "should respond with an error." Prior versions used the non-standard token `utf8`; receivers should treat `utf8` as `utf-8` for back-compat.
- The content part carries **JSON-RPC 2.0** messages (`RequestMessage` with `id/method/params`, `ResponseMessage` with `id/result/error`, `NotificationMessage`, plus `$/cancelRequest` and `$/progress`).

### Why this framing (vs newline-delimited, vs msgpack)
- **Length-prefix beats newline-delimited** because JSON-RPC payloads are objects, not lines: a payload can legally contain `\n` inside a string, so newline framing forces either base64/escaping or a streaming JSON decoder that tracks string state. `Content-Length` lets the reader do one bounded `read_exact(N)` and then hand a complete byte slice to the JSON parser — no incremental-parse state machine, no ambiguity.
- **Text headers beat a binary length word** because the protocol was designed to be debuggable with `tee`/Wireshark and to be implementable in any language's stdio without a binary codec. The ASCII header is trivially greppable; the payload is still human-readable JSON.
- **JSON beats msgpack/CBOR here** because LSP is a tooling-interoperability protocol: every editor and every language server must interoperate, and JSON+schema is the lowest-common-denominator type system. Compactness is irrelevant at LSP message volumes.
- The HTTP-like shape (not coincidentally) lets implementations reuse HTTP header parsers and reuse the well-understood "headers then fixed-length body" mental model.

### How the server knows a message is complete
1. Read bytes until the `\r\n\r\n` terminator → parse header fields (at minimum `Content-Length`).
2. `read_exact(Content-Length)` → that byte slice **is** one complete JSON-RPC message. No lookahead, no delimiter scan.
3. Loop. The next message starts immediately after.

### Failure modes
- **Partial header read** (stream returned fewer bytes than the `\r\n\r\n`): the reader must buffer and re-attempt — stdio `read` returns arbitrary chunks; a correct implementation accumulates until the terminator appears.
- **Partial content read** (got `Content-Length: 230` but only 180 body bytes): must keep reading until 230 are accumulated; never parse a short body.
- **Encoding mismatch**: a `Content-Type` charset other than `utf-8` is an error; the spec says respond with an error rather than guess. (The historical `utf8` token is accepted as `utf-8`.)
- **No `Content-Length`**: malformed — the message cannot be bounded; the spec makes the header mandatory.
- **`Content-Length` not in bytes**: it **is** in bytes; a common bug is counting UTF-8 code points or UTF-16 code units instead of bytes. Since the content is UTF-8, byte length is what must be sent.
- **Stale/interleaved bytes**: because framing is strictly length-prefixed, any leftover bytes from a previous misparse corrupt the next header. Implementations must be strict and typically reset only on `\r\n\r\n`.

### Takeaway for Beskid
LSP framing is the gold standard for **text/debuggable** stdio RPC. Its design choices — (a) ASCII length header, (b) mandatory byte length, (c) UTF-8-only content, (d) JSON-RPC envelope, (e) two-`\r\n` terminator — are all directly portable. But Beskid.Glue is a **typed** bridge between Beskid and a foreign *library*, not a human-tooling protocol, so the JSON/text choice is not forced (see §2, §8).

---

## 2. Binary framing over stdio — alternatives

### msgpack-rpc (the canonical binary length-prefix-ish RPC)
**Source:** `msgpack-rpc/spec.md` (msgpack-rpc/msgpack-rpc).

The message **is** a msgpack array; framing over a stream is "msgpack is self-delimiting when decoded from a stream" — i.e. you feed bytes into a streaming msgpack unpacker and it tells you where one object ends. Concretely:

- **Request:** `[type(=0), msgid:u32, method:str, params:array]` — a 4-element msgpack array (fixarray header `0x94` for ≤15, or array16/array32 otherwise).
- **Response:** `[type(=1), msgid:u32, error, result]`.
- **Notification:** `[type(=2), method:str, params:array]` — 3-element array.
- `msgid` is a u32 sequence number echoed in the response — exactly Beskid's `Channel<T>`/future-correlation pattern.
- Responses **need not be in request order** (the spec explicitly allows this for pipelining); correlation is by `msgid`.
- The spec lists async/future calls as a first-class client feature and TCP/UDP/unix-socket as transports — stdio is just another byte stream.

So msgpack-rpc does **not** use an explicit `Content-Length`; it relies on the msgpack decoder's streaming self-delimiting. That is cheaper bytes-wise but couples framing to the codec (you cannot split frames without running the decoder).

### bincode / postcard (Rust serde binary)
- **bincode**: fixed little-endian bincode is *not* self-delimiting for top-level messages — you serialize one `T` and get bytes, but on a stream you cannot tell where one ends without knowing the schema or length-prefixing. Standard practice: **length-prefix with a fixed-width u32/u64 LE word** before each bincode blob, or use bincode's varint config. Framing = `[len:u32 LE][bincode blob]`.
- **postcard**: serde format designed for embedded/no-std; **self-describing length via COBS** is common, or again a length-prefix. postcard with COBS gives you a self-synchronizing stream (no byte-stuffing ambiguity) at a small CPU cost.
- Both are schema-coupled (you must share the `T` on both sides) and produce the **smallest** payloads for typed Beskid→foreign messages with no per-field type tags.

### capnp / protobuf (schema'd binary)
- **Cap'n Proto**: messages are **length-prefixed by segment count**; the standard stream framing is "a stream of messages, each preceded by a 4-byte segment-count word (LE) followed by segment sizes." This is the canonical low-overhead framed binary format and is byte-exact (no padding). But it requires a schema and codegen on both sides.
- **protobuf**: wire format is field-tag-delimited, but a *message* on a stream needs framing — gRPC uses HTTP/2 frames; raw stream use conventionally prefixes each serialized message with a varint length (`delimited` mode in C++/Java). So protobuf framing = `[varint length][proto bytes]`.

### CBOR
- Self-describing binary (RFC 8949). Like msgpack, a streaming CBOR decoder self-delimits. Concise, schema-optional (you can use tagged values for typed tags). Slightly larger than msgpack, richer type system (tags, indefinite-length).

### Lowest-overhead framing for a *typed* Beskid→foreign message
Ranked by overhead for a typed call envelope (small method id + msgid + params):

1. **bincode + fixed u32 length-prefix** — smallest bytes, but schema-coupled and endian-fixed. Best when both ends are Rust or share the serde `T`. ~4 bytes frame overhead + compact payload.
2. **postcard + u32 length-prefix (or COBS)** — similar size, no-std friendly, good for foreign procs that can speak a small fixed wire format.
3. **Cap'n Proto** (segment-count framing) — zero-copy, no encode/decode step, but schema + codegen both sides; worth it only at high throughput.
4. **msgpack-rpc** — self-delimiting, no explicit length word, but codec-coupled and carries per-value type tags (larger than bincode for typed data). Best when the foreign side is dynamic (Python/Node) and you want a spec'd RPC envelope for free.
5. **CBOR** — like msgpack, schema-optional, slightly larger.
6. **LSP text framing** — largest, CPU-heaviest, but human-debuggable and needs no codec on the framing layer.

**Recommendation:** Beskid.Glue should define **one canonical framing layer** that is codec-agnostic: a **fixed-width little-endian u32 length prefix followed by a codec-tagged payload** (1 codec byte, or a codec negotiated at handshake). This lets the 0.5 runtime ship with a `postcard`/`bincode` codec for the Rust→foreign case (smallest, typed) and a `msgpack` codec for dynamic-foreign cases (Python/Node), without changing the framing code. This is strictly better than copying LSP's text header for an internal typed bridge (see §8 for why text still has a role).

---

## 3. Subprocess IPC patterns (host managing a foreign proc over stdio)

### Node `child_process`
**Source:** Node.js v26 `child_process` docs.

- `spawn(command, args, { stdio: ['pipe','pipe','pipe'] })` gives the parent `child.stdin` (Writable), `child.stdout`/`child.stderr` (Readable) as **stream objects**.
- Pipes have **limited, platform-specific capacity**. Quoting the docs: *"If the subprocess writes to stdout in excess of that limit without the output being captured, the subprocess blocks, waiting for the pipe buffer to accept more data. This is identical to the behavior of pipes in the shell."*
- **Backpressure is the pipe's own blocking behavior**: if the parent doesn't read, the child's `write` blocks (or, in async-stream terms, the child's writable `write()` returns false and `'drain'` must be awaited). Node streams expose this as the standard `write() → bool / 'drain'` protocol. So a well-behaved host **must** continuously drain `child.stdout` or the child deadlocks.
- `child_process.fork()` adds a dedicated **IPC channel** (a 4th fd) with `child.send(msg)` / `'message'` event, JSON or "advanced" (structured-clone v8) serialization. This is Node's built-in message bridge: a length-prefixed JSON channel over an extra fd, **separate** from stdio. (Relevant precedent: a dedicated message fd is cleaner than overloading stdout.)
- `serialization: 'advanced'` enables structured clone (handles more types than JSON).
- The docs warn that synchronous methods (`execSync`, `spawnSync`) **block the event loop** — equivalent to a cooperative scheduler blocking: only acceptable for short calls.

### Deno `Deno.Command`
**Source:** Deno subprocess API docs.

- `new Deno.Command(cmd, { args, stdin: "piped", stdout: "piped", stderr: "piped" }).spawn()` returns a `ChildProcess` whose `stdin` is a `WritableStream<Uint8Array>` and `stdout`/`stderr` are `SubprocessReadableStream` (a `ReadableStream<Uint8Array>` subclass with `.json()`, `.text()`, `.bytes()`, `.arrayBuffer()` helpers — i.e. the JSON framing helper is built in).
- Streams are **Web Streams** — backpressure is the standard `ReadableStream`/`WritableStream` pull model: a producer writing faster than the consumer pulls is naturally bounded by the stream's internal queue strategy; `pipeTo` applies backpressure automatically.
- `child.status` is a `Promise<CommandStatus>`; `ref()/unref()` control whether the child blocks event-loop exit (the Deno equivalent of Node's `child.unref()`). `unref()` is the pattern for "this fiber owns the proc but must not keep the runtime alive on its own."
- Deno has **no built-in IPC channel** like Node's `fork` — stdio is the only message channel. (Deno's `worker_threads` have `postMessage`, but that's in-process, not subprocess.)

### Bun `Bun.spawn`
*(Docs URLs 404'd during research; from established Bun API knowledge:)* `Bun.spawn({ cmd, stdio: ['pipe','pipe','pipe'] })` returns a `Subprocess` with `stdin`/`stdout`/`stderr` as Bun's `Blob`-backed streams (sync `ReadableStream`/`WritableStream`); supports `stdin: new Blob(...)` and reading via `await proc.stdout.arrayBuffer()` / `.text()` / `.json()`. Same pipe-buffer backpressure semantics as Node. Bun also exposes a Node-compatible `child_process` via its Node-API compat layer.

### Rust `std::process::Command` + tokio/async-std
- `Command::new(...).stdin(Stdio::piped()).stdout(Stdio::piped()).spawn()` → `Child` with `child.stdin: ChildStdin`, `child.stdout: ChildStdout` (these are `AsyncRead`/`AsyncWrite` under tokio).
- `tokio::io::AsyncReadExt::read_buf` / `read_exact` for bounded reads; `tokio_process` patterns: spawn a task per pipe that loops `read` → forwards to a channel; `tokio::select!` to multiplex stdout/stderr/exit.
- **Backpressure**: OS pipe buffer (typically 64 KiB on Linux, tunable); if the Rust reader stops `await`-ing, the child's `write` blocks. tokio's async model means a fiber-equivalent task that `await`s `stdout.read_buf` naturally yields to the scheduler while waiting — the pipe read is the suspension point.

### Backpressure summary (cross-cutting)
On every platform, **a pipe has a fixed kernel buffer** (commonly 16–64 KiB). The producer (foreign proc) blocks in `write` when the buffer is full. The host's obligations:
1. **Always drain.** A host that spawns a proc and never reads stdout will deadlock the proc the moment it fills the buffer. The stdio bridge fiber **must** continuously read.
2. **Bound your own send queue.** If the host writes requests faster than the foreign proc reads them, the host's write blocks — which, in a cooperative scheduler, must yield, not busy-spin.
3. **One fiber/task per pipe** (read side) is the canonical pattern: it `read_exact`s one framed message at a time and pushes it into a `Channel<StdioBridgeMessage>`. The fiber's suspension on `read_exact` is exactly the scheduler yield point.

This maps cleanly onto Beskid's 0.5 Foundation scheduler: a pipe `read_exact` is an **external I/O wait** that increments the scheduler's active-external-wait counter (per the v0.5 Foundations plan: "Increment/decrement active external waits across submission and terminal completion") so the scheduler doesn't falsely report deadlock when all fibers are parked on pipe reads.

---

## 4. Fiber-based message bridges (coroutine runtimes ↔ subprocess)

### Go goroutines + `os/exec`
- `exec.Command(...).StdinPipe()` / `StdoutPipe()` return `io.WriteCloser` / `io.ReadCloser`. A goroutine does `bufio.NewReader(stdout).ReadString('\n')` or a length-prefixed read; the goroutine **blocks** the read but **not** the runtime — Go's M:N scheduler parks the goroutine on the pipe's fd (netpoller for sockets; for pipes, a blocking read on the goroutine's own M, or `os/signal`-style blocking). The scheduler runs other goroutines on other Ps.
- Pattern: one goroutine reads framed messages → pushes to a Go `chan Msg` (bounded channel = backpressure); the request goroutine writes to `stdin` and selects on the response channel keyed by msgid. This is *exactly* the msgpack-rpc pipelining model and *exactly* the Beskid `Channel<StdioBridgeMessage>` shape.

### Kotlin coroutines + `Process`
- `ProcessBuilder.start()` gives a blocking `InputStream`. A coroutine wraps it with `Dispatchers.IO { input.read(buf) }` — the `Dispatchers.IO` pool is the bridge from blocking pipe I/O to the cooperative coroutine world. A `Channel<Msg>` (capacity-1 or buffered) carries decoded messages; `select` correlates by msgid.
- The lesson: a cooperative runtime without native non-blocking pipes **dispatches** the blocking read to a dedicated I/O dispatcher/pool and bridges back via a channel. Beskid's scheduler can do this natively if its syscalls already park fibers on external waits (Foundation F3.2 "active syscall wait with all fibers parked").

### Lua coroutines + `io.popen`
- `io.popen` returns a file handle read line-by-line; coroutines `yield` between reads. Cooperative but single-threaded and fragile — no backpressure model, no multiplexing. This is the minimal "cooperative IO over a subprocess" and shows the floor of the design space: you can always do it, but without a real scheduler you stall the whole VM on a blocking read.

### Beskid fiber model mapping (the key question)
Beskid's model (from CHANGELOG / v0.5 Foundations / `__fiber_*` intrinsics / `Channel<T>` / `Hub<T>`):
- `spawn` → `Fiber<T>` (generic, rooted result).
- `Channel<T>` — bounded, traced ABI-value transport (the v0.5 contract **explicitly** rejects a scalar-only channel and requires one traced ABI-value record representation; `Channel<u8[]>` and aggregate payloads are first-class). Backpressure is explicit: bounded queue, parked sender retention, close-after-queue-drain.
- `Hub<T>` — multi-subscriber broadcast (`Hub.Register<T>` returns `Channel<T>`-like); used for fan-out.
- Scheduler: owner-routed external completions; an external event reaches one owner scheduler; close/readiness/cancel/timeout arbitrated by one atomic winner transition. `__fiber_yield()` is the trusted suspension intrinsic.

**Can a fiber block on a pipe read and yield?** Yes, and the design already requires it:
- A stdio bridge fiber owns the foreign proc's pipes. To read one framed message it must `read_exact(len)` — a sequence of pipe reads that may each return `EAGAIN`/short. Each such read is an **external I/O wait** that parks the fiber (via the readiness/cancel/close winner-selection the Foundations plan specifies for sockets). The fiber yields (`__fiber_yield` or the readiness-park path) and the scheduler runs other fibers.
- This is **structurally identical** to the TCP accept/worker pattern in the v0.5 networking plan (`Channel<TcpStream>`, one accept fiber, bounded queue). The stdio bridge is the IPC analogue of the TCP server: pipe instead of socket, framed messages instead of byte streams, `GlueTag`-keyed dispatch instead of connection-keyed dispatch.
- `Hub<T>` fits **export** fan-out (multiple foreign libraries subscribed to Beskid-side events) and **broadcast notifications** (LSP-style `$/progress` equivalents). `Channel<T>` fits the per-call request/response correlation.

So the Beskid.Glue StdioBridge fiber is not a foreign concept grafted onto the runtime — it is the same shape as the already-planned networking fibers, which de-risks it: the scheduler, channel backpressure, and external-wait accounting that 0.5 Foundation must deliver for networking are *exactly* what the stdio bridge needs.

---

## 5. Typed tag objects for foreign values (how runtimes tag foreign values)

### PyO3 `PyObject` / `Bound<PyAny>`
- An opaque handle (`*mut ffi::PyObject`) into the CPython runtime; type info lives **in Python** via `obj.get_type()` / `obj.is_instance()`. The Rust side holds a borrowed (`Borrowed<'py>`) or owned (`Py<...>`) reference; the GIL is the synchronization domain. So the "tag" is (reference + GIL lifetime); type identity is queried, not stored.

### napi-rs `napi_value`
- Opaque handle tagged at the C-API level by `napi_typeof` returning a `napi_valuetype` enum (`napi_string`, `napi_object`, ...). Type info is **reified per-value** via the napi type query, not stored alongside the handle. Reference counting via `napi_reference`.

### jni-rs `jobject` + `jclass`
- Two handles: the object (`jobject`, local or global ref) and its class (`jclass`, via `GetObjectClass`). Type identity is a separate `jclass` lookup, not embedded in `jobject`. Global refs survive across JNI calls; local refs are frame-scoped.

### .NET `System.Object` + `GetType()`
- Object reference + reflection: `obj.GetType()` returns a `Type` handle; type identity is queryable via the runtime's metadata system. For NativeAOT, reflection is trimmed — so a .NET foreign lib that Beskid bridges to via NativeAOT should expose a **fixed C ABI surface** rather than rely on `GetType()`.

### The pattern across all four
A foreign value is represented as **(opaque handle, type-identity query)**, where:
- the handle is owned/borrowed with a well-defined lifetime (GIL, local/global ref, refcount);
- type identity is either **queried on demand** (PyO3, napi, JNI, .NET reflection) or **fixed at the boundary** (schema'd C ABI / uniffi, where the type is known statically from the signature).

### How Beskid should represent a foreign value: `GlueTag`
The Beskid 0.4 design already nails this (`spec.md` "GlueTag host typed tag object", GLOSSARY "Host typed tag object"):

> `GlueTag` carries the **backend kind** (`GlueBackendKind`: `Rust` or `DotNet`) and the **library identity**; it is a **host typed tag object**: the **host (Rust) owns the tag allocation and identity**; Beskid code references the tag through an **opaque handle**.

Concretely, the right shape (consistent with the design's "host owns, Beskid holds an opaque handle" rule and with the cross-runtime pattern above):

```
GlueTag = {
    backend: GlueBackendKind,     // Rust | DotNet | (extensible)
    lib_id: LibId,                // which imported/exported library
    handle: OpaqueHandle,         // host-owned, Beskid-opaque
    type_id: TypeId,              // Interop.Contracts TypeShape identity (static, from signature)
}
```

Key design points that follow from the cross-runtime survey:
- **`backend` + `lib_id`** route to the correct foreign runtime/process — this is the `GlueTag` dispatch scenario ("two imported libraries with distinct `GlueTag` values → dispatch to the one identified by that tag").
- **`type_id`** should be **static, from the `Interop.Contracts` signature**, not a per-value runtime query. This is the uniffi/ABI-profile choice (type known at the boundary), not the PyO3/JNI choice (query at runtime). Reason: Beskid's boundary is schema'd (`SignatureReader`/`SignatureWriter` contracts read/write foreign signatures into the typed `Interop.Contracts` model), so type identity is *known* at glue time; storing a static `type_id` avoids round-tripping a type query to the foreign runtime on every call. The dynamic-query path is only needed if Beskid ever bridges to a fully-dynamic foreign object (untyped Python `dict`, untyped JS object) — and for that case `type_id` can carry a special `Dynamic` variant that defers to a runtime query.
- **`handle: OpaqueHandle`** matches Beskid's existing `OpaqueHandle`-shaped tag rule and the v0.5 resource-ownership model (one traced ABI-value record, no scalar fallback). The foreign value's memory is owned by the foreign runtime; Beskid holds an opaque handle and releases it via a disposal call — *not* by Beskid GC. This is **the** reason the design rejected direct-FFI-without-bridge for the bridged case (D-GLUE-0004): "the stdio bridge decouples Beskid GC from foreign memory management."

---

## 6. Bidirectional stdio bridge (import + export)

### The two directions, precisely
- **Import (Beskid → foreign):** Beskid calls a foreign function. The design says the stdio bridge fiber "marshals calls through the tag object and the stdio message protocol." Concretely: Beskid code calls a `[GlueImport]`-attributed function → the glue-generated trampoline encodes a `StdioBridgeMessage{tag, op, msgid, args}` → sends over stdin to the foreign proc → the foreign proc dispatches to the library function → returns a `StdioBridgeMessage{msgid, result}` over stdout → the bridge fiber correlates by `msgid` and resolves the calling fiber's await.
- **Export (foreign → Beskid):** a foreign library invokes a Beskid function. The foreign proc sends a `StdioBridgeMessage{tag, op, msgid, args}` over its stdout (which is the bridge's stdin-side read) → the bridge fiber decodes → dispatches to the Beskid `[GlueExport]` function → sends `StdioBridgeMessage{msgid, result}` back over the bridge's stdin (the foreign proc's stdout) — i.e. **the same channel, role-reversed by `op`**. The design's export scenario ("a foreign library invoking a Beskid function through the stdio bridge") confirms this is in-scope for the same fiber.

So the bridge fiber is **symmetric**: it owns one stdio pair per foreign library and serves both `op = Import` and `op = Export` on the same channel, correlating by `msgid`. This is exactly the msgpack-rpc / LSP request-response model with `msgid` correlation and out-of-order responses allowed.

### How uniffi handles bidirectional (the direct-FFI reference point)
**Source:** UniFFI internals — `Rust -> Foreign calls` (VTables) and `Async Overview`.

- **Foreign → Rust (the "main" direction):** the foreign bindings call `extern "C"` scaffolding functions that uniffi generates (`#[no_mangle] pub extern "C" fn ...`). Values are lifted/lowered via `RustBuffer` (a `&[u8]`-shaped owned buffer) + a `RustCallStatus` out-param. This is **direct C ABI**, no subprocess.
- **Rust → Foreign (callbacks):** uniffi generates a `#[repr(C)]` **VTable** of `extern "C" fn` pointers, one per callback-interface method. The foreign side registers its vtable via `uniffi_init_<iface>_vtable(vtable)` at startup; Rust calls through the function pointers. Handles are `u64` (either a hashmap key or a raw pointer cast). **This is in-process, same-address-space, via function pointers — not stdio.**
- **Async (the crucial precedent for Beskid):** uniffi **piggybacks on the foreign runtime's event loop**. Rust `Future`s are driven by `rust_future_poll` with a **waker callback** (`extern "C" fn(data, status)`); the foreign side's event loop calls `poll` and, when the waker fires, schedules another `poll`. Rust→foreign async calls use a **oneshot channel**: Rust leaks a `oneshot::Sender` as a raw pointer, passes it to a foreign callback; the foreign side resolves it. Uniffi's explicit claim: *"All the async code can run in the foreign runtime and Rust never has to start its own eventloop thread."*

The uniffi async model is **the closest analogue to Beskid's stdio bridge** — but uniffi runs **in-process** via function pointers, while Beskid's bridge runs **out-of-process** via framed stdio. The waker-callback / poll / oneshot-channel mechanics translate directly: Beskid's `Fiber<T>` await is the "future poll"; the stdio `msgid` is the "oneshot sender"; the bridge fiber is the "foreign event loop" driving the calls.

### How PyO3 handles bidirectional
- **Python → Rust:** `#[pymodule]` registers `#[pyfunction]`s as a native CPython extension (`cdylib`); Python calls them via the CPython C API; the GIL is the synchronization domain. Direct C ABI, in-process.
- **Rust → Python:** `Python::with_gil(|py| { py.eval(...) / obj.call(...) })` — Rust calls **into** the embedded Python interpreter via the C API, passing `PyObject`s. Also in-process.

### Key contrast
Both uniffi and PyO3 do **in-process, in-address-space** bridging via the C ABI and function pointers (or the interpreter's C API). They never spawn a subprocess for calls. **The stdio-bridge subprocess model is a different point in the design space:** it is for when the foreign code **cannot be linked into Beskid's process** — either because (a) the foreign runtime must own its own GC/threads (a Python interpreter, a JVM, a Node VM) and you don't want to embed it, or (b) the foreign side is a separate built artifact that exposes a stdio RPC mode rather than a C ABI.

---

## 7. The Beskid.Glue stdio bridge vision — concretely, and is it realistic?

Restating the plan ("Beskid.Glue generates a fiber for stdio with host typed tag objects for each imported language library") in concrete terms, cross-referenced to the 0.4 design:

1. **At glue-mod load time**, for each `[GlueImport(library: "X")]` attribute, the glue generator emits a `GlueTag{backend: <Rust|DotNet>, lib_id: X, ...}` and a `StdioBridge` fiber spec.
2. **The fiber owns the foreign subprocess's stdio pipes** (spawned via the Rust host seam — `beskid_abi`'s process I/O, per design D-GLUE-0004: "the host seam ... filesystem/process I/O ... is Rust"). The fiber holds `child.stdin`/`child.stdout` (async, via the host's async runtime) and a registry of `GlueTag → (proc, msgid_table)`.
3. **Read loop (one fiber per library):** `read_exact(len)` → decode `StdioBridgeMessage` → dispatch by `op`:
   - `Import` response: resolve the awaiting Beskid fiber's `msgid`.
   - `Export` request: call the Beskid `[GlueExport]` function; enqueue the result to be written back.
   - notification: fan via `Hub<T>` if subscribed.
4. **Write side:** a bounded `Channel<StdioBridgeMessage>` feeds the write loop; backpressure is the channel's bounded queue + the pipe's kernel buffer (§3).
5. **Foreign values** are `GlueTag`-typed opaque handles (§5); marshalling uses the `Interop.Contracts` typed model bound to a codec (§2).
6. **Lifecycle:** fiber spawned at glue-mod load, joined at glue-mod unload (the design's "fiber spawned and joined at glue mod load/unload" reading, consistent with v0.5 main-fiber child shutdown).

### Realism assessment
**Realistic — and lower-risk than it looks**, for three reasons:

1. **It is structurally the same as the already-planned networking fibers.** The v0.5 Foundation + networking plans must deliver: bounded `Channel<T>` with traced ABI-value transport, owner-routed external I/O completion, readiness/cancel/close winner selection, "active syscall wait" deadlock avoidance, and one-accept-fiber-plus-bounded-queue lifecycle (TCP server). The stdio bridge is the IPC-flavored instance of the same shapes: pipe in place of socket, framed messages in place of byte streams, `GlueTag`-keyed dispatch in place of connection-keyed dispatch. Anything the scheduler must do for TCP it must do for the bridge; nothing extra is required.

2. **The bidirectional, out-of-order, msgid-correlated request/response model is well-trodden.** LSP, msgpack-rpc, JSON-RPC, and uniffi's async all use it. The `StdioBridgeMessage` envelope (tag + op + msgid + payload) is a standard RPC envelope; correlation by `msgid` is standard; out-of-order responses are explicitly fine (msgpack-rpc spec; LSP "Message Ordering" allows reordering when independent).

3. **The host-seam split matches Beskid's existing architecture.** Glue rules in Beskid `type=Mod` packages; the Rust seam does process I/O and codec dispatch. This is the same mod/Host-bridge pattern as the rest of the compiler SDK.

### Latency / throughput vs direct C ABI
- **Per-call latency:** stdio bridge adds a full process round-trip per call: encode → pipe write → foreign decode → execute → encode → pipe write → Beskid decode → resolve. On a loopback pipe this is low-single-microsecond for the kernel pipe hop, plus the codec cost (postcard/bincode decode is sub-microsecond for small messages). Realistically **~5–50 µs per call** depending on codec and message size, dominated by context switches and the foreign runtime's dispatch. Direct C ABI calls (uniffi-style) are **~10–100 ns**. So the bridge is **~100–1000× slower per call** than in-process C ABI.
- **Throughput:** pipelining (send N requests, receive N responses out of order) recovers most of this — the pipe can be kept full; the bottleneck becomes foreign-side execution, not round-trip latency. For batch APIs this is fine; for tight per-element foreign calls (e.g. calling a foreign function in an inner loop) the bridge is the wrong tool (see §8).
- **Verdict:** the bridge is realistic for **coarse-grained** interop (call a foreign library function, get a result, where the call does meaningful work). It is the wrong tool for **fine-grained** interop (per-element callbacks in a hot loop), where direct C ABI is mandatory.

---

## 8. When is the stdio bridge appropriate vs direct C ABI? — the central design question

### The decision rule (from the cross-runtime survey + the Beskid design)
The 0.4 design **already commits to having both**, and the GLOSSARY encodes the rule precisely:

> **Stdio bridge fiber** — "...proxies calls between the Beskid runtime and a foreign library over a stdio message protocol, **for cases that cannot be direct FFI**."

And the rejected alternative in D-GLUE-0004 is "direct FFI calls **without a stdio bridge**" — i.e. the design rejects making *everything* direct FFI; it does **not** reject direct FFI as one of two paths. The `Interop.Contracts` typed model is explicitly bound by **C and Rust ABI profiles** (`bind()` methods) — those are the direct-FFI path. The stdio bridge is the *other* path, for the cases the C ABI profiles can't cover.

So the answer to "does Beskid.Glue need BOTH, or is stdio universal?": **Both.** They are not alternatives; they are two profiles over the same `Interop.Contracts` typed model:

| Path | When | Why |
|---|---|---|
| **Direct C ABI** (C/Rust ABI profile, uniffi-style) | Foreign code compiles to a **native lib** the Beskid process can `dlopen`: a Rust crate (`cdylib`), .NET **NativeAOT**, a C library. | No subprocess, no codec, no round-trip; ~10–100 ns calls; the foreign lib shares Beskid's address space. Type identity is static from the `Interop.Contracts` signature. |
| **Stdio bridge fiber** | Foreign code runs in a **separate runtime/process** that owns its own GC/threads and exposes a **REPL/IPC mode**: Python interpreter, Node VM, JVM (if not JNI-embedded), a .NET hostfxr host, or any foreign artifact that ships a stdio RPC adapter instead of a C ABI. | Decouples Beskid GC from foreign memory management (the design's stated reason); isolates foreign runtime faults; supports both import and export; extends to sockets/pipes in 0.5+ without new architecture. |

### What "stdio pair with library for each lang (beskid + rust crate / dotnet project)" means
The 0.4 design's `Backend` trait has three variants: `CraneliftClif` (the default, CLIF), `RustSource` (emit a Rust crate), `DotnetProject` (emit a .NET project). The emitted **artifact** is a native library in the direct-ABI case. **But** the artifact can also be built to expose a **stdio RPC entry** instead of (or alongside) a C ABI entry — i.e. the same emitter (`RustSource` / `DotNetProject`) can produce either:
- a `cdylib` with `#[no_mangle] extern "C"` symbols (direct C ABI path, bound by the C ABI profile), **or**
- an executable that reads `StdioBridgeMessage` frames from stdin and writes them to stdout (the stdio bridge path).

So "a stdio pair with a library for each lang" reads as: **per language, emit a foreign artifact, and the Beskid side talks to it over a stdio message pair when it cannot `dlopen` it directly.** It is not "emit a lib AND a fiber always"; it is "emit the artifact in the shape the chosen transport needs." For Rust and NativeAOT .NET, prefer the direct C ABI profile (no fiber). For interpreter-backed or isolated runtimes, prefer the stdio bridge fiber. The `GlueTag.backend` selects the dispatch path; the `Interop.Contracts` typed model is shared so both paths use identical type-shape/ownership semantics.

### Concrete 0.5 architecture recommendation

1. **One framing layer, codec-pluggable.** Define `StdioBridgeMessage` wire framing as `[len:u32 LE][codec-tag:u8][payload]` (or `[len:u32 LE][payload]` with codec fixed at handshake). Ship two codecs in 0.5: **postcard** (smallest, for Rust/typed foreign) and **msgpack** (dynamic, for Python/Node foreign). Do not adopt LSP's text header for the internal bridge — it's debuggability overhead with no benefit for a typed machine-to-machine channel. (Optionally expose a `--glue-stdio-text` debug mode that wraps frames in LSP-style `Content-Length` headers for `tee`/wireshark debugging during development.)

2. **One bridge fiber per imported library, owning one subprocess.** The fiber holds `(child stdin/stdout async, GlueTag, msgid_table: Map<MsgId, FiberHandle>)`. Read loop = `read_exact(len)` → decode → dispatch. Write loop = drain a bounded `Channel<StdioBridgeMessage>`. Backpressure = channel bound + pipe kernel buffer. The fiber parks on pipe reads via the Foundation external-wait accounting (so the scheduler doesn't false-report deadlock).

3. **Bidirectional on one channel, correlated by `msgid`.** `StdioBridgeMessage{tag, op: Import|Export|Notify, msgid, payload}`. Import and Export share the fiber and the pipes; `op` selects dispatch. Out-of-order responses allowed (msgid correlation, per msgpack-rpc / LSP precedent). Notifications fan via `Hub<T>`.

4. **`GlueTag` is a static, host-owned, Beskid-opaque typed handle** carrying `(backend, lib_id, handle, type_id)` where `type_id` comes from the `Interop.Contracts` signature (static), not a per-value runtime query — except a `Dynamic` variant for fully-untyped foreign objects.

5. **Direct C ABI remains the fast path.** The C/Rust ABI profiles bind `Interop.Contracts` for `dlopen`-able artifacts (`cdylib`/NativeAOT). `GlueTag.backend` + a transport selector route a call to either the C ABI profile (in-process, ~ns) or the stdio bridge fiber (subprocess, ~µs). Both consume the **same** `Interop.Contracts` typed model — no drift, which is exactly the design's "single source of truth" rule (D-GLUE-0002).

6. **Export via the bridge = the foreign proc sending Import-op requests *to* Beskid.** When a foreign library needs to call back into Beskid, it sends an `op=Export` `StdioBridgeMessage`; the bridge fiber dispatches to the `[GlueExport]` Beskid function and returns the result. No second channel, no separate fiber. (For in-process direct-ABI export, use the uniffi VTable precedent: Beskid exposes `extern "C"` entry points and the foreign side calls through function pointers — but only when the foreign runtime can call C, which an interpreter-via-stdio cannot.)

7. **Lifecycle & ownership.** Bridge fiber spawned at glue-mod load, joined at glue-mod unload, matching the design and the v0.5 main-fiber child-shutdown contract. The foreign subprocess is a Beskid-owned resource disposed via the same `use`/disposal contract (no implicit disposal on close — v0.5 F2.5).

8. **Extensibility (0.5+).** Because framing is codec-agnostic and the fiber owns "a transport" (not "stdio" specifically), the same fiber shape extends to unix sockets / TCP / named pipes in 0.5+ by swapping the read/write source — this is the design's stated reason for the bridge ("extends to other protocols ... without a new architecture").

### Open questions to resolve in 0.5 implementation
- **Handshake/versioning:** does the bridge open with a `Content-Length`-framed JSON `initialize` (LSP-style capability negotiation) or a binary `Hello{version, codecs, max_msg}` frame? Recommend a **binary hello frame** with codec list + `Interop.Contracts` conformance envelope version, fail-closed on mismatch (matches the ABI-v5 kit validation philosophy in `ToolchainProbe`).
- **Cancellation:** LSP `$/cancelRequest` vs. a `Cancel{msgid}` op. Recommend a first-class `op=Cancel` in `StdioBridgeMessage` correlated by `msgid` (cheaper than LSP's separate notification, and uniffi's async waker precedent supports in-band cancel).
- **Streaming/partial results:** LSP `$/progress` vs. a `Partial{msgid, chunk}` op. Recommend `op=Partial` over `Hub<T>` for fan-out progress.
- **Foreign proc crash semantics:** on child exit, all pending `msgid`s must resolve to a typed `BridgeError(Crashed)`; the `GlueTag` transitions to a terminal state; restart policy is a glue-mod decision (the design leaves lifecycle to the mod).
- **Multiple libraries, one process vs one process per library:** the design says one tag per library. Recommendation: **one subprocess per `GlueTag`** for isolation (a Python crash doesn't take down the .NET bridge); share a process only if a glue mod explicitly co-locates libraries.

---

## Summary

- **LSP framing** is the gold standard for *text* stdio RPC; its length-prefix + UTF-8 + JSON-RPC + msgid-correlation pattern is directly portable, but the text/JSON choice is a tooling-interoperability decision Beskid's internal typed bridge does not need.
- **Binary framing** (`[u32 len][codec-tag][payload]`) with a pluggable codec (postcard for typed/Rust, msgpack for dynamic) is the lowest-overhead framing for a typed Beskid→foreign message and keeps the codec swappable.
- **Subprocess IPC** across Node/Deno/Bun/Rust+tokio all converge on: bounded pipe buffers force continuous draining; one task/fiber per pipe; backpressure = channel bound + pipe buffer. Beskid's v0.5 Foundation scheduler must already deliver this for networking, so the stdio bridge inherits it.
- **Fiber mapping** is natural and low-risk: the bridge fiber is the IPC analogue of the already-planned TCP server fiber (pipe↔socket, framed↔stream, `GlueTag`-keyed↔connection-keyed). A fiber blocks on a pipe `read_exact` exactly the way it blocks on a socket read — via Foundation's owner-routed external-wait accounting.
- **Typed tags** should be **static, host-owned, Beskid-opaque** (`GlueTag{backend, lib_id, handle, type_id}`), with `type_id` from the `Interop.Contracts` signature (the uniffi/ABI-profile choice), not a per-value runtime query (the PyO3/JNI choice) — except a `Dynamic` variant for untyped foreign objects.
- **Bidirectional** is one channel, two `op`s, correlated by `msgid`, served by one fiber per library — the msgpack-rpc / LSP / uniffi-async precedent.
- **stdio vs ABI is not either/or — Beskid needs both**, and the design already commits to both: the C/Rust ABI profiles are the direct fast path for `dlopen`-able artifacts; the stdio bridge fiber is the path for runtimes that can't be linked in (interpreters, isolated runtimes). Both consume the same `Interop.Contracts` typed model — no drift.
- **Realistic:** the bridge is ~100–1000× slower per call than direct C ABI, so it is for coarse-grained interop, not hot per-element loops. Pipelining recovers throughput for batch calls.

**Bottom line:** Implement the StdioBridge as one codec-pluggable, length-prefixed, msgid-correlated, bidirectional fiber per imported library, spawned at glue-mod load and joined at unload, dispatching through static host-owned `GlueTag`s, sharing the `Interop.Contracts` typed model with the direct C ABI profiles. Treat it as the IPC sibling of the v0.5 TCP server fiber (same scheduler, channel, and external-wait machinery), and keep direct C ABI as the fast path for `dlopen`-able artifacts.
