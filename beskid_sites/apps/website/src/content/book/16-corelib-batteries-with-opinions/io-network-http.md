---
title: "IO, network, and HTTP"
description: "Core.IO contracts, the Network package over TCP, UDP, and DNS, and a bounded HTTP/1.1 client and server, all on one stream vocabulary."
tableOfContents: true
---

Three packages that arrived together because each one needed the previous.

## `Core.IO`

```beskid
pub contract Reader { Result<i64, IoError> Read(u8[] destination, i64 offset, i64 count); }
pub contract Writer { Result<i64, IoError> Write(u8[] source, i64 offset, i64 count); }
pub contract Closer { Result<unit, IoError> Close(); }
pub contract Stream { /* Read, Write, Close */ }
```

Four contracts and one error enum. `Read` and `Write` are partial: they may move fewer bytes than asked and return how many. A successful zero-count read on a non-empty request is end of file. Ranges are validated before anything happens, so an `offset` past the end is `IoError::InvalidRange` rather than a runtime trap.

On top of the contracts, `Core.IO` ships the loops everyone would otherwise write badly:

```beskid
IO.ReadExact(reader, buffer, 0_i64, 1024_i64);   // Result<unit, IoError>, fails on early EOF
IO.WriteAll(writer, bytes, 0_i64, Slice.Len(bytes));
```

`ReadExact` retries partial reads until the count is satisfied or the reader reports EOF or no progress. `WriteAll` does the same for writes. An `IoError` carries a `TransferFailure` naming the cause: `Closed`, `Unspecified`, and the rest of a closed enum. There is no errno leaking through as an integer.

Anything that is a `Stream` and a `Disposable` works with the scoped `use` statement from chapter 07, and every socket type is both.

## `Network`

```beskid
use Network.Dns;
use Network.Tcp.TcpListener;
use Network.Tcp.TcpStream;
use Network.Types;

Result<unit, NetworkError> Echo(SocketAddress address) {
    use TcpListener listener = TcpListener.Bind(address, 16_i64)?;
    use TcpStream client = listener.Accept()?;
    u8[] buffer = Slice.New(1024_i64);
    i64 got = client.Read(buffer, 0_i64, 1024_i64)?;
    IO.WriteAll(client, buffer, 0_i64, got)?;
    return Result::Ok(());
}
```

`TcpListener.Bind`, `TcpStream.Connect`, `UdpSocket.Bind`, and `Dns.Resolve` are the entry points. Addresses are values: `IpAddress::V4(127_u8, 0_u8, 0_u8, 1_u8)` and a `Port` built from two bytes, so a port of zero is a typed thing the resolver can reject with `NetworkError::InvalidAddress` before it touches a socket. `TcpStream` conforms to `Stream`, `Reader`, `Writer`, `Closer`, and `Disposable`, which is why it can be handed to `IO.WriteAll` and to a scoped `use` without adapters.

Underneath is epoll on Linux, kqueue on macOS, and IOCP on Windows, and none of that is visible. A blocked `Accept` parks the fiber; the scheduler runs something else; the completion wakes the right fiber through its owner's mailbox. The Windows path even ships detached sender cancellation so a cancelled fiber blocked in `Send` does not leak the buffer.

`NetworkError` is a closed enum: `ConnectionRefused`, `AddressInUse`, `HostNotFound`, `MessageTooLarge`, and so on. Native error values never cross the boundary. There is no raw-socket API, no multicast configuration, and no Unix-domain sockets. The package is DNS, TCP, and UDP, and it is the base that HTTP stands on.

## `Http`

```beskid
use Http.Client;
use Http.Server;
use Http.Types;

Result<unit, HttpError> ServeOnce(HttpServer server) {
    TcpStream stream = server.Accept()?;
    Request request = server.Receive(stream, Types.DefaultLimits())?;
    Response response = Types.EmptyResponse(200_i64, "OK");
    server.Respond(stream, response, Types.DefaultLimits())?;
    return server.Close();
}

Result<Response, HttpError> Fetch(TcpStream stream) {
    mut Header[] headers = Array.Empty<Header>();
    Array.Append<Header>(headers, Header { name: "Host", value: "example.test" });
    Request request = Request { method: "GET", target: "/", headers: headers, body: [] };
    return Client.Send(stream, request, Types.DefaultLimits());
}
```

HTTP/1.1, bounded, over a `TcpStream` you opened. `Server.Bind` wraps a listener; `Accept`, `Receive`, `Respond` are one exchange. `Client.Send` writes a request and reads the response. `Request` and `Response` are plain records with public fields, and `Limits` is a record of four integers that every parse honors: start line, header bytes, header count, body bytes. `DefaultLimits` is 8 KiB, 64 KiB, 128, and 16 MiB.

The codec is strict where the RFC lets implementations be sloppy and attackers count on it. A message with both `Content-Length` and `Transfer-Encoding` is rejected. A request needs exactly one `Host` header. A body over `maxBodyBytes` is an error, not a partial read that a handler forgets to check. Those are the three checks the request-smuggling literature is built on, and they are not configurable off.

What is not here: TLS, HTTP/2 and 3, WebSocket, connection pooling, proxies, compression, multipart streaming. The package is a correct HTTP/1.1 exchange over a stream. Everything above it is a later package, not a flag.

Package sources: `packages/foundation/src/Core/IO/`, `packages/network/src/Network/`, `packages/http/src/Http/`. Runtime contracts for the I/O surfaces are in [panic, IO, and syscalls](/platform-spec/execution/runtime/panic-io-and-syscalls/).
