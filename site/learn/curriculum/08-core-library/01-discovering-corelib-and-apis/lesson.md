---
id: corelib_discovery
slug: discovering-corelib-and-apis
title: Find batteries without guessing
context: core-library
objective: Navigate corelib as a resolved dependency and distinguish public APIs from runtime internals.
category: core-library
difficulty: intermediate
prerequisites: ["structure_projects"]
command: reference
source: openspec/specs/core-library--compiler-integration--corelib-injection-and-resolution/spec.md
vocabulary: ["boundary","contract","core","library"]
hints: ["Corelib is a resolved public toolkit, not a private intrinsic catalog."]
questions: [{"id":"corelib_discovery_q1","text":"Predict why a public wrapper is a better application dependency than an internal double-underscore operation.","options":["It follows the stated contract.","It is a timing or implementation guess."],"correctIndex":0}]
---

## Hook and goal

Navigate corelib as a resolved dependency and distinguish public APIs from runtime internals. Corelib is a resolved public toolkit, not a private intrinsic catalog.

## Predict

Predict why a public wrapper is a better application dependency than an internal double-underscore operation.

## Run

Reference-only: this capability has no lesson-specific compiler proof in the current Learn runtime. Read the cited specification and do not present this package as an interactive acceptance exercise.

```beskid
// Public corelib surface, resolved by the host project.
use Concurrency.Channel;
```

## Investigate

Reference-only: corelib availability is project-scoped. Inspect resolved packages rather than treating a scratch file as proof.

## Modify

Choose a need—console, time, results, or concurrency—and identify the public package area first.

## Make and retrieve

Make a lookup route and retrieve why intrinsics are not your first API.

## Failure clinic

```beskid
// Bad application boundary: private runtime intrinsic instead of public API.
__channel_send(0, 42);
```

Do not disable corelib or paste private declarations to repair resolution.

## Recap and next link

Corelib offers public tools. Next: learn to read an API signature.
