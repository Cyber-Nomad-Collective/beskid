---
id: orientation_learning_loop
context: orientation
title: Learn by predicting, checking, and explaining
objective: Use the Beskid Learn loop to turn each compiler check into evidence about one programming rule.
prerequisites: []
command: analyze
difficulty: beginner
category: orientation
vocabulary: ["prediction", "evidence", "diagnostic", "scaffold", "retrieval"]
source: openspec/specs/tooling--cli--build-analyze-run-contract/spec.md
hints: ["Make one prediction before every check.", "Change one idea at a time so feedback stays legible."]
questions: [{"id":"orientation_learning_loop_q1","text":"What should you write before pressing a check button?","options":["A prediction about one observable rule","A larger unrelated rewrite"],"correctIndex":0}]
---

## Hook and goal

Learning Beskid is a series of small expeditions, not a race to make the screen green. Each lesson asks you to predict behavior, observe evidence, explain the rule, make one controlled change, and retrieve the rule later without a hint. Your goal is to use that loop when a program succeeds *and* when it fails.

## Predict

Before changing a lesson, write one falsifiable sentence: “If I change ___, the analyzer should ___ because ___.” Avoid predictions such as “it should work”; name the expected acceptance or the particular rule that should be rejected.

## Run

```beskid
i32 Main() {
  return 0;
}
```

Reference-only: this orientation lesson explains the workflow rather than claiming a standalone source fixture. In an interactive lesson, use the command stated by its package. `analyze` checks program structure and semantic acceptance; it does not replace a runtime observation when a lesson asks about execution.

## Investigate

The loop is deliberately narrow:

1. **Predict** one outcome before the tool tells you.
2. **Run** the lesson's declared check.
3. **Investigate** the smallest relevant source span and the cited language rule.
4. **Modify** one bounded idea, then recheck.
5. **Make and retrieve** a small transfer task and explain the rule from memory.

This is productive friction. A clean check is evidence that one revision met one command's contract; it is not proof that you understand the rule or that every possible program is correct. A failed check is equally useful when you can connect it to the change you made.

## Modify

Choose a completed lesson and create a one-line learning log with four fields: prediction, observed result, rule, next experiment. Make the next experiment differ by one semantic decision only—such as a value, a branch outcome, or one argument.

## Make and retrieve

Make a “compiler conversation” card for a peer: *I predict …; I checked with …; the evidence says …; therefore the rule is …*. Then close the lesson and retrieve the five loop stages in order. Use the card on a different lesson rather than copying a solution.

## Failure clinic

Broken code, used only to isolate a parser condition:

```beskid
i32 Main( {
  return 0;
}
```

Observed condition: parsing cannot form the parameter list after Main. Repair: write the empty parameter list as Main(), then rerun the lesson command before interpreting any follow-on messages.

If a check fails after many edits, do not pile on repairs. Restore the smallest known state if available, reproduce one change, and read the earliest diagnostic. If a check passes but you cannot explain why, keep the result and perform a contrasting one-change experiment; green is a result, not an explanation.

## Recap and next link

The Learn loop converts guesses into evidence through small, explainable changes. Next, learn to read a diagnostic as a location, a rule, and a repair boundary rather than as a cryptic verdict.
