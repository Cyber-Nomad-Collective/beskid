---
title: "Contracts in source"
description: Declare structural contracts, implement them on types, and embed requirements without inheritance theatre.
tableOfContents: true
---

A Beskid **`contract`** is a **structural interface**: required members, optional embeddings, checked at compile time when a type lists conformances.

## Declaration

A contract lists method signatures. Each ends with a semicolon, and none has a body or `pub`.

```beskid
contract Closer
{
    unit Close();
}

type Logger : Closer
{
    pub unit Close()
    {
        return;
    }
}
```

Normative detail: [Contracts](/docs/standard/capabilities/language-meta--contracts-and-effects--contracts/).

## Conformance lists

Types declare **`type Name : I, J { ... }`**. The compiler checks every required member (**E1601–E1607**). Conflicting embeddings from two contracts **must** error: no C#-style diamond denial as a lifestyle.

## Embeddings

A contract embeds another by naming it on a line of its body. A contract has no `: Base` list in its header; only types and `impl` blocks have conformance lists.

```beskid
contract Reader
{
    i64 Read();
}

contract Writer
{
    unit Write(i64 value);
}

contract Channel
{
    Reader;
    Writer;
    unit Close();
}

type Pipe : Channel
{
    i64 last;

    pub i64 Read()
    {
        return this.last;
    }

    pub unit Write(i64 value)
    {
        this.last = value;
        return;
    }

    pub unit Close()
    {
        return;
    }
}
```

Embedding flattens requirements; implementers satisfy the expanded surface once.

The corelib byte-stream contracts show the pattern. `Stream` lists the read, write and close members, and `TcpStream` in the network package conforms to it together with the single-purpose contracts.

```mermaid
classDiagram
  accTitle: Core.IO contracts and a conforming type
  accDescr: The Reader, Writer, Closer and Disposable contracts each declare one operation, Stream declares read, write and close, and TcpStream lists all of them as conformances.
  class Reader {
    <<contract>>
    Read(destination, offset, count) Result
  }
  class Writer {
    <<contract>>
    Write(source, offset, count) Result
  }
  class Closer {
    <<contract>>
    Close() Result
  }
  class Stream {
    <<contract>>
    Read(destination, offset, count) Result
    Write(source, offset, count) Result
    Close() Result
  }
  class Disposable {
    <<contract>>
    Dispose() Result
  }
  class TcpStream {
    word handle
  }
  TcpStream ..|> Stream
  TcpStream ..|> Reader
  TcpStream ..|> Writer
  TcpStream ..|> Closer
  TcpStream ..|> Disposable
```

**Text equivalent:** `Reader`, `Writer`, `Closer` and `Disposable` are one-operation contracts. `Stream` declares read, write and close. `TcpStream` lists `Stream`, `Reader`, `Writer`, `Closer` and `Disposable` in its conformance list.

## Not Mod SDK contracts

| Surface | Purpose |
| --- | --- |
| `contract Foo { ... }` in user code | Type conformance, static dispatch |
| `Beskid.Compiler.*` mod contracts | Compile-time plugins ([Compiler Mod SDK](/docs/standard/capabilities/language-meta--metaprogramming--compiler-mod-sdk/)) |

## Contracts vs classes

Contracts describe **capabilities**, not inheritance trees. Prefer small contracts composed with embeddings over one "god interface" copied from enterprise slides.

## Next

[Effects and purity](/book/09-contracts-effects-and-polite-threats/effects-and-purity/)
