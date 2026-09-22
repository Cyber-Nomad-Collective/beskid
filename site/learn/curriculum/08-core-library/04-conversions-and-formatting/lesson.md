---
id: corelib_conversions
slug: conversions-and-formatting
title: Convert with a receipt
context: core-library
objective: Treat conversions and formatting as explicit boundary operations with specified failure behavior.
category: core-library
difficulty: intermediate
prerequisites: ["corelib_collections"]
command: reference
source: openspec/specs/core-library--foundation-and-primitives--core-string/spec.md
vocabulary: ["boundary","contract","core","library"]
hints: ["Conversions should preserve or report the information they cannot preserve."]
questions: [{"id":"corelib_conversions_q1","text":"Predict whether formatting a number and parsing text back are automatically inverse operations.","options":["It follows the stated contract.","It is a timing or implementation guess."],"correctIndex":0}]
---

## Hook and goal

Treat conversions and formatting as explicit boundary operations with specified failure behavior. Conversions should preserve or report the information they cannot preserve.

## Predict

Predict whether formatting a number and parsing text back are automatically inverse operations.

## Run

Reference-only: this capability has no lesson-specific compiler proof in the current Learn runtime. Read the cited specification and do not present this package as an interactive acceptance exercise.

```beskid
string source = "42";
// A documented parser must state its invalid-input outcome.
```

## Investigate

Reference-only: use documented conversion APIs only after their exact corelib surface is verified for the target.

## Modify

For an input field, list source representation, target representation, invalid-input outcome, and presentation format.

## Make and retrieve

Make a conversion receipt and retrieve its four fields.

## Failure clinic

```beskid
// Bad conversion policy: malformed text becomes a plausible score.
i32 ParseScore(string text) { return 0; }
```

Do not silently coerce an invalid value into a plausible default.

## Recap and next link

Explicit conversion protects meaning. Next: inspect advanced surfaces with the same discipline.
