---
title: "Inference at call sites"
description: When the compiler works out the type arguments of a call, when you must write them, and how conflicting arguments are reported.
tableOfContents: true
---

Writing `Identity<string>("beskid")` every time would be correct and tedious. The compiler infers the type arguments from the values you pass, as long as the answer is unique.

## Inferred from arguments

```beskid
T Identity<T>(T value)
{
    return value;
}

unit Demo()
{
    string text = Identity("beskid");
    i64 count = 3;
    i64 again = Identity(count);
    let flag = Identity(true);
    return;
}
```

For each parameter that mentions `T`, the compiler looks at the type of the matching argument. When the arguments agree, `T` is that type. [`let` inference](/docs/standard/capabilities/language-meta--type-system--type-inference/) works on the result in the usual way, so `let flag` is a `bool`.

An integer literal adapts to the type that another argument already fixed. This is why `Assert.Equal(items.Count(), 2, "two items")` works: `Count()` is an `i64`, so `T` is `i64`, and `2` is read as an `i64`. A literal alone leaves the integer type open. When nothing else decides, write the suffix (`7_i64`) or the type argument (`Identity<i64>(7)`).

## Bulk parameters

A `bulk T[]` parameter packs the trailing arguments of a call into an array, and `T` is inferred from them:

```beskid
T First<T>(bulk T[] values)
{
    return values[0];
}

unit Demo()
{
    string head = First("a", "b", "c");
    i64 explicit = First<i64>(4, 5, 6);
    return;
}
```

Corelib uses this for constructors: `List.Of<string>("a", "b")` and `Set.Of<i64>(1, 2, 3)`.

## When nothing fixes the parameter

Inference needs a value to look at. If no argument mentions the type parameter, there is nothing to infer from, and the compiler stops with E1203:

```beskid
T[] NoValues<T>()
{
    return [];
}

unit Demo()
{
    NoValues();
    return;
}
```

```text
cannot infer type parameter `T` of this call
```

The help line shows the fix, `NoValues<i64>()`. This is why Corelib spells `Array.Empty<i64>()` and `List.New<string>()` with their arguments: the call has no value to infer from.

The same rule applies to enum constructors. `Option::None` carries no value, so its `T` has to come from context: a declared variable type, a parameter type, or a return type.

```beskid
use Core.Optional.Option;

unit Demo()
{
    Option<i64> missing = Option::None;
    return;
}
```

## When arguments disagree

Inference must find one answer. If two arguments push `T` in different directions, the call is rejected at the call (E1229):

```beskid
use Testing.Assert;

unit Check(i64 count)
{
    Assert.Equal(count, "three", "count should read three");
    return;
}
```

```text
generic parameter `T` cannot be both `i64` and `string`
```

`Assert.Equal<T>(T actual, T expected, string because)` has one `T` for both values. The message names the two types that collided, and the help says that an earlier argument fixed `T` and that you should use matching types or an explicit conversion. Nothing is widened for you: there is no implicit promotion between unrelated primitives.

## Writing the arguments anyway

Explicit arguments are never wrong, and they are the right call in three cases:

| Case | Example |
| --- | --- |
| No argument carries the type | `Array.Empty<string>()` |
| An integer literal could be several types | `Identity<i64>(7)` |
| You want the reader to see the instantiation | `Map.New<string, i64>()` |

Do not write them to silence a warning that you have not read yet.

## Recursion and forwarding

A generic function that calls itself may need explicit arguments to break an ambiguity, as the Standard notes for generic recursion. If a call is ambiguous, write the arguments or give the value a typed local.

## Next

[Generic collections](/book/07a-generics-write-it-once/generic-collections/)
