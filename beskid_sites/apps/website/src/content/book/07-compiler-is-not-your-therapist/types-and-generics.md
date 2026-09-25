---
title: "Types and generics"
description: Primitives, records, enums, arrays, generics, and the mutability rule that annoys people for exactly one week.
tableOfContents: true
---

Beskid types are nominal and static. A `Money` and an `i64` are different things even if they have the same bits, and the compiler is not interested in your dynamic enlightenment phase.

## Primitives

`bool`, `i32`, `i64`, `u32`, `u8`, `f64`, `char`, `string`, `unit`, `never`. Plus `pointer` and `word` for interop code, which you will not touch until chapter 21.

No `int`. Pick a width. The C# habit of `int` everywhere until an overflow in production reveals that a customer ID crossed two billion is not a habit the language wants to inherit. `i64` is the sane default for counts and IDs; `i32` is for when you are talking to something that needs 32 bits.

## Records

```beskid
pub type Invoice {
    i64 id,
    string customer,
    i64 totalCents,

    pub bool IsLarge() => this.totalCents > 100_000_00;
}
```

A `type` is a record: named fields, comma separated, followed by methods. Methods can be expression-bodied with `=>` or have a block, and reach fields through `this` or by bare name. Fields are private by default, and so is the type. `pub` on the type exports the name; `pub` on a field or method exports that member. A `pub` type with private fields is a perfectly good way to say "construct this through the function I gave you".

Construct with a struct literal: `Invoice { id: 7, customer: "ACME", totalCents: 4200 }`. Every field, every time. There are no default values and no partially initialized records, which removes an entire category of "which fields are set at this point" from your code review.

## Enums

```beskid
pub enum PaymentState {
    Pending,
    Captured(i64 amountCents),
    Failed(string reason),
}
```

Variants are bare or carry named fields. Construct with `PaymentState::Captured(4200)`, destructure with `match`. This is the type you reach for whenever C# would have reached for a base class and three subclasses, and the difference is that `match` on an enum is checked for exhaustiveness and inheritance is not.

## Arrays and function types

`T[]` is an array. `u8[]` is how bytes move through the standard library. Function types are written as arrows: `(i64, i64) => bool` is a function taking two integers and returning a boolean, and a lambda `(a, b) => a < b` fits it.

## Generics

```beskid
pub enum Result<TValue, TError> {
    Ok(TValue value),
    Error(TError error),
}

pub T UnwrapOr<T>(Option<T> value, T defaultValue) {
    return match value {
        Option::Some(v) => v,
        Option::None => defaultValue,
    };
}
```

Types, enums, contracts, and functions take type parameters in angle brackets. Call sites usually infer them; when they cannot, you write them: `Results.Success<i64, string>(42)`. A generic function can constrain a parameter to a contract with `where T: Contract`, which chapter 09 covers with the rest of the contract system.

Generics are compiled by specialization. `List<Invoice>` and `List<i64>` are two types with two layouts and no boxing, no erasure, and no runtime type token to inspect. If that sounds like C++ templates, the difference is that a constraint violation is a diagnostic at the call site, not forty lines of instantiation trace.

## `mut`

Bindings are immutable by default.

```beskid
i64 count = 0;
count = 1;            // E1214: count is not mutable

mut i64 total = 0;
total += 5;           // fine

let name = "x";       // inferred type, immutable
let mut retries = 3;  // inferred type, mutable
```

Parameters follow the same rule: `unit Bump(mut i64 n)` lets the body reassign `n`, and plain `i64 n` does not. The word `mut` is the entire ceremony. People coming from C# find this annoying for about a week, and then they notice how much easier it is to read a function when the compiler has already told them which locals can change.

Type inference is deliberately shallow. `let` infers from the initializer and no further. Function signatures are always explicit. There is no whole-program inference where changing one return type re-types half the codebase, and consequently no "why is this suddenly a `string`" bug with a root cause six files away.

The standard's [types](/platform-spec/language-meta/type-system/types/) and [enums and match](/platform-spec/language-meta/type-system/enums-and-match/) articles have the exact rules.
