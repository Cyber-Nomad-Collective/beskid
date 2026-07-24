---
title: "Parse Recovery: When the Compiler Says 'I See What You Meant' Instead of Just Dying"
description: "Most compilers hit a syntax error and give up. Beskid's parser recovers, finds more errors, and reports them all — because 'error on line 1' is a compiler crime and nobody has time for fix-one-error-rerun loops."
date: 2026-07-23
blogStatus: released
release: Compiler
---

import { BlogIndex } from '../../../components/BlogIndex.astro';

Most compilers have exactly one move when they hit a syntax error: stop. Print "unexpected token." Exit. Make the developer fix that one error, recompile, and pray the next line isn't also broken.

It's a terrible developer experience, and we've all been trained to accept it.

## Compilers that die on the first error

The traditional single-pass compiler loop goes: lex, parse, typecheck, codegen. If parsing fails, everything stops. You get one error message. You fix it. You recompile. You get another error. You fix that. Repeat. For a file with five syntax errors, that's five compile cycles.

This isn't just annoying — it's a productivity tax that compounds with project size. A 200-line file with three missing semicolons shouldn't require three round trips through the build system.

## The commit that changed everything

On July 23, 2026, [commit `c765ef51`](https://github.com/opencp/beskid/commit/c765ef51) landed parse recovery in Beskid. The commit message is characteristically terse — "land parse recovery and ISLE float/unsigned gaps" — but the diff tells the real story. The parser no longer returns on first error. It finds a synchronization point, resets state, and keeps going.

The follow-up [commit `0486fabd`](https://github.com/opencp/beskid/commit/0486fabd) fixed an overflow in the recovery token buffer — the kind of bug that only shows up when you're collecting dozens of errors instead of just one.

Together, they form the design documented in [`docs/superpowers/specs/2026-07-23-parse-recovery-heuristics-design.md`](https://github.com/opencp/beskid/blob/main/docs/superpowers/specs/2026-07-23-parse-recovery-heuristics-design.md): the parse-recovery heuristics spec.

## How recovery actually works

The mechanism is straightforward, even if the implementation is delicate. When the parser encounters a token it can't fit into the current production, it enters recovery mode. Instead of giving up, it scans ahead for a **synchronization point** — a token that unambiguously signals "the next thing starts here."

What counts as a sync point?

- **Semicolons.** Statement boundaries. If the parser is mid-expression and sees a semicolon, it knows the broken statement ended.
- **Closing braces.** Block boundaries. `}` means "whatever was inside this scope is done." The parser pops the scope and resumes at the next statement.
- **Module boundaries.** `module`, `import`, `export` — hard structural markers that reset the parsing context.
- **Keyword statement starters.** `fn`, `let`, `if`, `for`, `while`, `return` — any token that can only begin a new statement.

When recovery finds a sync point, it discards the tokens between the error site and the sync point, resets the parser state to the nearest enclosing scope, and continues. The error is recorded. The parser moves on. The next statement gets parsed normally — and if it has errors too, those get reported as well.

The result: instead of one error per compile, you get **all** errors per compile.

## The LSP synergy

Parse recovery isn't just about batch compilation. It's the prerequisite for a competent LSP.

Before recovery, the language server could only show one red squiggle at a time — at the first broken token. Everything after that was invisible to the parser, which meant no diagnostics, no syntax highlighting, no intellisense. The editor went dark after the first mistake.

With recovery, the LSP gets a complete(ish) AST no matter how many syntax errors exist. Red squiggles appear everywhere they're needed. Completions work in function bodies after a broken import. Hover types resolve in code that follows a missing brace. The editor stays useful even when the code is broken — which, if we're honest, is most of the time.

## The ISLE float/unsigned gap fix

The same commit that landed parse recovery also fixed float literal parsing in ISLE rules. This wasn't a coincidence. Parse recovery exposed the bug by actually reaching ISLE rules that referenced float literals — code that the old parser never got to because it died on an earlier error. Recovery doesn't just find more user errors; it finds more compiler bugs.

One of the float literal edge cases: unsigned integer gaps in the tokenizer meant that `0x1.0p0` (a hexadecimal float) could be mis-tokenized as an integer followed by a stray `.0p0`. Recovery made this visible by successfully parsing the surrounding context and reporting the tokenization mismatch as an error instead of crashing.

## The therapist metaphor

The Book chapter ["Read a diagnostic"](https://opencp.org/book/07-compiler-is-not-your-therapist/read-a-diagnostic) (in *The Compiler Is Not Your Therapist*) makes the point directly: a compiler that says "error on line 1" and stops is like a therapist who says "you seem sad" and ends the session. The useful work hasn't started.

A good diagnostic is specific, local, and actionable. But a good diagnostic system is also **comprehensive** — it tells you everything that's wrong, not just the first thing. Parse recovery is how you get from "one specific error" to "all specific errors."

The therapist metaphor extends further: the compiler shouldn't judge. It shouldn't speculate about what you *probably* meant. It should report what it knows and let you decide. Recovery heuristics walk this line carefully — they don't guess at fixes, they find boundaries and resume. The errors are factual, not interpretive.

## Why this matters

A compiler that dies on the first error is a compiler that wastes your time. Every round trip through the build system costs context. Every "fix this one thing and try again" cycle pulls you out of flow. Multiply by the number of developers on a team, the number of compiles per day, the number of errors per compile — the tax is enormous and invisible because we've all normalized it.

Parse recovery is not a feature. It is basic respect for the developer's attention. The compiler should work as hard as you do to understand your code — and when it can't, it should tell you everything it knows, not just the first thing that went wrong.

<BlogIndex />
