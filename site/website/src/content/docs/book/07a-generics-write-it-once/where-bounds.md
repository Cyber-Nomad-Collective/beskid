---
title: "Where bounds"
description: Constrain a type parameter with a contract so that the generic body may call the contract's methods.
tableOfContents: true
---

An unconstrained `T` is a stranger. The body can store it, return it, pass it on, put it in an array and compare it with `==` (primitives and strings compare by value, other types by identity). It cannot call a method on it, because the compiler does not know that `T` has one.

A **bound** is how you introduce the stranger. It says that `T` conforms to a [contract](/book/09-contracts-effects-and-polite-threats/contracts-in-source/), and then the methods of that contract are available on `T`.

## Declaring a bound

```beskid
contract Named
{
    string Name();
}

type Dog : Named
{
    string name;

    pub string Name()
    {
        return this.name;
    }
}

string Greet<T>(T value) where T: Named
{
    return "Hello, ${value.Name()}";
}
```

The `where` clause sits between the parameter list and the body. Its entries read `Parameter: Contract`. The call can leave the type argument out, because `Dog` is fixed by the argument:

```beskid
use Core.Output;

i32 Main()
{
    Dog dog = Dog
    {
        name: "Burek",
    };
    Output.WriteLine(Greet(dog));
    return 0;
}
```

## Several bounds

A parameter that must satisfy two contracts is listed twice, separated by a comma. There is no `+` and no `&`.

```beskid
contract Sized
{
    i64 Size();
}

contract Scaled
{
    i64 Scale(i64 factor);
}

i64 Both<T>(T value) where T: Sized, T: Scaled
{
    return value.Size() + value.Scale(10);
}
```

Different parameters are bounded in the same list: `where K: Hashed, V: Named`.

## What a call checks

At every call the compiler checks that the type argument conforms to each bound. A type conforms when it lists the contract in its header (`type Dog : Named`) and implements every method. The check happens whether you wrote the argument or the compiler inferred it. A failure is E1610:

```text
generic bound not satisfied: `Cat` does not conform to `Named`
```

The help line says what to do: make `Cat` conform to `Named`, or pass a conforming type.

## Dispatch follows the instantiation

The body of `Both` calls `value.Size()` once. The call goes to the `Size` of whichever type `T` is at that call. A `Box` and a `Bag` that both conform to `Sized` get two specialized copies of `Both`, each calling its own method. This is compile-time dispatch, so no indirect call is hiding in there.

## Bounds are not inherited by accident

A generic function that forwards its parameter to a bounded function has to carry the bound too:

```beskid
i64 Consume<T>(T value) where T: Sized
{
    return value.Size();
}

i64 Forward<U>(U value) where U: Sized
{
    return Consume(value);
}
```

If `Forward` omitted the `where`, the compiler would report E1610 for the inner call, because `U` is not known to be `Sized`. Calling a method on a parameter with no bound that declares it is E1250:

```text
no `where` bound of type parameter `T` declares a method `Name`
```

The help line is the fix: add a `where T: Contract` bound whose contract declares `Name`.

## Bounds and `impl` blocks

An `impl` block takes its own parameters and bounds in the same syntax, for example `impl<R> Adapter<R> : Decoder where R: Reader { ... }`. Corelib uses this to build adapters that work for any reader. Application code rarely needs it. The rule is the same: the bound lists the contracts that the body is allowed to call.

## Next

[Inference at call sites](/book/07a-generics-write-it-once/inference-at-call-sites/)
