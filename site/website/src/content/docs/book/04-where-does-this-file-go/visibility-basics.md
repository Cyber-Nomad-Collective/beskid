---
title: "Visibility basics"
description: "Private by default, pub exports, and not leaking every helper across the monorepo."
tableOfContents: true
---

Default visibility is **private**. If you wanted everything public, you already have JavaScript.

## `pub` means intentional surface

Mark items `pub` when other modules may depend on them. Keep helpers private unless you enjoy semver pain from accidental API growth.

## Fields are private too

The rule applies to struct fields. A field without `pub` can be read and set only in the source file that declares its type, and that includes the type's inline methods. Anywhere else, reading it, reaching through it in a chain like `a.b.c`, or naming it in a struct literal fails with **E1211** (inaccessible struct field).

```beskid
pub type Account {
    pub string owner,
    i64 balance,

    pub i64 Balance() {
        return this.balance;
    }
}
```

Another file can read `account.owner` and call `account.Balance()`. It cannot read `account.balance`. It also cannot build an `Account` with a struct literal, because a literal must supply every field, including the private one. Give the declaring file a constructor function instead.

Mark a field `pub` when other files genuinely need it. Keep implementation detail private and expose a function. `extend type` bodies in other files get **E1511** for private fields of the extended type.

## Module boundaries

Use boundary modules (`api.bd`, `mod service;` files) to:

- Hide experimental internals in private siblings
- Re-export a narrow surface with `pub use` (chapter [05](/book/05-names-nobody-agreed-on/))

## File-scoped modules tighten the story

When `mod domain.feature;` owns a file, everything top-level in that file shares the module scope. Additional `mod` declarations are disallowed to prevent nested chaos.

## Smell table

| Smell | Fix |
| --- | --- |
| `pub` on every function | Delete `pub` from helpers |
| Cross-layer imports | Introduce boundary module + `pub use` |
| "Util" package imported everywhere | Split domain modules |

## Standard reference (informative)

- [Modules and Visibility](/docs/standard/capabilities/language-meta--program-structure--modules-and-visibility/)
- [Code style and naming](/docs/standard/capabilities/language-meta--program-structure--code-style-and-naming/)

## Next

[Corelib layout](/book/04-where-does-this-file-go/corelib-layout/)
