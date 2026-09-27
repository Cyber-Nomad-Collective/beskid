---
title: "v0.5: The Compiler Finally Talks to the Internet"
description: "v0.5 ships fibers, channels, a real GC heap, portable Network sockets, and a bounded HTTP/1.1 stack over one Foundation I/O path, plus the install channels to get it on your machine. Here is what shipped, what broke on the way, and what is still missing."
date: 2026-09-27
blogStatus: released
release: v0.5
draft: true
cover:
  src: "/blog-covers/v0-5-01-release.jpg"
  alt: "Women operating a Bell System telephone switchboard, 1943."
  sourceHref: "https://commons.wikimedia.org/wiki/File:Photograph_of_Women_Working_at_a_Bell_System_Telephone_Switchboard_-_NARA_-_1633445.jpg"
  sourceLabel: "US National Archives, Public domain"
---

For four versions, Beskid could not open a socket. You could parse, type-check, lower to CLIF, and produce a native binary that computed anything you wanted, as long as "anything" did not involve another machine. v0.5 is the version where that stops being true: a fiber scheduler that does not truncate your values to `i64`, a real growable heap instead of a 1 MiB region that segfaults when you look at it wrong, portable TCP and UDP sockets, and a bounded HTTP/1.1 stack on top of all of it. No TLS, no HTTP/2, no proxies, but a request goes out, a response comes back, and nothing about the path involves managing a file descriptor by hand.

This one took longer than planned, which should surprise nobody who read the last three of these posts.

## What shipped

**Fibers with an actual ABI.** `spawn` now returns a typed `Fiber<T>` handle instead of a raw thread you hoped would behave. Captures and results move through one traced ABI-value transport the GC can see and root, instead of the old scheme that shoved everything through `i64` and prayed it wasn't a pointer that mattered. `Join` and `Detach` compete for the handle's terminal state: you cannot join a detached fiber and pretend that's fine. Cancellation is idempotent, and a dropped handle no longer leaks a scheduler slot.

**Channels that hold more than sixteen things.** The old channel was a fixed 16-entry ring, the kind of limit you discover in production at the worst hour. Channels now grow with linked cells, transport full ABI values instead of scalars, and have exactly one commit point per send: the sender owns the value before, the channel owns it after, and precisely one receiver takes it on the other end. Abandoned receipts get recovered, and pre- and post-commit cancellation both work now, not just the one the old tests happened to cover.

**One owner-scheduler wait model.** External completions (readiness, timers, cancellation) used to wake whatever OS thread happened to be running the syscall, a fine strategy if you enjoy debugging races at 2 AM. Every external wait now routes through the fiber's owner scheduler and resolves through one atomic winner; the loser never produces a user-visible completion. `Core.Time.Sleep(Duration) -> Result<unit, TimerError>` is the one sanctioned way to pause a fiber. `SleepUntil(Instant)` is deliberately not here, because the current `Instant` can't enforce clock-domain separation, and I'd rather ship nothing than ship an API that lies about which clock it's reading.

**Scoped resource cleanup.** `use Type name = expression;` and the block form `use (Type name = expression) { ... }` dispose resources exactly once, in reverse order, across fallthrough, return, postfix `?`, and structured exits. This is new syntax on top of `Core.Disposable`, not an alias for the module-import `use` you already know: ordinary `use Package.Module;` imports are untouched. First cleanup error wins and gets reported while the rest of the stack still drains.

**A growable GC heap.** The 1 MiB fixed region with an illegal-instruction exit as its error strategy is gone. The heap now grows in chained regions with Lua/Go-style pacing and a configurable committed-size cap, and running out of memory produces a typed, diagnosable `out_of_memory` trap instead of a mystery crash that looks like a compiler bug until you count your allocations.

**`Network`: portable TCP, UDP, and DNS.** One manifest-registered socket ABI, opaque generation-tagged handles, and a public `Network.Types` / `Network.Errors` surface with zero descriptors, zero errno values, zero Winsock constants leaking through. Cancellable DNS resolution, TCP listeners and streams, and UDP sockets with real datagram boundaries all share one identical API on Linux, macOS, and Windows, backed by epoll, kqueue, or IOCP as appropriate, with no test-only fallback allowed near a production build. Every network resource implements the same `Core.IO` and `Disposable` contracts Foundation already defined.

