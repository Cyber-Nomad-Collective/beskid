---
id: structure_projects
slug: projects-packages-and-builds
title: Assemble a project, not a pile
context: program-structure
objective: Explain how manifests, dependencies, corelib, analyze, build, and run fit together.
category: program-structure
difficulty: intermediate
prerequisites: ["structure_visibility"]
command: reference
source: openspec/specs/compiler--resolution-and-projects--project-manifest-contract/spec.md
vocabulary: ["boundary","contract","program","structure"]
hints: ["A project supplies dependency and corelib context that one file cannot."]
questions: [{"id":"structure_projects_q1","text":"Which stage adds an executable artifact after analysis?","options":["Build","Name resolution"],"correctIndex":0}]
---

## Hook and goal

Explain how manifests, dependencies, corelib, analyze, build, and run fit together. A project supplies dependency and corelib context that one file cannot.

## Predict

Predict whether parse success proves that dependencies and executable tooling are ready.

## Run

```beskid
i32 Main() {
  return 0;
}
```

Reference-only: this capability has no lesson-specific compiler proof in the current Learn runtime. Read the cited specification and do not present this package as an interactive acceptance exercise.

```beskid
// A project manifest resolves packages before this entrypoint is built.
i32 Main() { return 0; }
```

## Investigate

Project commands resolve manifests, locks, dependencies, and implicit corelib. Analyze checks semantics; build and run add artifact and platform obligations.

## Modify

Draw source to resolution to analysis to artifact to execution, placing one possible failure at each boundary.

## Make and retrieve

Make a project preflight checklist and retrieve why linker failure is not a type error.

## Failure clinic

Broken code, used only to isolate a parser condition:

```beskid
i32 Main( {
  return 0;
}
```

Observed condition: parsing cannot form the parameter list after Main. Repair: write the empty parameter list as Main(), then rerun the lesson command before interpreting any follow-on messages.

```beskid
// Bad project condition: an imported package is absent from the dependency graph.
use Missing.Package;
```

Do not paste dependencies into a source file to repair manifest resolution.

## Recap and next link

A project is declared context. Next: turn failures into durable evidence.
