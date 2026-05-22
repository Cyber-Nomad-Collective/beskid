---
title: "Dependency cycles"
description: Keeping the workspace DAG acyclic and surviving circular path deps."
tableOfContents: true
---

Cycles are how monorepos learn humility. The resolver builds a **DAG**—if you create a cycle, nothing moral happens next.

## Healthy layering

```mermaid
flowchart BT
  UTIL[util lib] --> CORE[core lib]
  CORE --> APP[app]
```

Forbidden emotional support:

```mermaid
flowchart LR
  A[project A] --> B[project B]
  B --> A
```

## Path dependency cycles

With `source = path`, cycles are just folders pointing at each other. Symptoms:

- Resolution failures
- Nondeterministic build order in tooling that assumed a DAG

Fix by extracting shared types into a third **lower** library both sides depend on—classic graph surgery, not compiler therapy.

## Test-only backdoors

Resist pointing production `App` targets at `Test` libs to "share helpers." Use a dedicated `Lib` target for shared code.

## Reference

- [Project Resolution](/book/reference/projects/resolution/)

## Next

[CI and monorepos](/book/06-monorepo-as-coping-mechanism/ci-and-monorepos/)
