---
title: "Generic collections"
description: List, Map, Set, Stack, Queue, Option and Result from Corelib, read as generic APIs.
tableOfContents: true
---

Every collection in Corelib is a generic type, so this page is mostly a reading guide. A signature such as `List<T>` tells you what the type holds; `Map<TKey, TValue>` tells you which two types you must supply. The package is `corelib_foundation`, and each type lives in a module of the same name: `Core.Collections.List`, `Core.Collections.Map`, and so on. Chapter [16](/book/16-corelib-batteries-with-opinions/) explains how Corelib reaches your project.

| Type | Holds | Create it with |
| --- | --- | --- |
| `List<T>` | Ordered, growable sequence | `List.New<T>()`, `List.Of<T>(a, b)`, `List.FromArray<T>(values)` |
| `Map<TKey, TValue>` | Key to value entries | `Map.New<TKey, TValue>()` |
| `Set<T>` | Distinct members | `Set.New<T>()`, `Set.Of<T>(a, b)` |
| `Stack<T>` | Last in, first out | `Stack.New<T>()` |
| `Queue<T>` | First in, first out | `Queue.New<T>()` |
| `Option<T>` | A value or nothing | `Option::Some(value)`, `Option::None` |
| `Result<TValue, TError>` | A value or a failure | `Result::Ok(value)`, `Result::Error(error)` |

The constructors take their type arguments explicitly because they have no value to infer from (see [Inference at call sites](/book/07a-generics-write-it-once/inference-at-call-sites/)).

## Collections change in place

A mutating method changes the collection it is called on. You do not rebind the result and you do not write `move`:

```beskid
use Core.Collections.List;
use Core.Output;

i32 Main()
{
    List<string> items = List.New<string>();
    items.Push("milk");
    items.Push("bread");
    Output.WriteLine("items: ${items.Count()}");
    return 0;
}
```

A `List` is a value. Assigning it to another name, or passing it to a parameter that is not `mut`, gives the new name its own list, so a change through one name is never visible through the other. The copy is **copy-on-write**: the two names share the storage until the first mutation through either of them, and that mutation takes its own copy first. A `mut List<T>` parameter shares the caller's list outright, which is how a helper function grows one:

```beskid
use Core.Collections.List;

unit AddDefaults(mut List<string> items)
{
    items.Push("salt");
    items.Push("pepper");
    return;
}
```

Read the doc comment of each type for its exact rules; `beskid doc` and the API pages on pckg show them.

## Reading values back

Reading can fail, and the generic return types say how. `Get` returns a `Result`, because an out-of-range index is an error with a message. `TryGet`, `First` and `Last` return an `Option`, because absence is not an error. You open both with `match`:

```beskid
use Core.Collections.List;
use Core.Optional.Option;
use Core.Output;

i32 Main()
{
    List<string> items = List.Of<string>("milk", "bread");

    match (items.TryGet(5))
    {
        Option::Some(item) => Output.WriteLine("found ${item}"),
        Option::None => Output.WriteLine("nothing at index 5"),
    };
    return 0;
}
```

For a result you care about, `Result` carries the reason:

```beskid
use Core.Collections.List;
use Core.Output;
use Core.Results;

unit Show(List<string> items, i64 index)
{
    match (items.Get(index))
    {
        Result::Ok(item) => Output.WriteLine(item),
        Result::Error(reason) => Output.WriteLine("cannot read: ${reason}"),
    };
    return;
}
```

What the mutating methods return:

| Method | Returns |
| --- | --- |
| `List.Push`, `Stack.Push`, `Queue.Enqueue`, `Map.Insert` | `unit` |
| `List.Pop`, `Stack.Pop`, `Queue.Dequeue`, `PriorityQueue.Pop` | `Option<T>` of the removed element |
| `List.Remove`, `Set.Add`, `Set.Remove`, `Map.Remove` | `bool`: whether the collection changed |
| `List.Set`, `List.Insert` | `Result<unit, CollectionError>` |
| `List.RemoveAt` | `Result<T, CollectionError>` holding the removed element |

Only `List` copies on assignment. `Stack`, `Queue`, `Set` and `Map` keep reference semantics, so a second name sees the changes.

## Maps and sets

```beskid
use Core.Collections.Map;
use Core.Collections.Set;
use Core.Output;

i32 Main()
{
    Map<string, i64> prices = Map.New<string, i64>();
    prices.Insert("milk", 3);
    prices.Insert("bread", 5);
    prices.Insert("milk", 4);

    i64 milk = prices.GetOr("milk", 0);
    Output.WriteLine("milk costs ${milk}");
    Output.WriteLine("entries: ${prices.Count()}");

    Set<string> seen = Set.New<string>();
    if (seen.Add("milk"))
    {
        Output.WriteLine("milk is new");
    }
    if (!seen.Add("milk"))
    {
        Output.WriteLine("milk was already there");
    }
    return 0;
}
```

`Insert` replaces the value of an existing key, so the map above holds two entries. `Set.Add` returns `true` when the member was new. `GetOr` takes a fallback of the value type, which makes it the short form of `TryGet` plus a `match`.

## Equality and keys

`Contains`, `IndexOf`, `Remove` and map keys compare with `==`. Primitives and strings compare by value. Other types compare by identity, so a key type of your own is found only through the same instance. Prefer primitives or strings as keys until you have a reason not to.

## Writing your own collection

Everything on this page can be written with what you already know. A generic type with an array field, a count and some methods is a collection:

```beskid
use Core.Collections.Array;
use Core.Optional.Option;

pub type Ring<T>
{
    T[] items;
    i64 count;

    pub i64 Count()
    {
        return this.count;
    }

    pub unit Add(mut this, T value)
    {
        Array.Append<T>(this.items, value);
        this.count = this.count + 1;
        return;
    }

    pub Option<T> Last()
    {
        if (this.count == 0)
        {
            return Option::None;
        }
        return Option::Some(Array.Get<T>(this.items, this.count - 1));
    }
}

pub Ring<T> NewRing<T>()
{
    return Ring<T>
    {
        items: Array.Empty<T>(),
        count: 0,
    };
}
```

The `mut this` receiver is what lets `Add` change the value in place. Notice `Array.Append<T>`, `Array.Get<T>` and `Array.Empty<T>()`: the array module is made of generic functions, and every call names its argument because the type has to come from somewhere.

## Next

[Common errors](/book/07a-generics-write-it-once/common-errors/)
