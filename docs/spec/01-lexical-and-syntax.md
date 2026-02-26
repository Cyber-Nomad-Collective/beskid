# 01. Lexical Structure and Syntax

## Tokens and Comments
- Line comments: `// ...` (to end of line)
- Block comments: `/* ... */` (do not nest in v0.1)
- Identifiers: `[A-Za-z_][A-Za-z0-9_]*`, case-sensitive

Example:
```
// line comment
/* block comment */
let user_id = 1;
```

## Keywords (v0.1)
`type`, `enum`, `contract`, `match`, `when`, `if`, `else`, `while`, `for`, `in`, `return`, `break`, `continue`, `let`, `mut`, `mod`, `use`, `pub`, `ref`, `out`

### Keyword meanings
- `type`: product type (struct) declaration.
- `enum`: sum type (variant) declaration.
- `contract`: structural interface declaration.
- `match`: pattern matching expression.
- `when`: guard for a `match` arm.
- `if`: conditional branch.
- `else`: alternative branch for `if`.
- `while`: conditional loop.
- `for`: range-based loop.
- `in`: loop binding keyword used in `for`.
- `return`: returns from a function.
- `break`: exits a loop.
- `continue`: skips to next loop iteration.
- `let`: inferred variable binding.
- `mut`: mutable binding marker for typed bindings.
- `mod`: module declaration.
- `use`: import declaration.
- `pub`: public visibility marker.
- `ref`: read-only reference type/parameter.
- `out`: write-only output parameter.

## Literals
- Integers: `0`, `42`, `-7`
- Floats: `3.14`
- bool: `true`, `false`
- string: `"text"`
- string interpolation: `"hello ${name}"`
- char: `'a'`

Notes:
- Integers default to `i32` unless context requires otherwise.
- `char` represents a single Unicode scalar value.

### String interpolation
Use `${Expression}` inside a string literal:
```
let name = "Beskid";
let msg = "hello ${name}";
```
The `${...}` segment accepts a full expression.
Escaping:
- Use `\${` to emit a literal `${`.
- Standard escapes like `\"` still apply.

Example with expression:
```
let count = 2;
let msg = "items: ${count + 1}";
```

## Example
```
i32 main() {
    let name = "Beskid";
    i32 mut count = 0;

    if name.len() > 0 {
        count = count + 1;
    }

    return count;
}
```

## General Rules
- Statements end with `;`.
- Blocks use `{ ... }`.
- Block expressions are not values in v0.1 (simpler semantics).

Example:
```
unit greet() {
    let msg = "hi";
    println(msg);
}
```
