---
title: "SOLID, DRY, and the failure of DDD"
description: When good principles become mandatory abstraction layers.
tableOfContents: true
---

SOLID and DRY are **fine**. They became a problem when the industry turned them into **religion** and DDD into **mandatory theatre**.

![Dramatic preaching](https://i.programmerhumor.io/2025/03/a6cf548aeab484a4eeba710ca81c750e.png)

## SOLID — principles, not a building code

- **S**ingle responsibility: good until every class is one line and your navigation is a war crime.
- **O**pen/closed: good until you wrap everything in inheritance because "extension points."
- **L**iskov: good until nobody can explain why your "rectangle" broke the square.
- **I**nterface segregation: good until you have seventeen `IThingReader` variants for one CSV import.
- **D**ependency inversion: good until it means **a DI container black box** that injects everything because it can.

![Too many layers](https://i.redd.it/ig9v26m7nvl91.png)

Beskid's compiler-side take (see also the [compiler README](https://github.com/Cyber-Nomad-Collective/beskid_compiler)): **IoC is a direction; IoC frameworks are not.** Inversion of control belongs in **compile-time wiring you can verify**, not in runtime indirection you discover when production logs start speaking in interfaces.

## DRY — do not repeat yourself (into a monolith)

DRY was never "one copy of every string in the universe." It was **one authoritative place for each rule**.

What happened in the wild:

- Shared "utility" assemblies that couple every service to every other service's mistakes.
- Generic repositories because someone heard DRY and panicked.
- Abstractions that exist only so two teams do not **talk to each other**.

![Warning — wrong abstraction](https://media.giphy.com/media/hcVMVJ3UELapCwWnoO/giphy.gif)

Sometimes repetition is **cheaper than the wrong abstraction**. Beskid prefers **compile-time reuse** (modules, metaprogramming) over **runtime cleverness** (reflection, service locator soup).

## DDD — domain-driven déjà vu

Domain-Driven Design contains useful ideas: **ubiquitous language**, bounded contexts, explicit boundaries. The industry implementation is often:

1. Draw aggregates on a whiteboard.
2. Invent seventeen entity types for a table with four columns.
3. Add "domain services" because the entity got fat.
4. Add "application services" because the domain service got fat.
5. Add "infrastructure" folders until the repo looks like a matryoshka doll of interfaces.
6. Ship the same CRUD anyway, but now onboarding takes a quarter.

![Nested layers — matryoshka architecture](https://lh3.googleusercontent.com/QZrdOxvCPHPwUaUx8lJlWH3i_VIZpZc1IGQdsvNARqVhEJIqf1qDpo1no5g-w8bL6TdhH-QX7_4Grlq3UGaBHL_p633Pznw3ISCNUEMw3EAlswTJgKZJTMTKNAH8rh1dYHG3SU_sS6oZ4ZE-DVHkMfZ4iZeIoqSVig2tQZuf--PCP53LLOzVjRBdfQ)

DDD **forces overcomplication** when:

- The business is **mostly state transitions on rows** (it usually is).
- The team treats patterns as **moral requirements**, not tools.
- "Rich domain models" become **anemic data with aggressive naming**.

The failure mode is not DDD the book—it is **DDD the performance**: architects performing complexity so stakeholders feel sophistication.

![Standing ovation for the performance](https://pbs.twimg.com/media/FgZRclhX0AUshJC.jpg)

## What Beskid does instead (preview)

- **Language features are language features**—not ten layers of corelib and framework glue.
- Prefer **explicit modules and compile-time composition** over runtime discovery.
- Make illegal states harder at compile time without inventing a new bounded context for `EmailAddress`.

Next: [1.5 Trauma — by developers, for developers](/book/00-why-beskid-exists/trauma-by-developers-for-developers/).
