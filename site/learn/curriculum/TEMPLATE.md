# Beskid Learn lesson template

Every manifest lesson has exactly these four files:

```text
NN-context/NN-lesson/
  lesson.md
  start.bd
  solution.bd
  check.json
```

`lesson.md` begins with YAML-style front matter. Values that contain a list or
object are compact JSON so the curriculum tool can parse them without a second
authoring format. `id` and `context` must match `manifest.json`; the command
must match `check.json`.

```markdown
---
id: foundations_main
context: foundations
title: Main and exit codes
objective: Make a valid entry point and explain what its result communicates.
prerequisites: []
command: analyze
difficulty: beginner
category: foundations
vocabulary: ["entry point", "exit code"]
source: openspec/specs/language-meta--programs--entry-points/spec.md
hints: ["Start with i32 Main().", "Return a deterministic i32 value."]
questions: [{"id":"foundations_main_q1","text":"Which function begins this program?","options":["Main","Start"],"correctIndex":0}]
---

## Hook and goal

State a visible Ridge Signal outcome and name the exact command.

## Predict

Ask one answerable prediction before showing the observed result.

## Run

Show a complete short program. It must agree with `solution.bd` when the
lesson is interactive. Every lesson, including reference-only lessons, must
include at least one non-empty fenced `beskid` code example in its body.

## Investigate

Explain semantics grouped by purpose. Link terms to the governing source.

## Modify

Give one bounded semantic change, not an open-ended rewrite.

## Make and retrieve

Give a transfer task and ask the learner to explain one rule from memory.

## Failure clinic

Show one plausible error, the observed diagnostic or failed condition, and a
narrow repair rule. Include a non-empty fenced `beskid` example of the
mistake in this section so the repair has a concrete source location.

## Recap and next link

Recap vocabulary and name the next lesson or prerequisite relationship.
```

`check.json` declares only acceptance metadata. It does not replace running the
declared Beskid CLI command against both source files.

```json
{
  "mode": "interactive",
  "command": "analyze",
  "acceptance": { "kind": "compiler", "expect": "pass" }
}
```

For a source-backed feature that the selected compiler cannot execute, use
`"mode": "reference-only"`, `"command": "reference"`, and
`{"kind":"reference","expect":"read"}`. Keep the same four-file package,
state the limitation in **Run**, and never present it as an interactive UI
exercise. Do not use reference-only merely to skip verification.

Authoring rules:

- Follow Predict → Run → Investigate → Modify → Make and retrieve.
- Introduce one principal capability, with a concrete observable outcome.
- Cite normative OpenSpec in `source`; do not import claims from another
  language by analogy.
- Use verified compiler feedback in **Failure clinic**.
- Fiber traces are examples, never scheduling promises; avoid thread and
  `async`/`await` metaphors.
