---
title: "Dependency cycles"
description: Keeping the workspace DAG acyclic and surviving circular path deps."
tableOfContents: true
---

Cycles are how monorepos learn humility. The resolver builds a **DAG**. If you create a cycle, nothing moral happens next.

## Healthy layering

A util lib feeds a core lib, which feeds an app. One direction, no surprises.

Forbidden emotional support: project A depends on project B, which depends back on project A. `beskid graph --kind workspace --mermaid` will draw this for you exactly as ugly as it is.

## Path dependency cycles

With `source = path`, cycles are just folders pointing at each other. Symptoms:

- Resolution failures
- Nondeterministic build order in tooling that assumed a DAG

Fix by extracting shared types into a third **lower** library both sides depend on. Classic graph surgery, not compiler therapy.

## Test-only backdoors

Resist pointing production `App` targets at `Test` libs to "share helpers." Use a dedicated `Lib` target for shared code.

See also [project resolution](/book/reference/projects/resolution/).
