---
title: "Contracts in source"
description: Declare a contract, conform to it on the type or in an impl block, embed one in another, add generics, bounds, associated types, and This.
tableOfContents: true
---

## Declare and conform

```beskid
pub contract Writer {
    Core.Results.Result<i64, IoError> Write(u8[] source, i64 offset, i64 count);
}

pub contract Closer {
    Core.Results.Result<unit, IoError> Close();
}

pub type TcpStream: Stream, Reader, Writer, Closer, Disposable {
    word handle,

    pub Result<i64, IoError> Write(u8[] source, i64 offset, i64 count) { ... }
    pub Result<unit, IoError> Close() { ... }
    // ...
}
```

A contract is a list of method signatures. A type lists the contracts it conforms to after its name, and the compiler checks every required member is present with a matching signature. Missing one is E1601 with the contract and member named. Wrong signature is E1602. The check is structural on the members and nominal on the contract: `TcpStream` conforms to `Writer` because it said so and has `Write`, not because it happens to have a method called `Write`.

There is no runtime representation. No interface table, no `is Writer` check, no cast. A function that takes a `Writer` is specialized for each concrete type that gets passed in, the same way generics are. Chapter 14 has the lowering.

## `impl` for types you did not write

```beskid
impl Counter : Core.Disposable {
    pub Result<unit, DisposeError> Dispose() {
        return Result::Ok(());
    }
}
```

An `impl` block adds a conformance to an existing type from another file or another package. The rules are identical to listing the contract on the type; only the location differs. `extend type Counter { ... }` is the same block without a contract, for adding methods.

## Embedding

```beskid
pub contract Stream {
    Result<i64, IoError> Read(u8[] destination, i64 offset, i64 count);
    Result<i64, IoError> Write(u8[] source, i64 offset, i64 count);
    Result<unit, IoError> Close();
}
```

A contract can name another contract inside its body to embed it: `contract ReadWrite { Reader; Writer; }` flattens both requirement lists into one. An implementer satisfies the expanded surface once. Two embedded contracts that require the same member with different signatures conflict, and the compiler rejects the embedding rather than picking one. This is the diamond problem, answered with "no" instead of with a rule nobody remembers.

Keep contracts small and compose them. `Stream` is three methods. `TcpStream` conforms to five contracts and none of them is `ISocketStreamReaderWriterCloserDisposable`.

## Generics, bounds, associated types, `This`

```beskid
pub contract Iterator<T> {
    type Item;
    Option<Item> Current();
    This MoveNext();
}

pub T[] Collect<T, I>(I iterator) where I: Iterator<T> { ... }
```

Contracts take type parameters. A contract can declare an associated type with `type Item;`, and each implementer binds it with `type Item = T;` in its body. E1607 reports a missing binding.

`This` is the implementing type. Inside the contract it means "whatever conforms to me", and inside a conforming type it means that type. A fluent method that returns `This` returns the concrete type at every call site, so `it.MoveNext().MoveNext()` stays an `ArrayIterator<T>` and never decays to the contract. C# cannot express this without the curiously recurring template pattern, and nobody who has maintained `class Builder<TSelf> where TSelf : Builder<TSelf>` wants to do it again. `This` is a keyword; E1608 fires if you use it outside a contract or a conforming type.

`where I: Iterator<T>` on a generic function admits only types that conform. The check happens before specialization, so a violated bound is a diagnostic at the call site with the contract name in it, not an instantiation failure forty lines deep.

## Not the mod SDK

`Beskid.Compiler.Collector`, `Generator`, `Analyzer`, and `Rewriter` are contracts too, but they are implemented by `type: Mod` packages and run inside the compiler. Chapter 15. A user-code `contract Disposable` and a mod-SDK `contract Rewriter<TSource, TTarget>` share a keyword and nothing else.

The standard's [contracts](/platform-spec/language-meta/contracts-and-effects/contracts/) feature has the full rule set.
