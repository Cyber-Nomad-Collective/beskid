# Baseline pins — 2026-07-23 planning pass

| Artifact | Value |
| --- | --- |
| Superrepo HEAD | `c765ef51fec8e4eba15a1165333498574332e3c4` |
| Superrepo subject | chore(compiler): land parse recovery and ISLE float/unsigned gaps |
| Compiler submodule | `ec164ff9d2f9a3bd08f64b65be925441de706bde` |
| Compiler subject | feat(isle): complete float/unsigned lowering and trusted CLIF primitives |
| OpenSpec change | `openspec/changes/hir-free-isle-abi-v5-native-runtime/` |
| Prior plan | `docs/superpowers/plans/2026-07-14-0.4-release-closure.md` (stale vs Linear: W1–W4 Done) |
| Prior readiness | `docs/superpowers/reports/2026-07-20-0.4-readiness-baseline.md` |
| Compiler CI | https://github.com/Cyber-Nomad-Collective/beskid/actions/runs/29977866956 failure (clippy) |
| Corelib CI | https://github.com/Cyber-Nomad-Collective/beskid/actions/runs/29977866969 failure (exit 132 / SIGILL after JIT) |
| Tracker CI | https://github.com/Cyber-Nomad-Collective/beskid/actions/runs/29977866963 failure (bun/trudoc 404 + lockfile) |

## Linear parent status (project Beskid 0.4 Release)

| Parent | Status | Notes |
| --- | --- | --- |
| CYB-5 W1 | Done | CYB-12–15 Done |
| CYB-6 W2 | Done | CYB-16–19, CYB-64 Done |
| CYB-7 W3 | Done | CYB-20–22, CYB-82 Done; CYB-23 Duplicate |
| CYB-8 W4 | Done | CYB-24–27, CYB-65 Done |
| CYB-9 W5 | In Progress | matrix + W5.9* corelib blockers active |
| CYB-10 W6 | In Progress | retirement Todo/Backlog |
| CYB-11 W7 | In Progress | evidence Todo; CYB-42/87 Done |

