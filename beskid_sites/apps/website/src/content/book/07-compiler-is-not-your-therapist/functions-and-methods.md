---
title: "Functions and methods"
description: Free functions, methods on types, conformance lists, lambdas, and the return-type-first signature.
tableOfContents: true
---

## Functions

```beskid
pub Result<Invoice, string> LoadInvoice(i64 id) {
    if id <= 0 {
        return Result::Error("invalid id ${id}");
    }
    return Result::Ok(Invoice { id: id, customer: "ACME", totalCents: 0 });
}
```

Return type, name, parameters, body. The signature is fully explicit; there is no inferring a function's return type from its body. Parameters are `Type name`, with `mut` in front when the body reassigns the parameter. `unit` is the return type for functions that return nothing, and `never` for functions that do not return at all.

A program starts at `unit Main()` in the target's entry file. Command-line arguments come from `Core.Args`, not from a `string[] args` parameter, so `Main` has the same shape everywhere.

## Methods

Methods go inside the type, after the fields. Inside a method body the receiver is `this`, and fields are also in scope by their bare names, so `this.value` and `value` mean the same thing. The corelib uses both; `this.` reads better when a parameter and a field share a name.

```beskid
pub type Counter {
    i64 value,

    pub i64 Current() => this.value;

    pub Counter Bump() {
        return Counter { value: this.value + 1 };
    }
}
```

Expression-bodied methods use `=>`; anything longer gets a block. Records are values, so `Bump` returns a new `Counter` rather than mutating in place. Calls are `counter.Bump()`.

The corelib also uses a second style for types whose operations are mostly about a handle: free functions with the receiver as an explicit first parameter, called through the module.

```beskid
pub type WaitGroup {
    i64 handle,
}

pub unit Add(WaitGroup self, i64 delta) {
    __wait_group_add(self.handle, delta);
}
```

That is `WaitGroup.Add(wg, 1)` at the call site. Both styles are ordinary and you will read both in the standard library. Inline methods are the default for anything with behavior; the free-function style is what you reach for when a type is a thin wrapper and the operations belong to a module more than to a value.

## Contracts on a type

A type lists the contracts it satisfies after its name, and the compiler checks every required member:

```beskid
pub type TcpStream: Stream, Reader, Writer, Closer, Disposable {
    word handle,

    pub Result<i64, IoError> Read(u8[] destination, i64 offset, i64 count) { ... }
    pub Result<i64, IoError> Write(u8[] source, i64 offset, i64 count) { ... }
    pub Result<unit, IoError> Close() { ... }
    pub Result<unit, DisposeError> Dispose() { ... }
}
```

Miss `Dispose` and you get E1601 naming the contract and the member. Get its signature wrong and you get a diagnostic naming the mismatch. There is no runtime check, no vtable, and no "this class does not implement the interface" exception at startup. An `impl TcpStream : Disposable { ... }` block does the same thing from another file, and `extend type TcpStream { ... }` adds methods without a contract. Chapter 09 goes through the contract system properly.

## Calls and generics

Call syntax is `Function(args)`, `Module.Function(args)`, `value.Method(args)`. Explicit type arguments go between the name and the parentheses when inference has nothing to work with, which is mostly when a generic function's type parameter does not appear in any argument:

```beskid
Result<i64, string> r = Results.Success<i64, string>(42_i64);
Option<i64> none = Optional.Empty<i64>();
```

## Lambdas

```beskid
(i64, i64) => bool less = (a, b) => a < b;
```

`params => expression` or `params => { block }`. Parameter types can be written or inferred from the function type the lambda is being assigned or passed to. Lambdas capture their environment; when that environment crosses a `spawn` the compiler checks the capture, and chapter 11 explains what it is checking for.

## The `?` operator

```beskid
Result<Invoice, string> Process(i64 id) {
    Invoice invoice = LoadInvoice(id)?;
    return Result::Ok(invoice);
}
```

`?` on a `Result` unwraps `Ok` and returns `Error` from the enclosing function. It only works when the enclosing function's return type can carry that error, and the diagnostic when it cannot (E1222) says so. Chapter 09 covers error handling in full.

Signatures are in the standard's [surface syntax](/platform-spec/language-meta/surface-syntax/lexical-and-syntax/); dispatch rules are in [method dispatch](/platform-spec/language-meta/type-system/method-dispatch/).
