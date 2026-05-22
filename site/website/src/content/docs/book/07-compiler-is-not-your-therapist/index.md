---
title: "The compiler is not your therapist"
description: Lexical basics, types, Option, functions, control flow, and reading diagnostics like an adult."
tableOfContents: true
---

You have manifests, modules, and imports. Now the compiler wants to talk about **types**—the relationship where one party sets boundaries and the other pretends to listen.

This chapter is the first language-syntax tour: enough to read real `.bd` files and understand why the analyzer is mad. Normative grammar lives under [language meta](/platform-spec/language-meta/); we stay informative and link out.

## What you will find here

| Section | Topic |
| --- | --- |
| [Lexical basics](/book/07-compiler-is-not-your-therapist/lexical-basics/) | Tokens, identifiers, comments, literals sketch. |
| [Types and generics](/book/07-compiler-is-not-your-therapist/types-and-generics/) | Nominal types, `ref`, generics—no `null`. |
| [Option and nullability](/book/07-compiler-is-not-your-therapist/option-and-nullability/) | `Option<T>` only. |
| [Functions and methods](/book/07-compiler-is-not-your-therapist/functions-and-methods/) | Calls, receivers, dispatch sketch. |
| [Control flow](/book/07-compiler-is-not-your-therapist/control-flow/) | `if`, `match`, loops—read spec for full grammar. |
| [Read a diagnostic](/book/07-compiler-is-not-your-therapist/read-a-diagnostic/) | Spans, codes, fixing vs arguing. |

## Previous

[06. Monorepo as coping mechanism](/book/06-monorepo-as-coping-mechanism/)

## After this chapter

Later tutorial tracks cover public API idioms and documentation comments (see book appendix / reference). For exhaustive rules, use [platform spec language meta](/platform-spec/language-meta/) and [semantic rules](/book/reference/analysis/semantic-rules/).
