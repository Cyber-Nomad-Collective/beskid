---
title: "Impl Blocks, Method Receivers, and Why 'this' Is Not a Keyword — It's a Parameter"
description: "Beskid methods are not a separate concept from functions. They are functions with a receiver parameter named 'this' — and the impl block is just syntax for grouping them. This design decision saved the compiler from reinventing dispatch."
date: 2026-03-03
blogStatus: released
release: Design
---

Method dispatch is one of the places where language designs quietly blow up in complexity. Virtual tables. Inheritance hierarchies. Single dispatch versus multiple dispatch. Covariant return types. The design space is a minefield, and every mine is a runtime performance regression dressed as a language feature.

Beskid sidestepped the entire minefield with one decision: methods are not a separate concept from functions. They are functions with a receiver parameter named `this`. The impl block is syntax for grouping them. That's it. Commit `198361f3` landed impl block syntax with method receiver validation and call lowering infrastructure. Commit `2f3d9464` followed with method call support using receiver-based resolution and `this` parameter binding.

## The design

An impl block looks like this:

```
impl MyType {
    fn method(this, args) { ... }
}
```

`this` is the first parameter. It is typed. It is explicit. The method body accesses `this` the same way it accesses any other parameter — because `this` is any other parameter. The impl block groups related functions under a type name, but the grouping is organizational, not semantic. The compiler sees a function `MyType::method` with a first parameter of type `MyType`. Nothing else.

Method call syntax — `value.method(args)` — is syntactic sugar for `MyType::method(value, args)`. The compiler desugars the dot call during lowering. The lowered IR has no concept of a "method call." It has function calls. Some of them happen to have a first argument that arrived via dot syntax. The codegen doesn't care. The optimizer doesn't care. The ABI doesn't care.

## What this avoids

No virtual dispatch table. Beskid doesn't have inheritance, so there is nothing for a vtable to virtualize. But even if inheritance arrived someday, the method-as-function design means dispatch is always static — the compiler knows exactly which function is being called at compile time. No vtable layout bugs because there is no vtable.

No `this` keyword with special binding rules. In languages where `this` is a keyword, the compiler has to maintain an implicit context: what object is `this` bound to in this lexical scope? Arrow functions rebind `this`. Callbacks lose `this`. Event handlers capture `this`. Every one of those rules is a section in the language spec and a class of bugs in user code. In Beskid, `this` is a parameter. It follows parameter scoping rules. Closures capture it like any other variable. No special cases.

No separate method resolution algorithm. The compiler has one name resolution path: look up the function in the module scope, check the types, unify. Methods don't get a parallel resolution path with different rules. The impl block adds the function to the type's namespace, but resolution walks that namespace exactly the same way it walks module namespaces.

## The attribute target refactor

Impl blocks can have attributes — visibility modifiers, deprecation notices, platform restrictions. And the attribute system needs to know which targets are valid at which positions. A deprecation attribute is valid on a function but not on a variable. A visibility modifier is valid on an impl block but not on an expression.

The same commits that landed impl blocks also landed the `AttributeTargetKind` enum replacement. Before: attribute validation used string matching (`"function"`, `"module"`, `"impl"`). After: a proper enum with variants `Function`, `Module`, `ImplBlock`, `MethodReceiver`. Diagnostics E1806, E1807, and E1809 — "attribute not valid on this target" — switched from string comparison to enum match. A typo in a target string was a runtime panic. A missing enum variant is a compile error. The refactor moved the failure from the user's compile to the compiler's compile.

This is the kind of detail that doesn't make it into language design blog posts. But when you add impl blocks, attributes follow. When attributes follow, validation follows. When validation follows, stringly-typed target matching becomes a liability. The commits tell the real story: language features drag their infrastructure behind them. The impl block was the feature. The attribute target enum was the infrastructure. Both landed together because they had to.

## Why this matters

Language features that look like sugar are often the most important design decisions. Method syntax looks like sugar — just a dot instead of a function call. But the decision not to invent a separate dispatch system underneath that dot is architecture. It means the compiler is smaller. The runtime is simpler. The debugger has fewer concepts to explain. The language spec has fewer pages.

Every language eventually grows method syntax. Not every language resists the temptation to build a cathedral of dispatch underneath it. Beskid resisted. The impl block is a filing cabinet. The method is a function. `this` is a parameter. The compiler thanks you for not making it invent a vtable.

Cross-reference Book chapter "Functions and methods" (07-compiler-is-not-your-therapist/functions-and-methods.md). The chapter opens with the same observation: methods are functions, and the compiler will not pretend otherwise.
