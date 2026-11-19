---
title: "Functions and programs"
description: Declare functions with the return type first, return values and unit, write Main and read arguments, and comment your code.
tableOfContents: true
---

## Declaring a function

The return type comes first, then the name, then the parameters. Each parameter has a type and a name.

```beskid
i64 Add(i64 a, i64 b)
{
    return a + b;
}

bool IsEven(i64 n)
{
    return n % 2 == 0;
}
```

A function that produces nothing returns `unit` and ends with a bare `return;`:

```beskid
use Core.Output;

unit Greet(string name)
{
    Output.WriteLine("hello, ${name}");
    return;
}
```

Names are PascalCase for functions and types and camelCase for locals and parameters (see [Names and style](/book/19-public-api-that-survives-review/naming-and-style/)). Functions can be called before their declaration in the same file. A parameter can be `mut` when the function assigns to it; the collections chapter shows why `mut List<T>` shares the caller's list.

Functions can be passed around as values, and a lambda is `x => x + 1`; [chapter 07](/book/07-compiler-is-not-your-therapist/functions-and-methods/) covers function values and closures.

## `Main`

An application has one entry point called `Main`. It returns `i32`, the process exit code, or `unit` when the exit code does not matter.

```beskid
use Core.Args;
use Core.Collections.Array;
use Core.Output;

i32 Main()
{
    string[] all = Args.All();
    if (Array.Len<string>(all) < 2)
    {
        Output.WriteLine("usage: program <name>");
        return 1;
    }
    Greet(all[1]);
    return 0;
}
```

(With `Greet` from above in the same file.) `Args.All()` returns the program name followed by the arguments you passed. An exit code of `0` means success; anything else tells the shell it did not.

The project manifest decides which file holds the entry point, see [targets and outputs](/book/03-project-proj-or-it-didnt-happen/targets-and-outputs/).

## Tests next to the code

A `test` item has a PascalCase name and a body of statements:

```beskid
use Testing.Assert;

test AddAddsTwoNumbers
{
    Assert.Equal(Add(2, 3), 5, "two plus three");
}
```

[Chapter 08](/book/08-green-tests-red-production/) covers running them.

## Comments

```beskid
// A line comment.
/* A block comment
   over two lines. */
/// A documentation comment: it belongs to the item below and appears in generated docs.
i64 Twice(i64 n)
{
    return n * 2;
}
```

`////` and more slashes start an ordinary comment, not documentation. Documentation comments have their own chapter: [20](/book/20-doc-comments-that-are-not-lies/).

## Where to go next

- [Types and generics](/book/07-compiler-is-not-your-therapist/types-and-generics/) and [Generics](/book/07a-generics-write-it-once/) once you want one function for many types.
- [Where does this file even go?](/book/04-where-does-this-file-go/) for modules, `use` and `pub`.
- [Contracts](/book/09-contracts-effects-and-polite-threats/contracts-in-source/) for interfaces.

## Next chapter

[04. Where does this file even go?](/book/04-where-does-this-file-go/)
