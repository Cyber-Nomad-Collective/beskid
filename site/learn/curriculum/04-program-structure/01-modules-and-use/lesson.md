---
id: structure_modules
slug: modules-and-use
title: Give code an address
context: program-structure
objective: Explain how modules and use declarations give names an unambiguous origin.
category: program-structure
difficulty: intermediate
prerequisites: []
command: reference
source: openspec/specs/language-meta--program-structure--modules-and-visibility/spec.md
vocabulary: ["boundary","contract","program","structure"]
hints: ["A module owns declarations; use brings a deliberate path into local scope."]
questions: [{"id":"structure_modules_q1","text":"What does a use declaration contribute to local code?","options":["A deliberate path-based name","A copy of another module's source"],"correctIndex":0}]
---

## Hook and goal

Explain how modules and use declarations give names an unambiguous origin. A module owns declarations; use brings a deliberate path into local scope.

## Predict

Predict why a bare name is hard to review without an owning path.

## Run

```beskid
// Module and use form from the cited program-structure specification.
use Core.Console as Console;
```

Reference-only: this capability has no lesson-specific compiler proof in the current Learn runtime. Read the cited specification and do not present this package as an interactive acceptance exercise.

```beskid
// Module declarations and use paths are resolved in project context.
use Concurrency.Channel;
```

## Investigate

Module declarations establish namespaces. `use Path as Name;` resolves an explicit path; it is not textual copy-and-paste.

## Modify

Map Console.WriteLine and Concurrency.Channel to their owning paths.

## Make and retrieve

Make an import policy, then retrieve the difference between a module and a use declaration.

## Failure clinic

Broken code, used only to isolate a parser condition:

```beskid
i32 Main( {
  return 0;
}
```

Observed condition: parsing cannot form the parameter list after Main. Repair: write the empty parameter list as Main(), then rerun the lesson command before interpreting any follow-on messages.

```beskid
// Bad: the name has no declaration or imported path in this unit.
Channel.Create<i32>();
```

An unknown name calls for checking declaration, path, visibility, then project resolution—not inventing a spelling.

## Recap and next link

Modules give names addresses. Next: decide which addresses are public promises.
