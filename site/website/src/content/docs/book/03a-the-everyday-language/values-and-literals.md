---
title: "Values and literals"
description: The primitive types, how to write their literals, strings with escapes and interpolation, and how a local is declared.
tableOfContents: true
---

## Primitive types

| Type | Meaning |
| --- | --- |
| `i8` `i16` `i32` `i64` | Signed integers of that many bits |
| `u8` `u16` `u32` `u64` | Unsigned integers |
| `f32` `f64` | Floating point |
| `bool` | `true` or `false` |
| `char` | One character |
| `string` | Text |
| `unit` | "No value": the result of a function that returns nothing |
| `never` | The type of a call that does not return |
| `word` `pointer` | Machine-word integer and raw address, used at [FFI boundaries](/book/21-ffi-and-forbidden-friendships/) |

Everyday code uses `i32` and `i64` for integers, `f64` for floats, `bool`, `string` and `unit`. There is no implicit promotion between unrelated primitives: an `i32` is not silently an `i64`. The analyzer reports an implicit numeric cast as a warning (W1203) or a mismatch as an error.

## Number literals

```beskid
unit Numbers()
{
    i32 small = 42;
    i64 big = 1_000_000;
    i64 mask = 0xFF_FF;
    u8 byte = 255_u8;
    f64 ratio = 0.75;
    f64 avogadro = 6.022e23;
    f32 half = 0.5_f32;
    return;
}
```

- Underscores group digits: `1_000_000`.
- `0x` starts hexadecimal.
- A suffix fixes the type: `_i8`, `_i16`, `_i32`, `_i64`, `_u8`, `_u16`, `_u32`, `_u64`, `_f32`, `_f64`. Without one, a literal takes the type its context asks for, as in `i64 big = 1_000_000;`.
- A float needs digits on both sides of the point: `0.75`, not `.75` or `1.`.
- A leading `-` is part of the literal.

## Booleans, unit and characters

```beskid
unit Others()
{
    bool ready = true;
    unit nothing = ();
    char letter = 'a';
    char newline = '\n';
    char heart = '\u{2665}';
    return;
}
```

`()` is the only value of type `unit`. A `char` literal uses single quotes and the same escapes as a string, plus `\'`.

## Strings

A string literal uses double quotes.

```beskid
use Core.Output;

unit Strings()
{
    string name = "Beskid";
    string tab = "column one\tcolumn two";
    string quote = "she said \"hello\"";
    string path = "C:\\temp";
    string lines = "first\nsecond";
    string price = "costs \${5}";
    Output.WriteLine(name);
    return;
}
```

| Escape | Meaning |
| --- | --- |
| `\n` `\t` `\r` | Newline, tab, carriage return |
| `\0` | The NUL character |
| `\u{...}` | A Unicode scalar value written in hexadecimal, for example `\u{1F600}` |
| `\"` `\\` | A quote, a backslash |
| `\${` | A literal `${`, so it does not start an interpolation |

Any other escape is a parse error with its own code (E0109), and a `\u{...}` that is not a valid scalar value is E0110. There are no raw strings.

## Interpolation

`${expression}` inside a string evaluates the expression and inserts its text. Any expression works, including calls and arithmetic.

```beskid
use Core.Output;

unit Report(string name, i64 count)
{
    Output.WriteLine("${name} has ${count} items, ${count * 2} next week");
    return;
}
```

Strings compare with `==` by value. To build text, use interpolation; to take it apart, see the `Core.String` module in [Corelib](/book/16-corelib-batteries-with-opinions/).

## Declaring a local

There are two spellings, and they mean the same thing.

```beskid
unit Locals()
{
    i64 count = 10;
    let label = "items";
    mut i64 retries = 0;
    let mut total = 0;
    retries = 3;
    total = 4;
    return;
}
```

| Form | Meaning |
| --- | --- |
| `T name = value;` | A local with a written type |
| `let name = value;` | The type is inferred from the value |
| `mut T name = value;` or `let mut name = value;` | A local that can be assigned again |
| `T name;` | Declared without a value (typed form only) |

Locals are **immutable by default**. Assigning to one without `mut` is E1214, "cannot assign to immutable binding". The remedy is to add `mut` where the local is declared, not to shrug and rename the variable.

A typed declaration checks the value against the type. An inferred one takes the type from the value and fails if it is ambiguous. Prefer the typed form in function signatures and for the first assignment of anything that is not obvious.

## Next

[Operators](/book/03a-the-everyday-language/operators/)