**`Http`: bounded HTTP/1.1, RFC 9110 and 9112.** `corelib_http` sits entirely on `Network.TcpStream` / `TcpListener` and Foundation `Core.IO`, with no second socket path, no parallel I/O loop, and no native handle escaping the public API. It parses and serializes framing, validates headers, and rejects the ambiguous stuff on sight: obsolete line folding, bare LF, oversized sections, `Content-Length` and `Transfer-Encoding` disagreeing with each other, malformed chunks. Exactly one `Host` field is required per message; violate it and you get the typed errors `MissingHost` or `InvalidHost`, not a stack trace to reverse-engineer. `HEAD`, 1xx, 204, and 304 responses follow the RFC 9112 §6.3 no-body rules through a typed `MessageRole`, and close-delimited bodies and interim responses both fail closed. The client's exchange function is, roughly: hand it a `Request`, get back a `Result<Response, HttpError>`, and every error variant tells you exactly which framing rule you broke.

What's deliberately absent, because I said so in the proposal and I'm not walking it back three months later: TLS, HTTP/2, HTTP/3, WebSocket, proxies, compression, connection pooling, upgrades. This is a transport-honest HTTP/1.1 implementation. It doesn't pretend to be a browser engine.

**Contract-typed callables, specialized statically.** A contract-typed callable parameter now gets direct emission with conformance witnesses: no vtables, no wrapper allocations, managed receivers surviving collection and fiber suspension intact.

**Native-import preflight, fail-closed.** One check at module emission proves the exact source, service, and adapter declaration against the canonical ABI-v5 target manifest: full target coverage, one implementation per target, one shared ABI shape, or it does not compile. Copied, unknown, mismatched, or incomplete services are rejected before they become your problem in production, across every Network service.

## What broke on the way

The scalar `i64` fiber and channel representation had no migration path: it had to die all at once, because a scalar fallback next to the new ABI-value transport would have meant two competing ownership models for the same construct, which the foundations proposal itself calls out as forbidden. Existing source that spawned a fiber and threw the handle away without `Detach` now behaves differently under the new ownership rules, which broke fixtures across three packages before I remembered I was the one who'd been writing fire-and-forget spawns for two versions.

Foundation, Networking, and HTTP were built as a dependency chain on purpose, one before the next, specifically so I couldn't wire sockets before the generic transport under fibers and channels was solid. I tried to jump ahead once anyway. It did not go well, and the corelib fixtures caught it before it went further, which is the entire point of having fixtures.

`SleepUntil(Instant)` was supposed to ship this version. It didn't, because the current `Instant` has no enforced clock domain, and shipping an absolute-time API on an ambiguous clock is how you get bug reports about sleeps firing eleven hours early. Better to leave the gap documented than paper over it with an API I'd have to deprecate in v0.6.

## How to install or upgrade

The raw-binary install script still works the way it always has:

```bash
curl -fsSL https://beskid-lang.org/install.sh | bash
```

It resolves the `cli-stable` release tag by default, or set `BESKID_RELEASE_CHANNEL=unstable` if you like living dangerously. Platform packages come from the same immutable, checksummed target bundle: a `.deb` for Debian and Ubuntu (now pulling in `gcc`/`libc6-dev`, because `beskid build` links against your system `cc`), a Windows `.msi` and bundled `.exe` that chains the Visual C++ 2015-2022 redistributable when it's missing, a branded `.dmg` for macOS, and the Homebrew tap if you'd rather `brew install beskid`. All four preserve the same install prefix (CLI, LSP, updater, ABI-v5 runtime kit, corelib, bundled packages), so the CLI finds its own runtime kit relative to itself and you never set `BESKID_RUNTIME_PREFIX` by hand.

If you're upgrading from v0.4: rebuild anything that spawns a fiber and discards the handle without `Detach`. The ownership rules around that handle changed, and old code that got away with skipping `Detach` may not anymore. If you use channels directly, expect the queue representation change to touch generated code even where your source didn't.

## What is still missing

No TLS, no HTTP/2, no HTTP/3, no WebSocket, no connection pooling. The HTTP package covers the minimum the RFCs require and nothing past it, and I'd rather you know that now than when your load balancer's keep-alive assumptions don't hold. `SleepUntil(Instant)` is blocked on fixing `Instant`'s clock-domain ambiguity, which is real work I can't wave away. The native lifecycle fixture for ephemeral binding and generation reuse exists, but target execution across all three platforms is still pending: the fixture proves the design, the deployment still has to follow. Public raw-platform escape hatches for sockets do not exist and are not planned; if `Network` doesn't expose what you need, that's a gap to report, not something to route around with a `Core.Syscall` call.

The full scope, and the non-goals I intend to hold myself to next version, are in `openspec/changes/` same as always: CYB-60 for Foundation, CYB-61 for Networking, CYB-62 for HTTP.
