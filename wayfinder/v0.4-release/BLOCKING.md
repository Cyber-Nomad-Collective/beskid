## Blocking relationships (Linear dependency edges)

After creating all tickets as Linear issues, wire these blocking edges:

```
[13 Compiler submodule fix] ──blocks──> everything that needs a local build
                    │
                    ├──> [09 LambdaExpression ISLE] ──> [11 ISLE Syscall fact fixes]
                    │         │
                    │         └──> [05 macOS arm64 kit] (parallel, needs lowered compiler)
                    │         └──> [06 Windows x86-64 kit] (parallel, needs lowered compiler)
                    │
                    ├──> [10 TryExpression desugaring]
                    │
                    ├──> [11 ISLE Syscall fact fixes] ──> corelib gate green
                    │
                    ├──> [12 JIT SIGILL debug] ──> corelib gate green
                    │
                    └──> [07 Tracker seed sync] (independent, different submodule)

[03 Platform-spec sync scope] ──blocks──> (future platform-spec edit tickets)

[04 Catalog embeddability] ──blocks──> (future catalog regeneration ticket)

[08 CHANGELOG 0.4.0 cutoff] ──no blockers── (can start now, final date stamped at release)
```

## Frontier (unblocked, unclaimed)

After issue creation:
- 03 Platform-spec sync scope (grilling, HITL)
- 04 Catalog embeddability (grilling, HITL)
- 05 macOS arm64 kit (task, AFK) — needs working compiler first, but can prep build infra
- 06 Windows x86-64 kit (task, AFK) — same
- 07 Tracker seed sync (task, AFK)
- 08 CHANGELOG 0.4.0 cutoff (task, AFK)
- 13 Compiler submodule fix (task, AFK) — **P0, blocks everything local**

## Ticket type summary

| # | Title | Type | Mode | Blocks |
|---|-------|------|------|--------|
| 01 | ISLE lowering coverage audit | `research` | AFK | **RESOLVED** |
| 02 | Corelib gate current state | `research` | AFK | **RESOLVED** |
| 03 | Platform-spec 0.4 sync scope | `grilling` | HITL | — |
| 04 | Catalog embeddability approach | `grilling` | HITL | — |
| 05 | macOS arm64 kit (CYB-170) | `task` | AFK | — |
| 06 | Windows x86-64 kit (CYB-171) | `task` | AFK | — |
| 07 | Tracker seed data sync (CYB-177) | `task` | AFK | — |
| 08 | CHANGELOG 0.4.0 cutoff | `task` | AFK | — |
| 09 | LambdaExpression ISLE lowering (CYB-173) | `task` | AFK | blocked by 13 |
| 10 | TryExpression desugaring (CYB-174) | `task` | AFK | blocked by 13 |
| 11 | ISLE Syscall fact/rule fixes (C1) | `task` | AFK | blocked by 13, 09 |
| 12 | JIT SIGILL debug (C2) | `task` | AFK | blocked by 13 |
| 13 | Compiler submodule fix | `task` | AFK | — **P0** |
