---
title: "beskid 0.5.3: HTTPS, HTTP/2, WebSocket, QUIC and HTTP/3 in Corelib"
description: "beskid 0.5.3 adds TLS 1.3, HTTP/2, WebSocket, QUIC and HTTP/3 to Corelib, gives the compiler typed CLIF blocks and optional externs, and makes arrays cheap to grow."
date: 2026-10-09
blogStatus: released
release: v0.5.3
draft: false
cover:
  src: "/blog-covers/v0-5-3-release.jpg"
  alt: "The steamship Great Eastern at anchor among sailing ships at Heart's Content, Newfoundland, in July 1866, the month she landed the transatlantic telegraph cable."
  sourceHref: "https://commons.wikimedia.org/wiki/File:Great_Eastern_1866.jpg"
  sourceLabel: "Robert Edward Holloway (attributed), Public domain"
---

**beskid 0.5.3 is out for Linux, macOS and Windows.** The 0.5.2 post ended with a list of things HTTP did not do: no TLS, no HTTP/2, no HTTP/3, no WebSocket. This release crosses most of that list off. It is a patch number on the outside and a networking stack on the inside.

None of it is a binding to someone else's library. The protocols are written in beskid, tested with beskid's own test framework, and they run on the same TCP, UDP and DNS layer that shipped in 0.5. There is no second event loop hiding underneath.

## What you can talk to now

Corelib gains eleven packages, in the order you would build them by hand:

- **`uri`** parses and resolves URLs by the book (RFC 3986). It rejects `127.1` and other creative spellings of an IP address instead of guessing what you meant.
- **`codec`** holds the byte-level plumbing every protocol needs: big-endian integers, QUIC variable-length integers, length-prefixed vectors and a bounded buffered reader.
- **`connect`** opens a TCP connection to a host name the way browsers do (Happy Eyeballs, RFC 8305). It races IPv6 and IPv4 so one broken address family does not cost you a timeout.
- **`crypto`** and **`x509`** provide the hashes, ciphers, key exchange, signatures and certificate checks that TLS needs, including loading your system's trusted roots.
- **`tls`** is TLS 1.3. Trust is explicit: you pass a trust store and a server name, and the option that skips verification is called `DangerousAcceptAnyCertificate` so that nobody types it by accident. ALPN (the step where client and server agree on HTTP/1.1, HTTP/2 or HTTP/3) is part of the configuration, not an afterthought.
- **`http2`** speaks HTTP/2 behind the same `Request` and `Response` types the 0.5 HTTP/1.1 package already uses. Code that builds a request does not care which version carries it.
- **`websocket`** covers `ws://` and `wss://`.
- **`quic`** and **`http3`** add QUIC, the encrypted UDP transport, and HTTP/3 on top of it, with QPACK header compression.
- **`web`** is the front door. Give it an `https://` URL and it connects, negotiates TLS, and picks HTTP/2 or HTTP/1.1 from whatever the server agrees to. Ask it to prefer HTTP/3 and it tries QUIC first, then falls back to TCP if QUIC does not answer within a second.

```beskid
use Core.Results;
use Http.Types;
use Web;
use Web.WebConfig;
use Web.WebErrors;

Result<Response, WebError> FetchHome() {
    Request request = Types.EmptyRequest("GET", "https://example.org/");
    return Web.Send(request, WebConfig.DefaultClient());
}
```

Each package was checked against the published test vectors of its standard, byte for byte where the standard provides bytes. The TLS client and server also completed handshakes against OpenSSL 3.6 in both directions, the HTTP/2 server answered curl, and the WebSocket server held a conversation with Node.js. HTTP/3 has only talked to itself so far: no third-party QUIC tool was available on the test machines. Treat it as the least travelled of the new roads.

## Why the compiler changed too

Writing AES and SHA-256 in a language without an XOR operator teaches you things. Mostly it teaches you to want an XOR operator. So 0.5.3 also changes the compiler, because the networking work kept running into it.

**`clif` blocks speak real CLIF.** Before, a `clif { }` block could call a C function and return a value, and that was all. Now it accepts Cranelift IR instructions over typed values: XOR, rotates, the high half of a 64-bit multiply, carry chains and SIMD lanes. A block can also read and write the contents of a `u8[]`, `u32[]` or `i64[]` it receives as a parameter:

```beskid
pub u32 XorWordAt(u32[] words, i64 index, u32 mask) {
    return clif {
        %p = payload %0
        %stride = iconst.i64 4
        %offset = imul %1, %stride
        %address = iadd %p, %offset
        %word = load.i32 %address
        %mixed = bxor %word, %2
        store %mixed, %address
        return %mixed
    };
}
```

![Three Enigma cipher rotors in their wooden storage box, with a fourth rotor lying beside it.](/blog-images/v0-5-3-enigma-rotors.jpg)

