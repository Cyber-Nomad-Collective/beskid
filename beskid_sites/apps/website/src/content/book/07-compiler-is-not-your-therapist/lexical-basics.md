---
title: "Lexical basics"
description: Comments, identifiers, keywords, and literals, including the parts that will surprise you coming from C#.
tableOfContents: true
---

The lexer decides whether your file is a program or performance art. Its rules are short.

## Comments

```beskid
// a comment
/* a block comment */
/// documentation for the item that follows
//// also a comment, not documentation
```

Three slashes are documentation and attach to the next declaration. Four slashes are a plain comment again, so you can draw a rule of slashes across a file without accidentally documenting whatever comes after it. Documentation comments are a compiler feature, not a convention: `beskid doc` reads them and the language server shows them on hover. Chapter 20 covers what goes inside.

## Identifiers and keywords

Identifiers are ASCII letters, digits, and underscores, not starting with a digit. The naming convention is PascalCase for types, functions, methods, and enum variants, lowerCamelCase for fields, parameters, and locals. Tests are `snake_case`. The compiler does not enforce case today, but the style rules in the standard reserve a warning band for it, so write it the way the corelib does.

The keyword list is longer than the syntax you will use in week one, because some of it belongs to host composition and mods: `type enum contract attribute impl extend This where match when if else while for in return break continue let const mut bulk mod use using pub test skip spawn clif code host registry scope startup init dispose with launch inject single transient global parent try catch`.

Two more are reserved and rejected: `async` and `await`. They are keywords so that they cannot be identifiers, and they are errors so that nobody ports a `Task<T>` mental model into a language that has fibers instead. Chapter 11.

## Literals

```beskid
i64 big     = 1_000_000;
u8  mask    = 0xFF_u8;
i32 small   = 42_i32;
f64 ratio   = 0.75;
bool flag   = true;
char letter = 'x';
string name = "beskid";
unit nothing = ();
```

Integer literals take underscores as separators and an optional type suffix: `_i32`, `_i64`, `_u32`, `_u8`. Without a suffix the literal takes the type the context asks for. Hex is `0x` prefixed. Floats need digits on both sides of the point.

Strings interpolate. `"total: ${count}"` embeds an expression, and `\${` is the escape when you want the literal characters. Escapes are `\"` and `\\` and nothing else; there is no `\n` in the grammar, because the corelib has a function for newlines and a string literal should mean what it looks like.

`()` is the unit value, the thing a `unit` function returns. It is a real value with a real type, which is why `Result<unit, Error>` works without a special case.

## Semicolons and blocks

Statements end in `;`. Blocks are braces. A `match` is an expression, so a `match` used as a statement ends with `;` after its closing brace. That is the one place people forget it.

The full lexical grammar is in the standard's [lexical and syntax](/platform-spec/language-meta/surface-syntax/lexical-and-syntax/) article. When you and the parser disagree, shrink the file to five lines and run `beskid parse tiny.bd`. The parse tree settles the argument faster than rereading the grammar.
