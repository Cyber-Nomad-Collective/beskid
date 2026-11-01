---
title: "Types, structs and enums"
description: Declare a type with fields and methods, build values with struct literals, model alternatives with enum and match, and use arrays and constants.
tableOfContents: true
---

## A `type` with fields

A `type` declares named fields, each with its type and a closing semicolon. Methods follow the fields.

```beskid
pub type Point
{
    pub i32 x;
    pub i32 y;

    pub i32 Sum()
    {
        return this.x + this.y;
    }

    pub Point Moved(i32 dx, i32 dy)
    {
        return Point
        {
            x: this.x + dx,
            y: this.y + dy,
        };
    }
}
```

A field is private to its file unless it is `pub` (see [Visibility basics](/book/04-where-does-this-file-go/visibility-basics/)). Inside a method, `this` is the value the method was called on.

A short method can use an expression body:

```beskid
pub type Size
{
    pub i32 width;
    pub i32 height;

    pub i32 Area() => this.width * this.height;
}
```

## Struct literals

A struct literal names the type and gives every field a value, separated by commas, as `name: value`.

```beskid
use Core.Output;

i32 Main()
{
    Point start = Point
    {
        x: 1,
        y: 2,
    };
    Point end = start.Moved(10, 20);
    Output.WriteLine("${end.x},${end.y} sum ${end.Sum()}");
    return 0;
}
```

(The program needs the `Point` declaration above in the same file.) Leaving out a field is an error, and a literal cannot be written in a condition position without being built first.

A method that changes its receiver takes `mut this`:

```beskid
pub type Counter
{
    pub i64 count;

    pub unit Increment(mut this)
    {
        this.count += 1;
        return;
    }
}
```

## Enums and `match`

An `enum` lists variants, separated by commas. A variant can carry values.

```beskid
pub enum Shape
{
    Dot,
    Circle(i64 radius),
    Rect(i64 width, i64 height),
}

i64 Area(Shape shape)
{
    return match (shape)
    {
        Shape::Dot => 0,
        Shape::Circle(radius) => 3 * radius * radius,
        Shape::Rect(width, height) => width * height,
    };
}
```

A `match` must cover every variant, and each arm is `pattern => expression`. A guard adds a condition: `Shape::Circle(radius) when radius > 100 => 0`. Use `_` for "anything else". `Option<T>` and `Result<T, E>` are enums of this kind, which is why [`match` is how you read them](/book/07-compiler-is-not-your-therapist/option-and-nullability/).

## Arrays

`T[]` is an array of `T`, written as a literal with square brackets and indexed from zero.

```beskid
use Core.Collections.Array;

i64 Last(i64[] values)
{
    return values[Array.Len<i64>(values) - 1];
}

i32 Main()
{
    i64[] primes = [2, 3, 5, 7];
    mut i64[] more = Array.Empty<i64>();
    Array.Append<i64>(more, 11);
    return (Last(primes) == 7) ? 0 : 1;
}
```

For a growable sequence you will usually want `List<T>` instead, see [Generic collections](/book/07a-generics-write-it-once/generic-collections/).

## Constants

`const NAME = 100;` declares a named integer constant at the top level.

```beskid
const RETRY_LIMIT = 3;

i64 Remaining(i64 attempts)
{
    return RETRY_LIMIT - attempts;
}
```

## Next

[Functions and programs](/book/03a-the-everyday-language/functions-and-main/)