*The last time cryptography came with this many moving parts, it fit in a wooden box. Photo: Peter Jeffery, [CC BY-SA 2.0](https://commons.wikimedia.org/wiki/File:Interchangeable_rotors_for_the_Enigma_cipher_machine_-_geograph.org.uk_-_6740722.jpg).*

This is how the crypto package got fast without leaving beskid. It is also sharp: memory access inside a block is checked for shape, not for bounds. Check the index before you call, the same way the crypto package does.

**Optional externs.** An `[Extern]` contract can now be marked `Optional:true`. If its library is missing, the program still starts and the contract's `Available()` method returns `false`. Corelib uses this to call OpenSSL's AES-GCM, ChaCha20-Poly1305 and SHA-2 when OpenSSL 3 is installed, and its own implementation when it is not. Nothing to configure. Set `BESKID_CRYPTO_PROVIDER=pure` if you want to rule the native path out.

**Corelib can grow.** Until now the compiler trusted Corelib only if the whole tree matched the copy it shipped with, byte for byte. Adding one file to Corelib switched off every runtime service it provides. 0.5.3 checks each service file on its own, so new packages can sit next to the old ones. That is how the eleven packages above got in.

**Names that start with a keyword.** `clif_xor`, `in_range`, `hostName` and `returnValue` are ordinary identifiers again. Before 0.5.3 some of them failed to parse. Worse, `u8count = 1;` parsed as a declaration of a new `u8` variable called `count`.

## Arrays got cheaper, and that changes one rule

`Slice.New(16384)` used to append one byte at a time and copy the whole array on every append. It took about 90 milliseconds. It now takes about 10 microseconds. The heap also reuses freed memory properly, so a few large buffers no longer exhaust a gigabyte of address space.

The faster `Array.Append` grows an array in place when there is room. That makes one rule visible that was always true for element writes: **arrays are shared references**. If two variables hold the same array and one appends to it, both see the new element.

Corelib's persistent collections (`List`, `Stack`, `Queue`, `Set` and `Map`) already account for this. Each version knows how much of the shared storage belongs to it, and copies before growing storage that another version has grown further. If your own code keeps old copies of an array and expects them to stay unchanged after an append, copy explicitly or use `Core.Collections.Storage.AppendAt`.

Two older sharing bugs are still there and predate this release: `Pop` on a `List` or `Stack` clears a slot that a longer version may still use, and inserting an existing key into a `Map` changes every version that shares its entries. Fixes are on the way. Until then, do not keep an old version around after popping from it or overwriting a key.

A related fix sits in the runtime's network layer. A read with a deadline could lose data: if the deadline and the data arrived together, the runtime reported a timeout and dropped the bytes it had already received. A completed transfer now wins over its deadline.

## How fast is it

These numbers come from one Linux x86-64 machine (a Ryzen 7 7700) that was busy with other work while they were taken. Read them as a rough shape, not a benchmark suite:

| Measurement | 0.5.3 |
| --- | --- |
| TLS 1.3 full handshake, local loopback | about 2.6 ms |
| TLS transfer of 8 MiB, OpenSSL available | about 190 MB/s |
| TLS transfer of 8 MiB, pure beskid | 70–130 MB/s |
| QUIC handshake, local loopback | about 9 ms |
| QUIC transfer of 2 MiB | about 2.6 MB/s |

TLS is in reasonable shape. QUIC transfer is slow and the reason is known: the stack moves data in small writes because of runtime limits that are still being worked on. If throughput over QUIC matters to you today, use HTTP/2.

## Before you upgrade

- **Rebuild your runtime kit.** 0.5.3 adds a runtime trap code, so a kit built by 0.5.2 does not match the 0.5.3 compiler. `beskid runtime-kit build-native-host` builds a matching one. The installers ship a matching kit already.
- **The new Corelib needs 0.5.3.** It relies on the compiler changes above and does not compile with 0.5.2.
- **Expect some protocol limits.** HTTP/2 and HTTP/3 message bodies are buffered in memory, up to 128 KiB and 64 KiB by default. The `Web` server handles one connection at a time unless you start one fiber per connection. TLS has no session resumption or 0-RTT, and the TLS server uses P-256 certificates only.
- **The OpenSSL provider is Linux-only for now.** macOS and Windows use the pure beskid implementation.

## Install or upgrade

On macOS, use the Homebrew tap:

```sh
brew tap cyber-nomad-collective/beskid https://github.com/Cyber-Nomad-Collective/beskid_homebrew.git
brew upgrade cyber-nomad-collective/beskid/beskid
```

On Windows, download the [0.5.3 setup executable](https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/download/cli-v0.5.3/beskid-0.5.3-windows-amd64.exe). On Linux, download the [AMD64 DEB](https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/download/cli-v0.5.3/beskid-0.5.3-amd64.deb). The [versioned release](https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/tag/cli-v0.5.3) also has the Windows MSI and the macOS DMG, and the [native bundles](https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/tag/v0.5.3) carry a complete installed prefix.

`beskid --version` should print `0.5.3`. The [install guide](/docs/getting-started/install/) covers the platform compilers and linkers that native builds need.

Packaging notes: the Windows setup is published under an owner-approved waiver for its installer tests, and the macOS DMG is unsigned and not notarized, so Homebrew remains the recommended macOS route.
