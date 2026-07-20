# CYB-68 — Clean-checkout compiler gate evidence

**Issue:** CYB-68 (W7.C1) — evidence packet for parent **CYB-40**  
**Date:** 2026-07-20  
**Branch:** `cursor/cyb-68-w7c-evidence`  
**Worktree:** `/Users/mikserek/Projects/beskid/.worktrees/cyb-68`  
**Interpretation:** Codex owns interpretation of this packet. This document records commands, SHAs, counts, and failure names only — no diagnosis, waivers, or CYB-40 closure.

## Checkouts

| Repo | SHA |
|------|-----|
| Root (beskid) | `9f1d88fd86fdff2ccb6d14dc2e2c687bc8b06f7f` |
| Compiler submodule | `79eccbd9fa8dd975b8ed6dfcfb6056eb1894efef` |

Pre-run: worktree `git status` clean after `git submodule update --init --recursive` (required so `beskid_bsol` / `bsol` manifests resolve).

## Environment

```
Darwin mac-d.local 25.5.0 Darwin Kernel Version 25.5.0: Mon Apr 27 20:39:42 PDT 2026; root:xnu-12377.121.6~2/RELEASE_ARM64_T6031 arm64
rustc 1.96.0 (ac68faa20 2026-05-25)
cargo 1.96.0 (30a34c682 2026-05-25)
```

Log: `docs/superpowers/reports/cyb-68-logs/environment.txt`

## Command table

| Command | Duration | Result | Passed | Failed | Ignored | Log |
|---------|----------|--------|--------|--------|---------|-----|
| `cargo test -p beskid_analysis --all-targets` | 48s | pass (exit 0) | 191 | 0 | 0 | `cyb-68-logs/beskid_analysis.log` |
| `cargo test -p beskid_queries --tests -- --test-threads=1` | 49s | pass (exit 0) | 91 | 0 | 0 | `cyb-68-logs/beskid_queries.log` |
| `cargo test -p beskid_lsp --lib -- --test-threads=1` | 62s | pass (exit 0) | 52 | 0 | 0 | `cyb-68-logs/beskid_lsp.log` |
| `cargo test -p beskid_codegen --all-targets` | 31s | pass (exit 0) | 64 | 0 | 1 | `cyb-68-logs/beskid_codegen.log` |
| `cargo test -p beskid_isle --all-targets` | 38s | pass (exit 0) | 44 | 0 | 0 | `cyb-68-logs/beskid_isle.log` |
| `cargo test -p beskid_jit --all-targets` | — | **skipped** (crate missing under `compiler/crates/`) | — | — | — | — |
| `cargo test -p beskid_aot --all-targets` | 29s | pass (exit 0) | 18 | 0 | 0 | `cyb-68-logs/beskid_aot.log` |
| `cargo test --workspace --all-targets` (attempt 1) | 78s | fail (exit 101) — compile aborted; no `test result:` lines | 0 | 0 | 0 | `cyb-68-logs/workspace-all-targets.attempt1-enospace.tail200.log` |
| `cargo test --workspace --all-targets` (attempt 2, after freeing disk; `CARGO_INCREMENTAL=0`) | 129s | fail (exit 101) | 61 | 1 | 0 | `cyb-68-logs/workspace-all-targets.log` (last 200 lines) |

Focused suite rollup summary: `cyb-68-logs/focused-summary.txt`  
Workspace attempt summaries: `cyb-68-logs/workspace-summary.attempt1.txt`, `cyb-68-logs/workspace-summary.txt`

### Workspace attempt notes (factual)

- Attempt 1 log extract contains `No space left on device` / `could not compile` for multiple crates; no unit-test failures recorded.
- Attempt 2 ran after reclaiming disk (worktree + main `compiler/target` removed). Cargo stopped after the first failing test package (default fail-fast). Remaining workspace packages were not executed.

## Compact failure list

| Test name | Crate / target |
|-----------|----------------|
| `sysv_context_enters_returns_and_switches_repeatedly` | `beskid_abi` (`--test x86_64_linux_context_assembly`) |

No other named test failures were recorded in attempt 2 before cargo exited. Attempt 1 had no named test failures (build/IO abort only).

## Artifacts

Directory: `docs/superpowers/reports/cyb-68-logs/`

- Compact per-crate focused logs (grep of `running` / `test result` + tail)
- Workspace attempt 1: ENOSPC tail-200 + error extract
- Workspace attempt 2: last 200 lines + summary/aggregate

## Ownership

Codex owns interpretation of this evidence relative to CYB-40. CYB-68 is capture-only; no gate waiver and no CYB-40 close from this packet.
