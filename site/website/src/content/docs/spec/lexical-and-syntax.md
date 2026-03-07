---
title: "Lexical Structure and Syntax"
---


## Tokens and Comments
- Line comments: `// ...` (to end of line)
- Block comments: `/* ... */` (do not nest in v0.1)
- Identifiers: `[A-Za-z_][A-Za-z0-9_]*`, case-sensitive
- Fat arrow: `=>` (used for lambda expressions)

Example:
```
// line comment
/* block comment */
let user_id = 1;
```

## Keywords (v0.1)
`type`, `enum`, `contract`, `impl`, `attribute`, `match`, `when`, `if`, `else`, `while`, `for`, `in`, `return`, `break`, `continue`, `let`, `mut`, `mod`, `use`, `pub`, `ref`, `out`, `event`

### Keyword meanings
- `type`: product type (struct) declaration.
- `enum`: sum type (variant) declaration.
- `contract`: explicit interface declaration (nominal conformance via `type Type : ContractA, ContractB`).
- `impl`: implementation block that defines methods for a concrete type.
- `attribute`: attribute declaration.
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
- `event`: native modifier for zero-cost multicast delegates.

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

## Attributes

### Attribute declaration
Attributes are first-class top-level declarations:

```beskid
pub attribute Builder(TypeDeclaration, MethodDeclaration) {
    suffix: string = "Builder",
    enabled: bool = true,
}
```

Notes:
- The optional declaration target list constrains where the attribute may be applied.
- If a target list is present, applying the attribute to any other structure is a semantic error.
- Valid target-list entries are: `TypeDeclaration`, `EnumDeclaration`, `ContractDeclaration`, `ModuleDeclaration`, `FunctionDeclaration`, `MethodDeclaration`, `FieldDeclaration`, `ParameterDeclaration`.
- Parameter defaults are used when an argument is omitted.

### Attribute application
Attributes can be applied to supported declarations using named, typed expression arguments:

```beskid
[Builder(suffix: "Factory", enabled: false)]
type User {
    string name,
}
```

Notes:
- Argument names map to declared attribute parameters.
- Argument values are expressions (not string-only payloads).

### Supported attribute placements (v0.1)
Attributes may be attached to:
- top-level type declarations,
- top-level enum declarations,
- contract declarations,
- module declarations,
- function declarations,
- methods,
- fields,
- parameters.

Example:
```
unit greet() {
    let msg = "hi";
    println(msg);
}
```

## Functions and Lambdas
Beskid supports statically-typed first-class functions and lambda expressions.
Function types are declared using the arrow syntax: `(T1, T2) -> TOut`.

Semantic typing, inference, and closure/capture rules are defined in:
- `docs/spec/lambdas-and-closures.md`

Lambdas use the fat arrow `=>`.
```beskid
// Type signature for a function that takes an i32 and returns a bool
type Predicate = (i32) -> bool;

// Lambda with inferred parameter types
let isEven = x => x % 2 == 0;

// Lambda with explicit parameter types
let add = (i32 x, i32 y) => x + y;

// Lambda with a block body
let printAndReturn = x => {
    println(x.to_string());
    return x;
};
```

Parameter declarations use `Type name` ordering in all contexts.
