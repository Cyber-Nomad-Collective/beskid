---
title: "Operators"
description: Arithmetic, comparison, equality and identity, logic, bit operators, the conditional expression and the precedence order.
tableOfContents: true
---

## Arithmetic

`+` `-` `*` `/` `%` work on numbers of the same type. Integer division truncates, and `%` is the remainder. Unary `-` negates.

```beskid
use Core.Output;

i32 Main()
{
    i64 apples = 17;
    i64 people = 5;
    i64 each = apples / people;
    i64 left = apples % people;
    Output.WriteLine("${each} each, ${left} left over");
    return 0;
}
```

This prints `3 each, 2 left over`. Mixing `i32` and `i64` in one expression is a type mismatch, not a widening.

## Comparison and equality

`<` `<=` `>` `>=` compare numbers. `==` and `!=` test equality: primitives and strings compare by **value**, other types by **identity**. `===` and `!==` are the explicit identity forms.

```beskid
bool Same(string a, string b)
{
    return a == b;
}
```

Compare like with like. `count == "3"` is a type mismatch, and that is the language trying to help.

## Logic

`&&` and `||` combine booleans and stop at the first operand that decides the result. `!` negates. There are no `and`, `or` or `not` words.

```beskid
bool InRange(i64 value, i64 low, i64 high)
{
    return value >= low && value <= high;
}
```

## Bits

`&` `|` `<<` `>>` work on integers. Mind the precedence: `&` and `|` bind **looser** than `==`, so `flags & mask == 0` means `flags & (mask == 0)`. Parenthesise: `(flags & mask) == 0`.

## The conditional expression

`condition ? a : b` evaluates to `a` when the condition is true and `b` otherwise. It is an expression, so it can be returned, assigned or passed.

```beskid
string Plural(i64 count)
{
    return (count == 1) ? "item" : "items";
}

i64 Sign(i64 n)
{
    return (n < 0) ? -1 : (n == 0) ? 0 : 1;
}
```

It is right-associative, so `a ? b : c ? d : e` reads as `a ? b : (c ? d : e)`, which is what `Sign` uses. Both branches must have the same type. Use `if` when a branch has statements; use `? :` when each branch is a single value.

The postfix `?` of [error propagation](/book/09-contracts-effects-and-polite-threats/errors-and-results/) binds first: in `Half(n)? > 10 ? 1 : 0` the compiler reads `((Half(n)?) > 10) ? 1 : 0`.

## Precedence

From the loosest to the tightest:

| Level | Operators |
| --- | --- |
| Assignment | `=` `+=` `-=` `*=` `/=` `%=` |
| Conditional | `? :` |
| Logical or | `\|\|` |
| Logical and | `&&` |
| Bitwise or | `\|` |
| Bitwise and | `&` |
| Equality | `==` `!=` `===` `!==` |
| Comparison | `<` `<=` `>` `>=` |
| Shift | `<<` `>>` |
| Additive | `+` `-` |
| Multiplicative | `*` `/` `%` |
| Prefix | `-` `!` |
| Postfix | call `()`, member `.`, subscript `[]`, `?` |

When in doubt, add parentheses. A reader never complains about a pair too many.

## Next

[Assignment and loops](/book/03a-the-everyday-language/assignment-and-loops/)
