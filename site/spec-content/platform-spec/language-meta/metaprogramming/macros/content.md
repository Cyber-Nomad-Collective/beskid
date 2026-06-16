---
title: Language macros
description: Module-level macro rules with fragment parameters, `name!`
  invocation, and typed AST expansion in any project kind.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-20
---

<SpecSection title="Role" id="role">
**Language macros** are a first-class **module item** in **App**, **Lib**, **Test**, and **Mod** projects. They provide Rust-style **macro rules** ergonomics (`name!`) with Beskid declaration style (`macro name (fragment param, ...) { ... }`).

Expansion is **structural**: the compiler substitutes captured syntax fragments for **`$param`** references in the macro body. v1 does **not** interpret arbitrary Beskid statements at compile time and does **not** emit source text.
</SpecSection>

<SpecSection title="Definition syntax" id="definition">
```beskid
pub macro sayHi (block body, expression message)
{
    Console.WriteLine($message);
    $body
}
```

| Element | Rule |
| --- | --- |
| Keyword | `macro` introduces `MacroDefinition` as an **`InnerItem`**. |
| Visibility | Optional `pub`; obeys **[modules and visibility](/platform-spec/language-meta/program-structure/modules-and-visibility/)**. |
| Parameters | Parenthesized, comma-separated **`fragmentKind name`** pairs (see fragment kinds). |
| Body | Single braced **`Block`** of normal Beskid statements and expressions. |
| Metavariables | **`$name`** in the body references a parameter; legal only inside macro definitions. |

Cross-module use: **`pub macro`** plus normal **`use`** / path qualification (see name-resolution hub).
</SpecSection>

<SpecSection title="Invocation syntax" id="invocation">
Macros are invoked with a postfix **`!`** on the macro name:

| Form | Binding |
| --- | --- |
| `sayHi!()` | Zero arguments (unit / empty actual list). |
| `sayHi!(expr)` | Positional arguments in **definition order** inside `!(...)`. |
| `sayHi! { stmts }` | Braced block actual (typical for `block` parameters). |
| `sayHi!(a, b)` | Multiple positional arguments in one `!(...)`. |

**`MacroInvocation`** is an expression form: `identifier` + `!` + optional parenthesized argument list + optional braced block.

**Disambiguation** — `!` after an identifier is a macro invocation only when a **`macro`** binding resolves in scope. If no binding exists, the compiler emits **E1901** (unknown macro). Future non-macro uses of `!` must not collide with this rule.

**Item-position macros** — When a parameter is **`item`**, the invocation may appear at module item position (for example `my_macro!(type Wrapper { pub i32 x; })`), expanding to one or more **`InnerItem`** nodes spliced into the enclosing item list.
</SpecSection>

<SpecSection title="Fragment kinds (v1)" id="fragment-kinds">
Closed vocabulary for parameter kinds:

| Kind | Accepted syntax root |
| --- | --- |
| `block` | `Block` |
| `expression` | `Expression` |
| `statement` | `Statement` |
| `type` | `Type` (surface `BeskidType`) |
| `identifier` | `Identifier` |
| `literal` | `Literal` or `LiteralExpression` |
| `pattern` | `Pattern` |
| `path` | `Path` |
| `item` | any `InnerItem` |
| `node` | any `Node` (escape hatch; discouraged in user code) |

Mismatch between actual argument shape and declared kind → **E1903** at the argument span.
</SpecSection>

<SpecSection title="Expansion model" id="expansion">
1. Resolve the invocation to a **`MacroDefinition`** in scope.
2. Validate arity and fragment kinds for each actual argument.
3. Deep-copy each captured fragment and substitute for every **`$param`** occurrence in the macro body (fresh node identities; diagnostic spans trace to expansion sites where required).
4. Splice the resulting statements or expression in place of the **`MacroInvocation`**.
5. Repeat until no **`!`** invocations remain or **`maxMacroExpansionDepth`** is reached (**E1905**).

**Depth cap** — Default **32** per compilation unit generation; independent of **`maxGeneratorRounds`** on mod projects.

**Well-formedness** — Expanded trees must pass the same structural checks as authored syntax before semantic analysis proceeds.

**Mod interaction** — After **`mod.generate`** merges typed contributions and the host re-parses, **`macro.expand`** runs again inside the generator replay loop so mod-emitted code can contain macro invocations.
</SpecSection>

<SpecSection title="Relationship to Compiler Mod SDK" id="vs-mod-sdk">
| Mechanism | Owner | When |
| --- | --- | --- |
| **Language `macro` items** | Compiler intrinsic **`macro.expand`** | Any project kind; no AOT mod artifact |
| **Mod `Collector` / `Generator`** | Mod host | `type: Mod` packages; cross-cutting codegen |

Mods may **define** `pub macro` items like any library. Mod contracts do **not** replace language macros, and language macros do **not** register in `mod.descriptor.json`.

See **[Compiler Mod SDK](/platform-spec/language-meta/metaprogramming/compiler-mod-sdk/#language-macros-vs-mod-sdk)**.
</SpecSection>

<SpecSection title="Non-goals (v1)" id="non-goals">
- Repetition operators `$(...)*`, `$(...)+`, `$(...)?` (see **Proposed** roadmap only).
- String formatting or source-text emission from macro bodies.
- Compile-time execution of arbitrary Beskid statements (bodies are templates, not interpreted functions).
- Mod-only or manifest-registered macro discovery.
</SpecSection>

<SpecSection title="Examples" id="examples">
**Block wrapper**

```beskid
macro logged (block body)
{
    Console.WriteLine("enter");
    $body
    Console.WriteLine("leave");
}

unit Main()
{
    logged! {
        Console.WriteLine("work");
    }
}
```

**Expression passthrough**

```beskid
macro identity (expression value)
{
    $value
}

let x = identity!(1 + 2);
```
</SpecSection>
