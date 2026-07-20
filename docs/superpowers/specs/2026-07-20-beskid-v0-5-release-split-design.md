# Beskid 0.5 Release Split Design

## Goal

Deliver the Beskid 0.5 networking release through three dependent, independently
verifiable OpenSpec change sets while retaining one release-level delivery record.

## Accepted structure

The release is split by executable dependency boundary, not by repository or
implementation language:

1. `beskid-v0-5-foundations` establishes the language and runtime prerequisites:
   bindable `spawn` and `Fiber<T>`, generic GC-safe/resource-bearing channels,
   cross-thread scheduler wakes, external-wait accounting, timers and deadlines,
   scoped `use`, hardened bytes/encoding, and Core.IO.
2. `beskid-v0-5-networking` depends on Foundations and introduces the portable
   opaque socket ABI/reactor, native-handle lifecycle, DNS, TCP, UDP, loopback
   tests, and Linux/macOS/Windows conformance coverage.
3. `beskid-v0-5-http` depends on Networking and introduces strict bounded
   HTTP/1.1 parsing, serialization, routing, server lifecycle, graceful shutdown,
   compiling examples, release documentation, catalog traceability, and Tracker
   delivery evidence.

Each change owns its proposal, design, task plan, and behavioral OpenSpec deltas.
The third change owns the release-wide catalog rebuild and final evidence only
after the prerequisite changes validate. The public 0.5 API is not weakened to
accommodate a missing prerequisite.

## Runtime dependency model

```text
Language ownership + scheduler + Core.IO
                  |
                  v
        Portable socket ABI and reactor
                  |
                  v
             DNS, TCP, UDP
                  |
                  v
       HTTP/1.1 server and release evidence
```

`spawn`, channels, resource scope, deadlines, and Core.IO are prerequisites for
the public networking and HTTP APIs. Networking therefore cannot introduce
detached-only workers, scalar-only channel payloads, wall-clock I/O deadlines,
or exposed platform descriptors as temporary substitutes.

## Normative decision rules

- OpenSpec remains the normative authority; `openspec/catalog.json` is generated
  and must never be edited manually.
- The API uses C#-like Beskid syntax, `enum` discriminated unions,
  `Enum::Variant(...)`, and `use` resource scopes.
- Fibers block at the source level while the runtime uses non-blocking reactor,
  timer, and worker completion routing.
- Native handles are opaque, generation-tagged, idempotently closed, and never
  expose POSIX or Winsock constants through public APIs.
- 0.5 excludes TLS, HTTP/2, HTTP/3, QUIC, WebSocket, client pooling, proxy
  stacks, multipart streaming, transparent compression, DNS caching, Unix-domain
  sockets, raw sockets, multicast configuration, async iterators, and channel
  `select`.

## Linear alignment

The Cybernomad Linear project [Beskid 0.5 Release](https://linear.app/cybernomad-it/project/beskid-05-release-223d7ca55611)
is the release-planning record. Its umbrella issue is
[CYB-59](https://linear.app/cybernomad-it/issue/CYB-59/coordinate-beskid-05-networking-release),
with the ordered child issues:

- [CYB-60](https://linear.app/cybernomad-it/issue/CYB-60/05-foundations-executable-fibers-ownership-deadlines-and-coreio): Foundation conformance.
- [CYB-61](https://linear.app/cybernomad-it/issue/CYB-61/05-networking-portable-reactor-dns-tcp-and-udp): Networking conformance; blocked by CYB-60.
- [CYB-62](https://linear.app/cybernomad-it/issue/CYB-62/05-http-and-release-bounded-http11-examples-documentation-and): HTTP release evidence; blocked by CYB-61.

No Linear release pipeline currently exists. The project and milestones are the
delivery coordination surface until a pipeline is configured.

## Verification boundaries

Each change must pass its focused OpenSpec, compiler/runtime/corelib, and
cross-target tests before its Linear issue can advance. The final release change
also runs `bun run openspec:catalog` followed by `bun run openspec:validate` and
records the resulting catalog revision with Tracker delivery data.
