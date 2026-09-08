---
title: Language basics for the first program
description: Read the minimum Beskid syntax used by the verified Main program.
pageKind: guide
diagramPolicy: not-needed
diagramOmissionReason: A syntax reference table is clearer than a flow diagram.
audience:
  - evaluator
  - newcomer
  - developer
authority:
  status: informative
  sourceLabel: Lexical and syntax standard capability
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid/blob/298b4a1a418eef79ba85ab51d0ca0d5b7357561b/openspec/specs/language-meta--surface-syntax--lexical-and-syntax/spec.md
  limits: This page explains only the syntax in the first program. The Beskid Standard is normative.
verified:
  revision: 298b4a1a418eef79ba85ab51d0ca0d5b7357561b
  date: 2026-09-08
---

Use the exact case shown in Beskid identifiers. The standard, not this summary, defines lexical and syntax behavior.

## Prerequisites

Open the `Main.bd` source from [Write and run a program](/docs/getting-started/first-program/).

## Actions

1. Read the function from left to right:

   ```beskid
   i32 Main() {
       return 0;
   }
   ```

2. Interpret `i32` as the function return type.
3. Interpret `Main` as the case-sensitive default entrypoint name used by `beskid run`.
4. Interpret `()` as an empty parameter list.
5. Interpret `{` and `}` as the function body boundaries.
6. Interpret `return 0;` as a return statement whose integer value is the process success status.
7. Use [the Beskid Standard](/docs/standard/) for complete language requirements and [the Book](/book/) for lessons and larger examples.

## Expected result

You can identify the return type, entrypoint, parameter list, body, statement terminator, and returned value in the first program.

## Recovery

If analysis rejects an example, copy the verified source exactly and analyze it before you add syntax. Check case, braces, parentheses, and the semicolon at the diagnostic span.

## Next task

Return to [Write and run a program](/docs/getting-started/first-program/) to execute the source, or continue through [the Book](/book/) for structured language lessons.
