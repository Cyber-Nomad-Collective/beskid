---
title: "Common errors"
description: The generic diagnostics you will meet, what each message says, and the one-line fix.
tableOfContents: true
---

Generic errors look mysterious until you notice that there are only a handful of them. Each has a stable code, and each message names the parameter and the types involved. The wording below is the 0.6.7 text; when the CLI shows a longer report, the code and the first line are the same.

| Code | Message | Cause | Fix |
| --- | --- | --- | --- |
| E1203 | `missing type arguments for generic type` | A generic type was written without its arguments | Write them: `List<string>` |
| E1203 | `cannot infer type parameter` followed by the parameter name | No argument fixes the parameter | Write the arguments at the call: `NoValues<i64>()` |
| E1204 | `generic argument mismatch: expected N, got M` | Wrong number of type arguments | Match the declaration's arity |
| E1229 | `generic parameter T cannot be both A and B` | Two arguments fix one parameter to different types | Make the arguments the same type, or convert one |
| E1250 | `no where bound of type parameter T declares a method M` | The body calls a method that no bound declares | Add `where T: Contract` for a contract that declares `M` |
| E1610 | `generic bound not satisfied: X does not conform to C` | The type argument does not conform to the bound | Add `: C` to the type and implement its methods, or pass another type |
| W1635 | `generic type parameter T should use PascalCase` | A type parameter is named in another case | Rename it |

## E1203: missing arguments

On a type:

```beskid
pub type Pair<A, B>
{
    A first;
    B second;
}

unit Demo(Pair pair)
{
    return;
}
```

```text
missing type arguments for generic type
```

`Pair` is not a type, it is a recipe for types. Write `Pair<string, i64>`. On a call, the message names the parameter that nothing fixes, and the fix is the explicit form shown in [Inference at call sites](/book/07a-generics-write-it-once/inference-at-call-sites/).

## E1204: wrong arity

```beskid
pub type Pair<A, B>
{
    A first;
    B second;
}

unit Demo(Pair<i64> pair)
{
    return;
}
```

```text
generic argument mismatch: expected 2, got 1
```

The help says how many arguments the type expects. Count the parameters in the declaration, not in your head.

## E1229: one parameter, two types

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

The first argument fixed `T` to `i64`, and the second disagrees. Compare like with like. If you meant to compare a count to a number, use a number.

## E1250: the body asks too much of T

```beskid
string Greet<T>(T value)
{
    return value.Name();
}
```

```text
no `where` bound of type parameter `T` declares a method `Name`
```

The body can only call what a bound promises. Add the contract:

```beskid
contract Named
{
    string Name();
}

string Greet<T>(T value) where T: Named
{
    return value.Name();
}
```

## E1610: the argument does not conform

```beskid
contract Named
{
    string Name();
}

type Cat { }

string Greet<T>(T value) where T: Named
{
    return value.Name();
}

unit Demo()
{
    Greet(Cat { });
    return;
}
```

```text
generic bound not satisfied: `Cat` does not conform to `Named`
```

Either give `Cat` the contract and the method (`type Cat : Named { pub string Name() { ... } }`), or pass a type that already conforms. The same code is reported when a generic function forwards an unbounded parameter to a bounded one, so check the bound chain from the call outward.

## Reading a long report

A generic mistake usually surfaces at the **call**, not at the declaration. The declaration is checked once against its bounds, and the calls are checked against the declaration. When a message names a type you did not write, it is the type argument that was inferred. Replace the call with its explicit form (`Name<T>(...)`) and the report will point at the argument that disagrees. See [Read a diagnostic](/book/07-compiler-is-not-your-therapist/read-a-diagnostic/) for the general method.

## Where to go next

- [Contracts in source](/book/09-contracts-effects-and-polite-threats/contracts-in-source/) covers the contracts that bounds name.
- [Option and nullability](/book/07-compiler-is-not-your-therapist/option-and-nullability/) covers the `Option<T>` you meet in every collection.
- The Standard: [Types](/docs/standard/capabilities/language-meta--type-system--types/), [Type inference](/docs/standard/capabilities/language-meta--type-system--type-inference/), [Method dispatch](/docs/standard/capabilities/language-meta--type-system--method-dispatch/).

## Next chapter

[08. Green tests, red production](/book/08-green-tests-red-production/)
