---
title: "Project.proj or it didn't happen"
description: Manifests, targets, dependencies, lockfiles, and the resolver graph that actually builds.
tableOfContents: true
---

Every serious Beskid program anchors on **`Project.proj`** at the project root—not a twelve-page YAML poem, not a solution file with six nested repos and a prayer.

This chapter is the mental model for **what** you are building (targets), **what** you depend on (dependencies), and **how** tooling orders work before codegen.

## What you will find here

| Section | Topic |
| --- | --- |
| [Project manifest](/book/03-project-proj-or-it-didnt-happen/project-manifest/) | `project`, `target`, `dependency` blocks. |
| [Targets and outputs](/book/03-project-proj-or-it-didnt-happen/targets-and-outputs/) | `App`, `Lib`, `Test`, entries, artifacts. |
| [`beskid new`](/book/03-project-proj-or-it-didnt-happen/beskid-new/) | Scaffolding templates without hand-copy hell. |
| [Fetch, lock, update](/book/03-project-proj-or-it-didnt-happen/fetch-lock-update/) | Resolution, `Project.lock`, reproducibility. |
| [Tree and resolution](/book/03-project-proj-or-it-didnt-happen/tree-and-resolution/) | DAG order, `obj/beskid`, debugging graphs. |

## By the end of this chapter

- Read a minimal `Project.proj` without panic.
- Predict build order for dependencies.
- Know when `Project.lock` should change and why.

## Previous

[02. PATH not found — tooling anyway](/book/02-path-not-found-tooling-anyway/)

## Next

[04. Where does this file even go?](/book/04-where-does-this-file-go/)
