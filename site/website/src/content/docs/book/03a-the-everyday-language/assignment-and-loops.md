---
title: "Assignment and loops"
description: Changing values with = and the compound operators, and the if, while and for statements in the house style.
tableOfContents: true
---

## Assignment

`name = value;` replaces the value of a `mut` local, parameter or field. The compound forms apply an operator and assign the result: `a += b` means `a = a + b`.

```beskid
use Core.Output;

i32 Main()
{
    mut i64 score = 10;
    score += 5;
    score -= 3;
    score *= 2;
    score /= 4;
    score %= 4;
    Output.WriteLine("score: ${score}");
    return 0;
}
```

The five compound operators are `+=`, `-=`, `*=`, `/=` and `%=`. There is no `++` or `--`; the parser rejects them with a message that suggests `+= 1` (E0105).

An assignment to a local that is not `mut` is E1214. A field is assigned through its owner (`this.count += 1;`), and the method must take `mut this` for the change to be allowed on the receiver.

## `if`

The condition goes in parentheses. The braces are required, and in this Book the opening brace sits on its own line.

```beskid
string Grade(i64 points)
{
    if (points >= 90)
    {
        return "A";
    }
    else if (points >= 75)
    {
        return "B";
    }
    else
    {
        return "C";
    }
}
```

`if` is a statement. For a choice between two values, the conditional expression `(points >= 50) ? "pass" : "fail"` is shorter. There is no truthiness: the condition is a `bool`, not "something non-zero".

A struct literal directly in a condition position is ambiguous with the block that follows. Build the value first (`Point origin = Point { x: 0, y: 0 };`) and compare against the local.

## `while`

```beskid
i64 CountDigits(i64 value)
{
    mut i64 digits = 0;
    mut i64 rest = value;
    while (rest > 0)
    {
        rest /= 10;
        digits += 1;
    }
    return digits;
}
```

## `for`

`for name in values` visits each element of an array in order. There are no parentheses, no type and no index unless you keep one yourself.

```beskid
use Core.Output;

i32 Main()
{
    string[] names = ["Ala", "Bartek", "Celina"];
    for name in names
    {
        Output.WriteLine("hello, ${name}");
    }
    return 0;
}
```

The loop variable is a fresh immutable binding for each element.

## `break` and `continue`

`break` leaves the innermost loop and `continue` skips to its next round.

```beskid
i64 FirstNegative(i64[] values)
{
    mut i64 index = 0;
    for value in values
    {
        if (value < 0)
        {
            return index;
        }
        index += 1;
    }
    return -1;
}

i64 SumOfOdds(i64[] values)
{
    mut i64 total = 0;
    for value in values
    {
        if (value % 2 == 0)
        {
            continue;
        }
        total += value;
        if (total > 1000)
        {
            break;
        }
    }
    return total;
}
```

## `match` is the other branch

When the choice is between the variants of an enum or the two sides of an `Option`, use `match` instead of a chain of `if`. See [Types, structs and enums](/book/03a-the-everyday-language/types-structs-and-enums/) and [Control flow](/book/07-compiler-is-not-your-therapist/control-flow/).

## Next

[Types, structs and enums](/book/03a-the-everyday-language/types-structs-and-enums/)
