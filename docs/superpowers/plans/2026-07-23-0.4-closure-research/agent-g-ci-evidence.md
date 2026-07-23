# Agent G — GitHub Actions and release evidence (read-only)

**Agent:** [Agent G](676656b6-af9d-47ee-a6b9-a13182603ee0)  
**Pin pair (tip):** superrepo `c765ef51` · compiler `ec164ff9`

## Current Actions health summary

| Workflow | Run | Status | Key jobs |
|---|---|---|---|
| **Compiler** | [29977866956](https://github.com/Cyber-Nomad-Collective/beskid/actions/runs/29977866956) | **FAILURE** | `Rust gate` FAIL (clippy); all release/matrix jobs **skipped** |
| **Corelib** | [29977866969](https://github.com/Cyber-Nomad-Collective/beskid/actions/runs/29977866969) | **FAILURE** | exit 132; report artifact uploaded |
| **Tracker platform delivery** | [29977866963](https://github.com/Cyber-Nomad-Collective/beskid/actions/runs/29977866963) | **FAILURE** | trudoc 404 / lockfile drift — not compiler |
| **Platform delivery** | [29977867065](https://github.com/Cyber-Nomad-Collective/beskid/actions/runs/29977867065) | pending | queued behind production approval wait |
| **Distribute / Open VSX** | [29977914167](https://github.com/Cyber-Nomad-Collective/beskid/actions/runs/29977914167) / [29977914160](https://github.com/Cyber-Nomad-Collective/beskid/actions/runs/29977914160) | skipped | Compiler-success guard |

No green Compiler/Corelib on `main` after ~2026-07-22 11:53 (last Compiler success [29917413684](https://github.com/Cyber-Nomad-Collective/beskid/actions/runs/29917413684)).

## True compile blockers

1. RC2 — Post-JIT SIGILL / exit 132 on OutputWriteLine (Corelib).
2. RC1 — MissingRuleOrFact for Syscall surfaces (full Corelib green).
3. RC3–RC5 — runtime/Rust/HIR retirement (release claim).
4. Clippy in `beskid_analysis` — hygiene that skips matrix/publish evidence.

## CI-only (misleading)

- trudoc 404 on npmjs vs GH Packages
- Bun frozen lockfile after pnpm migration
- Distribute/Open VSX skipped (cascade)
- Platform delivery stuck on production environment reviewers
- GHCR sibling package Write grants

## Required workflow fixes

1. Clippy → unlock Compiler downstream.
2. RC2 (+ RC1) → Corelib Linux execute proof.
3. Trudoc registry + Bun lockfile (orthogonal).
4. Cancel/approve stuck platform wait; consider concurrency cancel for non-promote.
5. Wire retirement scan into CI (Agent F); fix Linux verify test-name filter (Agent D).

## Evidence collection plan

- Phase A: green Rust gate on tip pin pair.
- Phase B: Linux empty-prefix JIT+AOT (CYB-32) — language proof.
- Phase C: Windows matrix job + macOS kit cells (may need new macOS kit job).
- Phase D: packaging/Coolify optional for language 0.4.

## Final sign-off checklist

See Agent G full response in synthesis; key: tip SHAs, Rust gate, Linux JIT+AOT, kit fail-closed, Windows/macOS matrix, three-target publish, Corelib green or closed RCs, retirement for W6 claim, platform noise marked orthogonal.
