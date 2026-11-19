---
title: "Type parameters"
description: Declare T on functions, types, enums and methods, and write the explicit form of a generic call.
tableOfContents: true
---

A type parameter is a name in angle brackets after the name of a function, a type or an enum. Inside the declaration it stands for one type. The convention is PascalCase: `T`, `TKey`, `TValue`, `TIn`, `TOut`. The analyzer warns about anything else (W1635, "generic type parameter `{name}` should use PascalCase").

## Generic functions

```beskid
T Identity<T>(T value)
{
    return value;
}

T First<T>(T[] values)
{
    return values[0];
}
```

The return type comes first, as in every Beskid function. `T` appears in the parameter list and in the return type, so the compiler knows that the result has the same type as the argument. A function can have several parameters: `TOut Convert<TIn, TOut>(TIn value, TOut sample)`.

Write the type arguments explicitly when you want to, and leave them out when the compiler can work them out (see [Inference at call sites](/book/07a-generics-write-it-once/inference-at-call-sites/)).

```beskid
use Core.Output;

i32 Main()
{
    string name = Identity<string>("beskid");
    i64 size = 3;
    i64 same = Identity(size);
    Output.WriteLine("${name} ${same}");
    return 0;
}
```

## Generic types

A `type` declares its parameters after its name. The fields come first, each ending with a semicolon, and the methods follow.

```beskid
pub type Pair<A, B>
{
    A first;
    B second;

    pub A First()
    {
        return this.first;
    }

    pub B Second()
    {
        return this.second;
    }

    pub Pair<B, A> Swap()
    {
        return Pair<B, A>
        {
            first: this.second,
            second: this.first,
        };
    }
}
```

`Pair<string, i64>` and `Pair<i64, string>` are different types. `Swap` shows both facts: it returns a `Pair<B, A>`, and the struct literal names the arguments it builds.

Using the type:

```beskid
use Core.Output;

i32 Main()
{
    Pair<string, i64> entry = Pair<string, i64>
    {
        first: "milk",
        second: 3,
    };
    Pair<i64, string> flipped = entry.Swap();
    Output.WriteLine("${entry.First()} ${flipped.First()}");
    return 0;
}
```

A type used without its arguments is an error (E1203, "missing type arguments for generic type"), and a type used with the wrong number of arguments is a different one (E1204). Both are in [Common errors](/book/07a-generics-write-it-once/common-errors/).

## Generic enums

Enums take parameters the same way. `Option<T>` and `Result<TValue, TError>` in Corelib are ordinary generic enums, and you can write your own.

```beskid
pub enum Either<L, R>
{
    Left(L value),
    Right(R value),
}

string Describe(Either<string, i64> value)
{
    return match (value)
    {
        Either::Left(text) => text,
        Either::Right(number) => "number ${number}",
    };
}
```

A constructor such as `Either::Left("milk")` fixes `L`, but nothing in it fixes `R`. The declared type of the variable, parameter or return value supplies the rest:

```text
Either<string, i64> reply = Either::Left("milk");
```

## Methods with their own parameters

A method can declare parameters of its own in addition to the ones of its type. The grammar puts them after the method name, before the parameter list, the same place as on a function. A call names them with the same syntax as a function call: `receiver.Name<T>(...)`, or `Bag.Empty<T>()` when the callee is a function of the unit that the type lives in.

## What the compiler does with them

The compiler checks the generic body once, with `T` treated as an unknown type that supports only what its bounds allow. At each call it then builds a **specialized copy** of the function for the type arguments of that call. `Identity<string>` and `Identity<i64>` are two compiled functions. Values keep their real types at run time, so there is no boxing and no type tag to inspect. The price is the usual one: more distinct instantiations means more compiled code.

## Where the declaration may appear

| Declaration | Parameters after the name | `where` clause |
| --- | --- | --- |
| Function | yes | yes, before the body |
| Method | yes | yes, before the body |
| `type` | yes | no |
| `enum` | yes | no |
| `contract` | yes | no |
| `impl` block | yes, directly after `impl` | yes, before the body |

Corelib uses a generic contract for iteration (`contract Iterator<T>`), and `impl<T> ... where ...` blocks for adapters. For ordinary programs you will write generic functions, types and enums, and bound the functions.

## Next

[Where bounds](/book/07a-generics-write-it-once/where-bounds/)
